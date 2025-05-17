"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Routes publiques
router.post('/register', userController_1.registerUser);
router.post('/login', userController_1.loginUser);
// Routes protégées
router.get('/profile', auth_1.protect, userController_1.getUserProfile);
router.put('/profile', auth_1.protect, userController_1.updateUserProfile);
router.delete('/profile', auth_1.protect, userController_1.deleteUser);
router.get('/search', auth_1.protect, userController_1.findUsers);
router.get('/nearby', auth_1.protect, userController_1.findUsersByLocation);
router.put('/location', auth_1.protect, userController_1.updateUserLocation);
exports.default = router;
