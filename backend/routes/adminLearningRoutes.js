import express from 'express';
import authRequired from '../middleware/authRequired.js';
import { notImplemented } from '../controllers/adminLearningController.js';

const router = express.Router();

// Placeholder routes (MVP deferred)
router.all('*', authRequired, notImplemented);

export default router;

