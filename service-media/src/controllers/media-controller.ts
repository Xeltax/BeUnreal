import {Request, Response} from 'express';
import {deleteFile, getPresignedUrl, uploadFile} from "../minio-client";
import dotenv from "dotenv";

dotenv.config()
const BUCKET_NAME = process.env.BUCKET_NAME ?? "media";

export const PostMedia = async (req: Request, res: Response): Promise<void> => {
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
}

export const PostPublicStory = async (req: Request, res: Response): Promise<void> => {

}

export const GetMedia = async (req: Request, res: Response): Promise<void> => {
    try {
        const key = req.params.key;
        const url = await getPresignedUrl(BUCKET_NAME, key, 600);
        res.json({ url });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération du média");
    }
}

export const DeleteMedia = async (req: Request, res: Response): Promise<void> => {
    try {
        const key = req.params.key;
        await deleteFile(BUCKET_NAME, key);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression du média");
    }
}