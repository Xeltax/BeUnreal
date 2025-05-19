import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    deleteUser,
    findUsers,
    findUsersByLocation,
    updateUserLocation,
} from '../controllers/userController';
import {protect, userIdFromParams} from '../middleware/auth';

const router = express.Router();

// Routes publiques
router.post('/register', registerUser);
router.post('/login', loginUser);

// Routes protégées
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUser);
router.get('/search', protect, findUsers);
router.get('/nearby', protect, findUsersByLocation);
router.put('/location', protect, updateUserLocation);

router.get('/internal/profile/:id', userIdFromParams, getUserProfile)

export default router;