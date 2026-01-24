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
  getDeletedForms,
  restoreForm,
  permanentDeleteForm,
  bulkRestoreForms,
  bulkDeleteForms,
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

// Archive routes
router.get('/archives/deleted', authenticate, getDeletedForms);
router.post('/:id/restore', authenticate, restoreForm);
router.delete('/:id/permanent', authenticate, permanentDeleteForm);
router.post('/archives/bulk-restore', authenticate, bulkRestoreForms);
router.post('/archives/bulk-delete', authenticate, bulkDeleteForms);

export default router;
