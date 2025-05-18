import express from "express";
import multer from "multer";
import dotenv from 'dotenv'
import {deleteFile, getPresignedUrl, uploadFile} from "./minio-client";

dotenv.config()

const app = express();
const port = process.env.PORT ?? 3002;
const BUCKET_NAME = process.env.BUCKET_NAME ?? "media";

// Multer setup pour réception de fichiers
const upload = multer({ storage: multer.memoryStorage() });

// POST /media - upload fichier
app.post("/media", upload.single("file"), async (req, res): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error : "Fichier manquant"});
            return;
        }

        const key = `${Date.now()}_${req.file.originalname}`;

        await uploadFile(BUCKET_NAME, key, req.file.buffer);

        res.status(201).json({ key });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error : "Erreur lors de l'upload" });
    }
});

// GET /media/:key - récupérer URL pré-signée pour accès au fichier
app.get("/media/:key", async (req, res): Promise<void> => {
    try {
        const key = req.params.key;
        const url = await getPresignedUrl(BUCKET_NAME, key, 600);
        res.json({ url });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération du média");
    }
});

// DELETE /media/:key - suppression fichier
app.delete("/media/:key", async (req, res): Promise<void> => {
    try {
        const key = req.params.key;
        await deleteFile(BUCKET_NAME, key);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression du média");
    }
});

app.listen(port, () => {
    console.log(`Bucket utilisé pour les fichiers : ${BUCKET_NAME}`)
    console.log(`Service media démarré sur le port ${port}`);
});