import express from 'express';
import {
    createOrGetConversation,
    createGroupConversation,
    getUserConversations,
    getConversationMessages,
    sendTextMessage,
    sendMediaMessage,
} from '../controllers/messageController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

router.post('/conversation', createOrGetConversation);
router.post('/group', createGroupConversation);
router.get('/conversations', getUserConversations);
router.get('/conversation/:conversationId', getConversationMessages);
router.post('/text', sendTextMessage);
router.post('/media', sendMediaMessage);

export default router;