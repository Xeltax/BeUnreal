import {Request, Response} from 'express';
import {deleteFile, getPresignedUrl, uploadFile} from "../minio-client";
import dotenv from "dotenv";
import {Media} from '../models/Media'
import sequelize from '../config/database'
import {QueryTypes} from "sequelize";

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

        await Media.create({
            userId: (req as any).userId,
            mediaUrl: key,
            isPublic: false,
            createdAt: new Date()
        })

        res.status(201).json({ key });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error : "Erreur lors de l'upload" });
    }
}

export const PostPublicStory = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error : "Fichier manquant"});
            return;
        }

        const latitude = parseFloat(req.body.latitude)
        const longitude = parseFloat(req.body.longitude)

        if (!latitude) {
            res.status(400).json({ error: "Latitude attendue dans le body" })
            return
        }

        if (!longitude) {
            res.status(400).json({ error: "Longitude attendue dans le body" })
            return
        }

        const key = `${Date.now()}_${req.file.originalname}`;
        await uploadFile(BUCKET_NAME, key, req.file.buffer);

        await Media.create({
            userId: (req as any).userId,
            mediaUrl: key,
            isPublic: true,
            latitude: latitude,
            longitude: longitude,
            createdAt: new Date()
        })

        res.status(201).json({ key, latitude, longitude })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error : "Erreur lors de l'upload" });
    }
}

export const GetStoriesAround = async (req: Request, res: Response): Promise<void> => {
    const latitude = parseFloat(req.body.latitude)
    const longitude = parseFloat(req.body.longitude)
    const radius = parseInt(req.body.radius)

    if (latitude === undefined) {
        res.status(400).json({ error: "Latitude attendue dans le body" })
        return
    }

    if (longitude === undefined) {
        res.status(400).json({ error: "Longitude attendue dans le body" })
        return
    }

    if (radius === undefined) {
        res.status(400).json({ error: "Radius attendue dans le body" })
        return
    }

    try {
        const results = await sequelize.query(
            `
                SELECT *
                FROM (SELECT *,
                             (
                                 6371000 * acos(
                                         cos(radians(:latitude)) * cos(radians(latitude)) *
                                         cos(radians(longitude) - radians(:longitude)) +
                                         sin(radians(:latitude)) * sin(radians(latitude))
                                           )
                                 ) AS distance
                      FROM medias
                      WHERE "isPublic" = true
                        AND latitude BETWEEN (:latitude - :radius / 111000.0) AND (:latitude + :radius / 111000.0)
                        AND longitude BETWEEN (:longitude - :radius / 111000.0) AND (:longitude + :radius / 111000.0)) AS sub
                WHERE distance <= :radius
                ORDER BY distance;
            `, {
                replacements: { latitude, longitude, radius },
                type: QueryTypes.SELECT,
                model: Media
            }
        )

        for (let media of results) {
            if (!media.userId) {
                continue
            }

            const response = await fetch(`http://localhost:3000/api/users/internal/profile/${media.userId}`)

            if (!response.ok) {
                continue
            }

            media.user = (await (await response.json()))
        }

        res.status(200).json(results.map(media => ({
            id: media.id,
            userId: media.userId,
            user: media.user,
            mediaUrl: media.mediaUrl,
            city: media.city,
            createdAt: media.createdAt,
            isPublic: media.isPublic,
            latitude: media.latitude,
            longitude: media.longitude,
        })) ?? []);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Erreur lors de la récupération des stories"});
    }
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

        await Media.destroy({
            where: {
                mediaUrl: key
            }
        })

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression du média");
    }
}