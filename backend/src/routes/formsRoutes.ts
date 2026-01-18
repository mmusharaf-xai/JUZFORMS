import { Router } from 'express';
import {
  getForms,
  getForm,
  getPublicForm,
  createForm,
  updateForm,
  deleteForm,
  submitForm,
  getFormSubmissions,
} from '../controllers/formsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/public/:id', getPublicForm);
router.post('/public/:id/submit', submitForm);

// Protected routes
router.get('/', authenticate, getForms);
router.get('/:id', authenticate, getForm);
router.post('/', authenticate, createForm);
router.put('/:id', authenticate, updateForm);
router.delete('/:id', authenticate, deleteForm);
router.get('/:id/submissions', authenticate, getFormSubmissions);

export default router;
