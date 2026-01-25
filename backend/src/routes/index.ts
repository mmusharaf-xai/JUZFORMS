import { Router } from 'express';
import authRoutes from './authRoutes';
import formsRoutes from './formsRoutes';
import databaseRoutes from './databaseRoutes';
import statsRoutes from './statsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/forms', formsRoutes);
router.use('/databases', databaseRoutes);
router.use('/stats', statsRoutes);

export default router;
