import { Router } from 'express';
import { requireAdminAuth } from '../middleware/adminAuthMiddleware';
import {
  loginAdmin,
  listGovUsers,
  getGovUserById,
  approveGovUser,
  rejectGovUser,
  suspendGovUser,
} from '../controllers/adminController';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again later.' },
});

router.post('/auth/login', authLimiter, loginAdmin);

// All routes below require admin auth
router.use(requireAdminAuth);

router.get('/gov-users', listGovUsers);
router.get('/gov-users/:id', getGovUserById);
router.post('/gov-users/:id/approve', approveGovUser);
router.post('/gov-users/:id/reject', rejectGovUser);
router.post('/gov-users/:id/suspend', suspendGovUser);

export default router;
