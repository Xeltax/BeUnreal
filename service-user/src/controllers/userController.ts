import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

// Fonction pour générer un token JWT
const generateToken = (id: number): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    console.log("Registering user...");
    try {
        const { username, email, password } = req.body;

        const userExists = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }],
            },
        });

        if (userExists) {
            res.status(400).json({ message: 'Utilisateur déjà existant' });
            return;
        }

        // Créer l'utilisateur
        const user = await User.create({
            username,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                user : {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    profilePicture: user.profilePicture,
                    bio: user.bio,
                    latitude: user.latitude,
                    longitude: user.longitude,
                },
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Données utilisateur invalides' });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

// Connecter un utilisateur
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ where: { email } });

        if (!user) {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            return;
        }

        // Vérifier le mot de passe
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            return;
        }

        // Mettre à jour lastActive
        user.lastActive = new Date();
        await user.save();

        res.status(200).json({
            user : {
                id: user.id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
                latitude: user.latitude,
                longitude: user.longitude,
            },
            token: generateToken(user.id),
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

// Récupérer le profil de l'utilisateur
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findByPk((req as any).userId, {
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

// Mettre à jour le profil de l'utilisateur
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findByPk((req as any).userId);

        if (!user) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }

        const { username, email, bio, profilePicture, latitude, longitude } = req.body;

        if (username) user.username = username;
        if (email) user.email = email;
        if (bio !== undefined) user.bio = bio;
        if (profilePicture) user.profilePicture = profilePicture;
        if (latitude) user.latitude = latitude;
        if (longitude) user.longitude = longitude;

        await user.save();

        res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            profilePicture: user.profilePicture,
            latitude: user.latitude,
            longitude: user.longitude,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

// Supprimer un utilisateur
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findByPk((req as any).userId);

        if (!user) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }

        await user.destroy();
        res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

// Rechercher des utilisateurs par email ou id
export const findUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.query;

        if (!query) {
            res.status(400).json({ message: 'Paramètre de recherche requis' });
            return;
        }

        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { email: { [Op.iLike]: `%${query}%` } },
                    { username: { [Op.iLike]: `%${query}%` } },
                    { id: isNaN(Number(query)) ? undefined : Number(query) },
                ].filter(Boolean),
            },
            attributes: ['id', 'username', 'email', 'profilePicture', 'bio'],
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

// Rechercher des utilisateurs par géolocalisation
export const findUsersByLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { latitude, longitude, distance = 10 } = req.query;

        if (!latitude || !longitude) {
            res.status(400).json({ message: 'Latitude et longitude requises' });
            return;
        }

        const lat = parseFloat(latitude as string);
        const lon = parseFloat(longitude as string);
        const dist = parseFloat(distance as string);

        // Calcul simple pour trouver des utilisateurs dans un rayon donné
        // Note: Ceci est une simplification, un calcul plus précis utiliserait la formule de Haversine
        const users = await User.findAll({
            where: {
                latitude: { [Op.between]: [lat - dist/111.12, lat + dist/111.12] },
                longitude: { [Op.between]: [lon - dist/(111.12 * Math.cos(lat * Math.PI/180)), lon + dist/(111.12 * Math.cos(lat * Math.PI/180))] },
            },
            attributes: ['id', 'username', 'profilePicture', 'latitude', 'longitude', 'lastActive'],
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

// Mettre à jour la position de l'utilisateur
export const updateUserLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            res.status(400).json({ message: 'Latitude et longitude requises' });
            return;
        }

        const user = await User.findByPk((req as any).userId);

        if (!user) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }

        user.latitude = latitude;
        user.longitude = longitude;
        user.lastActive = new Date();
        await user.save();

        res.status(200).json({
            id: user.id,
            latitude: user.latitude,
            longitude: user.longitude,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};