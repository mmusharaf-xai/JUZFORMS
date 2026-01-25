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
  getDeletedDatabases,
  restoreDatabase,
  permanentDeleteDatabase,
  getDatabasesWithDeletedRows,
  getDeletedRows,
  restoreRow,
  permanentDeleteRow,
  bulkRestoreDatabases,
  bulkDeleteDatabases,
  bulkRestoreRows,
  bulkDeleteRows,
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

// Archive operations
router.get('/archives/databases', authenticate, getDeletedDatabases);
router.post('/:id/restore', authenticate, restoreDatabase);
router.delete('/:id/permanent', authenticate, permanentDeleteDatabase);
router.get('/archives/rows/databases', authenticate, getDatabasesWithDeletedRows);
router.get('/archives/rows', authenticate, getDeletedRows);
router.post('/rows/:id/restore', authenticate, restoreRow);
router.delete('/rows/:id/permanent', authenticate, permanentDeleteRow);
router.post('/archives/bulk-restore', authenticate, bulkRestoreDatabases);
router.post('/archives/bulk-delete', authenticate, bulkDeleteDatabases);
router.post('/archives/rows/bulk-restore', authenticate, bulkRestoreRows);
router.post('/archives/rows/bulk-delete', authenticate, bulkDeleteRows);

export default router;
