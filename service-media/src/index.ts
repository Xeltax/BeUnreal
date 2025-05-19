import express from "express";
import dotenv from 'dotenv'
import cors from 'cors';
import mediaRoutes from "./routes/media-routes";
import sequelize from "./config/database";

dotenv.config()
const BUCKET_NAME = process.env.BUCKET_NAME ?? "media";

const app = express();
const port = process.env.PORT ?? 3002;

app.use(cors());
app.use(express.json())

app.use("/api/media/", mediaRoutes)

sequelize
    .sync({ alter: true})
    .then(() => {
        console.log('Base de données synchronisée');
        app.listen(port, () => {
            console.log(`Bucket utilisé pour les fichiers : ${BUCKET_NAME}`)
            console.log(`Service media démarré sur le port ${port}`);
        });
    })
    .catch(err => {
        console.error('Erreur de synchronisation de la base de données:', err);
    })