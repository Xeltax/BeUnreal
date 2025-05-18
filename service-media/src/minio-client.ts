import {
    CreateBucketCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadBucketCommand,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {Readable} from "stream";
import dotenv from "dotenv";

dotenv.config()

// Configuration MinIO (S3 compatible)
const REGION = "us-east-1"; // Région arbitraire, MinIO ne la prend pas vraiment en compte pour une utilisation purement locale
const ENDPOINT = process.env.MINIO_HOST!
const ACCESS_KEY = process.env.MINIO_USER!
const SECRET_KEY = process.env.MINIO_PASSWORD!

const s3Config = {
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },
    forcePathStyle: true, // important pour MinIO
}
const s3Client = new S3Client(s3Config);
console.log('S3 client configuration :')
console.log(s3Config)

export async function uploadFile(bucketName: string, key: string, body: Buffer | Readable) {
    try {   // Vérifie si le bucket existe
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (err: any) {
        if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
            console.log(`Bucket '${bucketName}' non trouvé. Création...`);
            await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
            console.log(`Bucket '${bucketName}' créé`);
        } else {
            console.error("Erreur lors de la vérification du bucket :", err);
            throw err;
        }
    }

    // Upload du fichier
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
    });

    await s3Client.send(command);
    console.log(`Fichier uploadé dans le bucket '${bucketName}' avec la clé : ${key}`);
}

export async function getPresignedUrl(bucketName: string, key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, {expiresIn: expiresInSeconds});
}

export async function deleteFile(bucketName: string, key: string) {
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    await s3Client.send(command);
    console.log(`File deleted from bucket '${bucketName}' with key: ${key}`);
}