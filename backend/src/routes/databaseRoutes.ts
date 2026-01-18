import { Router } from 'express';
import {
  getDatabases,
  getDatabase,
  createDatabase,
  updateDatabase,
  deleteDatabase,
  addColumn,
  updateColumn,
  deleteColumn,
  getRows,
  addRow,
  updateRow,
  deleteRow,
} from '../controllers/databaseController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Database CRUD
router.get('/', authenticate, getDatabases);
router.get('/:id', authenticate, getDatabase);
router.post('/', authenticate, createDatabase);
router.put('/:id', authenticate, updateDatabase);
router.delete('/:id', authenticate, deleteDatabase);

// Column operations
router.post('/:id/columns', authenticate, addColumn);
router.put('/:id/columns/:columnId', authenticate, updateColumn);
router.delete('/:id/columns/:columnId', authenticate, deleteColumn);

// Row operations
router.get('/:id/rows', authenticate, getRows);
router.post('/:id/rows', authenticate, addRow);
router.put('/:id/rows/:rowId', authenticate, updateRow);
router.delete('/:id/rows/:rowId', authenticate, deleteRow);

export default router;
