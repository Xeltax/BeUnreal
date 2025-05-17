import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import messageRoutes from './routes/messageRoutes';
import sequelize from './config/database';
import socketService from './socket/socketService';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/messages', messageRoutes);

// Route de test
app.get('/', (req, res) => {
    res.send('API Microservice Messages fonctionne!');
});

// Initialiser Socket.io
socketService(server);

// Synchroniser la base de données et démarrer le serveur
sequelize
    .sync({ alter: true })
    .then(() => {
        console.log('Base de données synchronisée');
        server.listen(PORT, () => {
            console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Erreur de synchronisation de la base de données:', err);
    });