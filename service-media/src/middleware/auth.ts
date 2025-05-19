import {NextFunction, Request, Response} from 'express';
import User from "../models/User";

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {

            // Récupérer l'utilisateur du token par le service users
            const response = await fetch("http://localhost:3000/api/users/profile", {
                headers: {
                    authorization: req.headers.authorization
                }
            })

            if (!response.ok) {
                res.status(401).json({ message: 'Non autorisé, utilisateur non trouvé' });
                return
            }

            const user: User = (await (await response.json()));
            (req as any).userId = user.id;
            next();
        } catch (error) {
            console.error(error)
            res.status(401).json({ message: 'Non autorisé, token invalide' });
        }
    } else {
        res.status(401).json({ message: 'Non autorisé, pas de token' });
    }
};