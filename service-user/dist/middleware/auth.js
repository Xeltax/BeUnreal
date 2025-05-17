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
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Message_1 = __importDefault(require("../models/Message"));
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Récupérer le token du header
            token = req.headers.authorization.split(' ')[1];
            // Vérifier le token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            // Récupérer l'utilisateur du token
            const user = yield Message_1.default.findByPk(decoded.id, {
                attributes: { exclude: ['password'] },
            });
            if (!user) {
                res.status(401).json({ message: 'Non autorisé, utilisateur non trouvé' });
                return;
            }
            // Ajouter l'ID utilisateur à la requête
            req.userId = decoded.id;
            next();
        }
        catch (error) {
            res.status(401).json({ message: 'Non autorisé, token invalide' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Non autorisé, pas de token' });
    }
});
exports.protect = protect;
