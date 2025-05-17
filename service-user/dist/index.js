"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const database_1 = __importDefault(require("./config/database"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/users', userRoutes_1.default);
// Route de test
app.get('/', (req, res) => {
    res.send('API Microservice Utilisateurs fonctionne!');
});
// Synchroniser la base de données et démarrer le serveur
database_1.default
    .sync({ alter: true })
    .then(() => {
    console.log('Base de données synchronisée');
    app.listen(PORT, () => {
        console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
    });
})
    .catch((err) => {
    console.error('Erreur de synchronisation de la base de données:', err);
});
