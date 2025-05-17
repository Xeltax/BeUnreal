import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import sequelize from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);

// Route de test
app.get('/', (req, res) => {
    res.send('API Microservice Utilisateurs fonctionne!');
});

// Synchroniser la base de données et démarrer le serveur
sequelize
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