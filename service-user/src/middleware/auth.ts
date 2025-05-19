import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
    id: number;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Récupérer le token du header
            token = req.headers.authorization.split(' ')[1];

            // Vérifier le token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;

            // Récupérer l'utilisateur du token
            const user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] },
            });

            if (!user) {
                res.status(401).json({ message: 'Non autorisé, utilisateur non trouvé' });
                return;
            }

            // Ajouter l'ID utilisateur à la requête
            (req as any).userId = decoded.id;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Non autorisé, token invalide' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Non autorisé, pas de token' });
    }
};

export const userIdFromParams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.params.id) {
        (req as any).userId = req.params.id
        next()
    } else {
        res.status(400).json({ message: 'Id utilisateur attendu /internal/profile/:id' })
    }
}