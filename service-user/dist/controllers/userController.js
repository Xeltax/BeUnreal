"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserLocation = exports.findUsersByLocation = exports.findUsers = exports.deleteUser = exports.updateUserProfile = exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const Message_1 = __importDefault(require("../models/Message"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sequelize_1 = require("sequelize");
// Fonction pour générer un token JWT
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};
// Créer un utilisateur
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        // Vérifier si l'utilisateur existe déjà
        const userExists = yield Message_1.default.findOne({
            where: {
                [sequelize_1.Op.or]: [{ email }, { username }],
            },
        });
        if (userExists) {
            res.status(400).json({ message: 'Utilisateur déjà existant' });
            return;
        }
        // Créer l'utilisateur
        const user = yield Message_1.default.create({
            username,
            email,
            password,
        });
        if (user) {
            res.status(201).json({
                id: user.id,
                username: user.username,
                email: user.email,
                token: generateToken(user.id),
            });
        }
        else {
            res.status(400).json({ message: 'Données utilisateur invalides' });
        }
    }
    catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: error.message,
        });
    }
});
exports.registerUser = registerUser;
// Connecter un utilisateur
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Vérifier si l'utilisateur existe
        const user = yield Message_1.default.findOne({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            return;
        }
        // Vérifier le mot de passe
        const isPasswordValid = yield user.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            return;
        }
        // Mettre à jour lastActive
        user.lastActive = new Date();
        yield user.save();
        res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email,
            token: generateToken(user.id),
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: error.message,
        });
    }
});
exports.loginUser = loginUser;
// Récupérer le profil de l'utilisateur
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield Message_1.default.findByPk(req.userId, {
            attributes: { exclude: ['password'] },
        });
        if (!user) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: error.message,
        });
    }
});
exports.getUserProfile = getUserProfile;
// Mettre à jour le profil de l'utilisateur
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield Message_1.default.findByPk(req.userId);
        if (!user) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }
        const { username, email, bio, profilePicture, latitude, longitude } = req.body;
        if (username)
            user.username = username;
        if (email)
            user.email = email;
        if (bio !== undefined)
            user.bio = bio;
        if (profilePicture)
            user.profilePicture = profilePicture;
        if (latitude)
            user.latitude = latitude;
        if (longitude)
            user.longitude = longitude;
        yield user.save();
        res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            profilePicture: user.profilePicture,
            latitude: user.latitude,
            longitude: user.longitude,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: error.message,
        });
    }
});
exports.updateUserProfile = updateUserProfile;
// Supprimer un utilisateur
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield Message_1.default.findByPk(req.userId);
        if (!user) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }
        yield user.destroy();
        res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    }
    catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: error.message,
        });
    }
});
exports.deleteUser = deleteUser;
// Rechercher des utilisateurs par email ou id
const findUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.query;
        if (!query) {
            res.status(400).json({ message: 'Paramètre de recherche requis' });
            return;
        }
        const users = yield Message_1.default.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { email: { [sequelize_1.Op.iLike]: `%${query}%` } },
                    { username: { [sequelize_1.Op.iLike]: `%${query}%` } },
                    { id: isNaN(Number(query)) ? undefined : Number(query) },
                ].filter(Boolean),
            },
            attributes: ['id', 'username', 'email', 'profilePicture', 'bio'],
        });
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: error.message,
        });
    }
});
exports.findUsers = findUsers;
// Rechercher des utilisateurs par géolocalisation
const findUsersByLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { latitude, longitude, distance = 10 } = req.query;
        if (!latitude || !longitude) {
            res.status(400).json({ message: 'Latitude et longitude requises' });
            return;
        }
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const dist = parseFloat(distance);
        // Calcul simple pour trouver des utilisateurs dans un rayon donné
        // Note: Ceci est une simplification, un calcul plus précis utiliserait la formule de Haversine
        const users = yield Message_1.default.findAll({
            where: {
                latitude: { [sequelize_1.Op.between]: [lat - dist / 111.12, lat + dist / 111.12] },
                longitude: { [sequelize_1.Op.between]: [lon - dist / (111.12 * Math.cos(lat * Math.PI / 180)), lon + dist / (111.12 * Math.cos(lat * Math.PI / 180))] },
            },
            attributes: ['id', 'username', 'profilePicture', 'latitude', 'longitude', 'lastActive'],
        });
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: error.message,
        });
    }
});
exports.findUsersByLocation = findUsersByLocation;
// Mettre à jour la position de l'utilisateur
const updateUserLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { latitude, longitude } = req.body;
        if (!latitude || !longitude) {
            res.status(400).json({ message: 'Latitude et longitude requises' });
            return;
        }
        const user = yield Message_1.default.findByPk(req.userId);
        if (!user) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }
        user.latitude = latitude;
        user.longitude = longitude;
        user.lastActive = new Date();
        yield user.save();
        res.status(200).json({
            id: user.id,
            latitude: user.latitude,
            longitude: user.longitude,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: error.message,
        });
    }
});
exports.updateUserLocation = updateUserLocation;
