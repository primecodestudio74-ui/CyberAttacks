import express from 'express';
import authRequired from '../middleware/authRequired.js';
import { getSuggestions, sendMessage } from '../controllers/chatbotController.js';

const router = express.Router();

router.get('/suggestions', authRequired, getSuggestions);
router.post('/message', authRequired, sendMessage);

export default router;
