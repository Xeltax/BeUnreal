import express from "express";
import {DeleteMedia, GetMedia, PostMedia} from "../controllers/media-controller";
import multer from "multer";
import {protect} from "../middleware/auth";

// Multer setup pour réception de fichiers
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router()

router.post('/', protect, upload.single('file'), PostMedia)
router.get('/:key', protect, GetMedia)
router.delete('/:key', protect, DeleteMedia)

export default router