import express from 'express';
import {
    sendFriendRequest,
    respondToFriendRequest,
    blockUser,
    unblockUser,
    removeFriend,
    getFriends,
    getPendingFriendRequests,
    searchUsers,
} from '../controllers/friendshipController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes de gestion des amis
router.post('/request', sendFriendRequest);
router.post('/respond', respondToFriendRequest);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.post('/remove', removeFriend);
router.get('/list', getFriends);
router.get('/pending', getPendingFriendRequests);
router.get('/search', searchUsers);

export default router;