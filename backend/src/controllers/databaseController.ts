import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';
import { Prisma } from '@prisma/client';

export const getDatabases = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const databases = await prisma.database.findMany({
      where: { userId: req.user!.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    res.json({
      databases: databases.map((db) => ({
        id: db.id,
        name: db.name,
        created_at: db.createdAt,
        updated_at: db.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get databases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDatabase = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    const database = await prisma.database.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    const columns = await prisma.databaseColumn.findMany({
      where: { databaseId: id },
      orderBy: { order: 'asc' },
    });

    res.json({
      database: {
        id: database.id,
        user_id: database.userId,
        name: database.name,
        created_at: database.createdAt,
        updated_at: database.updatedAt,
      },
      columns: columns.map((col) => ({
        id: col.id,
        database_id: col.databaseId,
        name: col.name,
        type: col.type,
        is_unique: col.isUnique,
        order: col.order,
        created_at: col.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDatabase = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { name } = req.body;

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Check if database name already exists for this user
    const existingDb = await prisma.database.findFirst({
      where: { name, userId: req.user!.id },
    });

    if (existingDb) {
      res.status(400).json({ error: 'Database with this name already exists' });
      return;
    }

    const database = await prisma.database.create({
      data: {
        userId: req.user!.id,
        name,
      },
    });

    res.status(201).json({
      message: 'Database created successfully',
      database: {
        id: database.id,
        user_id: database.userId,
        name: database.name,
        created_at: database.createdAt,
        updated_at: database.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateDatabase = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;
  const { name } = req.body;

  try {
    // Check if database exists and belongs to user
    const existingDb = await prisma.database.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!existingDb) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    // Check if new name conflicts
    if (name !== existingDb.name) {
      const nameCheck = await prisma.database.findFirst({
        where: {
          name,
          userId: req.user!.id,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (nameCheck) {
        res.status(400).json({ error: 'Database with this name already exists' });
        return;
      }
    }

    const database = await prisma.database.update({
      where: { id },
      data: { name },
    });

    res.json({
      message: 'Database updated successfully',
      database: {
        id: database.id,
        user_id: database.userId,
        name: database.name,
        created_at: database.createdAt,
        updated_at: database.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteDatabase = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    const database = await prisma.database.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    // Soft delete the database and all its rows
    await prisma.database.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.databaseRow.updateMany({
      where: { databaseId: id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Database deleted successfully' });
  } catch (error) {
    console.error('Delete database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Column operations
export const addColumn = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;
  const { name, type, is_unique = false } = req.body;

  try {
    // Check if database belongs to user
    const database = await prisma.database.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    // Check if column name already exists
    const existingColumn = await prisma.databaseColumn.findFirst({
      where: { databaseId: id, name },
    });

    if (existingColumn) {
      res.status(400).json({ error: 'Column with this name already exists' });
      return;
    }

    // Get next order
    const maxOrderColumn = await prisma.databaseColumn.findFirst({
      where: { databaseId: id },
      orderBy: { order: 'desc' },
    });

    const nextOrder = (maxOrderColumn?.order ?? -1) + 1;

    const column = await prisma.databaseColumn.create({
      data: {
        databaseId: id,
        name,
        type,
        isUnique: is_unique,
        order: nextOrder,
      },
    });

    res.status(201).json({
      message: 'Column added successfully',
      column: {
        id: column.id,
        database_id: column.databaseId,
        name: column.name,
        type: column.type,
        is_unique: column.isUnique,
        order: column.order,
        created_at: column.createdAt,
      },
    });
  } catch (error) {
    console.error('Add column error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateColumn = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;
  const columnId = req.params.columnId as string;
  const { name, type, is_unique } = req.body;

  try {
    // Check if database belongs to user
    const database = await prisma.database.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    const column = await prisma.databaseColumn.findFirst({
      where: { id: columnId, databaseId: id },
    });

    if (!column) {
      res.status(404).json({ error: 'Column not found' });
      return;
    }

    const updateData: { name?: string; type?: string; isUnique?: boolean } = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (is_unique !== undefined) updateData.isUnique = is_unique;

    const updatedColumn = await prisma.databaseColumn.update({
      where: { id: columnId },
      data: updateData,
    });

    res.json({
      message: 'Column updated successfully',
      column: {
        id: updatedColumn.id,
        database_id: updatedColumn.databaseId,
        name: updatedColumn.name,
        type: updatedColumn.type,
        is_unique: updatedColumn.isUnique,
        order: updatedColumn.order,
        created_at: updatedColumn.createdAt,
      },
    });
  } catch (error) {
    console.error('Update column error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteColumn = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;
  const columnId = req.params.columnId as string;

  try {
    // Check if database belongs to user
    const database = await prisma.database.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    const column = await prisma.databaseColumn.findFirst({
      where: { id: columnId, databaseId: id },
    });

    if (!column) {
      res.status(404).json({ error: 'Column not found' });
      return;
    }

    // Delete the column
    await prisma.databaseColumn.delete({
      where: { id: columnId },
    });

    // Remove the column data from all archived rows for this database
    const archivedRows = await prisma.databaseRow.findMany({
      where: {
        databaseId: id,
        deletedAt: { not: null },
      },
    });

    if (archivedRows.length > 0) {
      // Update each archived row to remove the column data
      for (const row of archivedRows) {
        const currentData = row.data as Record<string, unknown>;
        const updatedData = { ...currentData };
        delete updatedData[column.name];

        await prisma.databaseRow.update({
          where: { id: row.id },
          data: { data: updatedData as Prisma.InputJsonValue },
        });
      }
    }

    res.json({ message: 'Column deleted successfully' });
  } catch (error) {
    console.error('Delete column error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Row operations
export const getRows = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;
  const { sort_by, sort_order = 'asc', filters } = req.query;

  try {
    // Check if database belongs to user
    const database = await prisma.database.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    // Fetch all non-deleted rows
    const allRows = await prisma.databaseRow.findMany({
      where: { databaseId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    let filteredRows = allRows;

    // Apply filters if provided
    if (filters && typeof filters === 'string') {
      try {
        // URL-decode if needed
        const decodedFilters = decodeURIComponent(filters);
        const filterArray = JSON.parse(decodedFilters) as Array<{
          column: string;
          operator: string;
          value: string;
        }>;

        filterArray.forEach((filter) => {
          filteredRows = filteredRows.filter((row) => {
            const data = row.data as Record<string, unknown>;
            if (typeof data !== 'object' || data === null || !(filter.column in data)) {
              return true; // Skip filter if column doesn't exist in data
            }
            const value = String(data[filter.column] || '');
            const filterValue = filter.value;

            switch (filter.operator) {
              case 'equals':
                return value.toLowerCase() === filterValue.toLowerCase();
              case 'contains':
                return value.toLowerCase().includes(filterValue.toLowerCase());
              case 'starts_with':
                return value.toLowerCase().startsWith(filterValue.toLowerCase());
              case 'ends_with':
                return value.toLowerCase().endsWith(filterValue.toLowerCase());
              default:
                return true;
            }
          });
        });
      } catch {
        // Invalid filter format, continue without filtering
      }
    }

    // Sort if needed
    if (sort_by && typeof sort_by === 'string') {
      filteredRows.sort((a, b) => {
        const dataA = a.data as Record<string, unknown>;
        const dataB = b.data as Record<string, unknown>;
        const valA = String(dataA[sort_by] || '');
        const valB = String(dataB[sort_by] || '');
        const comparison = valA.localeCompare(valB);
        return sort_order === 'desc' ? -comparison : comparison;
      });
    }

    res.json({
      rows: filteredRows.map((row) => ({
        id: row.id,
        database_id: row.databaseId,
        data: row.data,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get rows error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addRow = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;
  const { data } = req.body;

  try {
    // Check if database belongs to user
    const database = await prisma.database.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    // Check unique constraints
    const uniqueColumns = await prisma.databaseColumn.findMany({
      where: { databaseId: id, isUnique: true },
    });

    for (const col of uniqueColumns) {
      if (data[col.name]) {
        const existingRows = await prisma.databaseRow.findMany({
          where: { databaseId: id },
        });

        const duplicate = existingRows.find((row) => {
          const rowData = row.data as Record<string, unknown>;
          return rowData[col.name] === data[col.name];
        });

        if (duplicate) {
          res.status(400).json({ error: `Duplicate value for unique column: ${col.name}` });
          return;
        }
      }
    }

    const row = await prisma.databaseRow.create({
      data: {
        databaseId: id,
        data: data as Prisma.InputJsonValue,
      },
    });

    res.status(201).json({
      message: 'Row added successfully',
      row: {
        id: row.id,
        database_id: row.databaseId,
        data: row.data,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
      },
    });
  } catch (error) {
    console.error('Add row error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRow = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;
  const rowId = req.params.rowId as string;
  const { data } = req.body;

  try {
    // Check if database belongs to user
    const database = await prisma.database.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    const existingRow = await prisma.databaseRow.findFirst({
      where: { id: rowId, databaseId: id },
    });

    if (!existingRow) {
      res.status(404).json({ error: 'Row not found' });
      return;
    }

    // Check unique constraints
    const uniqueColumns = await prisma.databaseColumn.findMany({
      where: { databaseId: id, isUnique: true },
    });

    for (const col of uniqueColumns) {
      if (data[col.name]) {
        const existingRows = await prisma.databaseRow.findMany({
          where: {
            databaseId: id,
            NOT: { id: rowId },
          },
        });

        const duplicate = existingRows.find((row) => {
          const rowData = row.data as Record<string, unknown>;
          return rowData[col.name] === data[col.name];
        });

        if (duplicate) {
          res.status(400).json({ error: `Duplicate value for unique column: ${col.name}` });
          return;
        }
      }
    }

    const row = await prisma.databaseRow.update({
      where: { id: rowId },
      data: { data: data as Prisma.InputJsonValue },
    });

    res.json({
      message: 'Row updated successfully',
      row: {
        id: row.id,
        database_id: row.databaseId,
        data: row.data,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update row error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteRow = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;
  const rowId = req.params.rowId as string;

  try {
    // Check if database belongs to user
    const database = await prisma.database.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    const row = await prisma.databaseRow.findFirst({
      where: { id: rowId, databaseId: id, deletedAt: null },
    });

    if (!row) {
      res.status(404).json({ error: 'Row not found' });
      return;
    }

    // Soft delete the row
    await prisma.databaseRow.update({
      where: { id: rowId },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Row deleted successfully' });
  } catch (error) {
    console.error('Delete row error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create row from form submission
export const createRowFromForm = async (
  databaseId: string,
  fieldMappings: { form_field_id: string; column_name: string }[],
  formData: Record<string, unknown>
): Promise<void> => {
  const rowData: Record<string, unknown> = {};

  fieldMappings.forEach((mapping) => {
    if (formData[mapping.form_field_id] !== undefined) {
      rowData[mapping.column_name] = formData[mapping.form_field_id];
    }
  });

  await prisma.databaseRow.create({
    data: {
      databaseId,
      data: rowData as Prisma.InputJsonValue,
    },
  });
};

// Archive functions for databases
export const getDeletedDatabases = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Build where clause
    const where: any = {
      userId: req.user!.id,
      deletedAt: { not: null },
    };

    if (search && typeof search === 'string' && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.database.count({ where });

    const databases = await prisma.database.findMany({
      where,
      orderBy: { deletedAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      skip,
      take: pageSize,
    });

    res.json({
      databases: databases.map((db) => ({
        id: db.id,
        name: db.name,
        created_at: db.createdAt,
        updated_at: db.updatedAt,
        deleted_at: db.deletedAt,
      })),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalCount,
        pages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('Get deleted databases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const restoreDatabase = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    const database = await prisma.database.findFirst({
      where: { id, userId: req.user!.id, deletedAt: { not: null } },
    });

    if (!database) {
      res.status(404).json({ error: 'Deleted database not found' });
      return;
    }

    // Check if name conflicts with existing non-deleted database
    const existingDatabase = await prisma.database.findFirst({
      where: { name: database.name, userId: req.user!.id, deletedAt: null },
    });

    if (existingDatabase) {
      res.status(400).json({ error: 'A database with this name already exists. Please rename the database before restoring.' });
      return;
    }

    await prisma.database.update({
      where: { id },
      data: { deletedAt: null },
    });

    res.json({ message: 'Database restored successfully' });
  } catch (error) {
    console.error('Restore database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const permanentDeleteDatabase = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    const database = await prisma.database.findFirst({
      where: { id, userId: req.user!.id, deletedAt: { not: null } },
    });

    if (!database) {
      res.status(404).json({ error: 'Deleted database not found' });
      return;
    }

    await prisma.database.delete({
      where: { id },
    });

    res.json({ message: 'Database permanently deleted successfully' });
  } catch (error) {
    console.error('Permanent delete database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDatabasesWithDeletedRows = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Build where clause for databases that are not deleted and have deleted rows
    const where: any = {
      userId: req.user!.id,
      deletedAt: null, // Only active databases
    };

    if (search && typeof search === 'string' && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    // Get databases that have deleted rows
    const databasesWithRows = await prisma.database.findMany({
      where: {
        ...where,
        rows: {
          some: {
            deletedAt: { not: null },
          },
        },
      },
      select: {
        id: true,
        userId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            rows: {
              where: { deletedAt: { not: null } },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    });

    // Get total count
    const totalCount = await prisma.database.count({
      where: {
        ...where,
        rows: {
          some: {
            deletedAt: { not: null },
          },
        },
      },
    });

    res.json({
      databases: databasesWithRows.map((db) => ({
        id: db.id,
        user_id: db.userId,
        name: db.name,
        created_at: db.createdAt,
        updated_at: db.updatedAt,
        deleted_rows_count: db._count.rows,
      })),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalCount,
        pages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('Get databases with deleted rows error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDeletedRows = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { database_id } = req.params;
    const { search, page = 1, limit = 10, filters } = req.query;
    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Build where clause
    const where: any = {
      deletedAt: { not: null },
      databaseId: database_id as string,
    };

    // Check if database exists and belongs to user
    const database = await prisma.database.findFirst({
      where: { id: database_id as string, userId: req.user!.id, deletedAt: null },
    });
    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    // Get database columns
    const columns = await prisma.databaseColumn.findMany({
      where: { databaseId: database_id as string },
      orderBy: { order: 'asc' },
    });

    // Fetch all deleted rows
    const allRows = await prisma.databaseRow.findMany({
      where,
      include: {
        database: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { deletedAt: 'desc' },
    });

    let filteredRows = allRows;

    // Apply search if provided
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      filteredRows = filteredRows.filter((row) => {
        const data = row.data as Record<string, unknown>;
        if (typeof data === 'object' && data !== null) {
          // Search in all string values in the row data
          return Object.values(data).some(value =>
            String(value || '').toLowerCase().includes(searchTerm)
          );
        }
        return false;
      });
    }

    // Apply filters if provided
    if (filters && typeof filters === 'string') {
      try {
        // URL-decode if needed
        const decodedFilters = decodeURIComponent(filters);
        const filterArray = JSON.parse(decodedFilters) as Array<{
          column: string;
          operator: string;
          value: string;
        }>;

        filterArray.forEach((filter) => {
          filteredRows = filteredRows.filter((row) => {
            const data = row.data as Record<string, unknown>;
            if (typeof data !== 'object' || data === null || !(filter.column in data)) {
              return true; // Skip filter if column doesn't exist in data
            }
            const value = String(data[filter.column] || '');
            const filterValue = filter.value;

            switch (filter.operator) {
              case 'equals':
                return value.toLowerCase() === filterValue.toLowerCase();
              case 'contains':
                return value.toLowerCase().includes(filterValue.toLowerCase());
              case 'starts_with':
                return value.toLowerCase().startsWith(filterValue.toLowerCase());
              case 'ends_with':
                return value.toLowerCase().endsWith(filterValue.toLowerCase());
              default:
                return true;
            }
          });
        });
      } catch {
        // Invalid filter format, continue without filtering
      }
    }

    // Apply pagination
    const paginatedRows = filteredRows.slice(skip, skip + pageSize);

    res.json({
      columns: columns.map((col) => ({
        id: col.id,
        database_id: col.databaseId,
        name: col.name,
        type: col.type,
        is_unique: col.isUnique,
        order: col.order,
        created_at: col.createdAt,
      })),
      rows: paginatedRows.map((row) => ({
        id: row.id,
        database_id: row.databaseId,
        database_name: row.database.name,
        data: row.data,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
        deleted_at: row.deletedAt,
      })),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: filteredRows.length,
        pages: Math.ceil(filteredRows.length / pageSize),
      },
    });
  } catch (error) {
    console.error('Get deleted rows error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const restoreRow = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    const row = await prisma.databaseRow.findFirst({
      where: { id, deletedAt: { not: null } },
      include: {
        database: true,
      },
    });

    if (!row) {
      res.status(404).json({ error: 'Deleted row not found' });
      return;
    }

    // Check if database belongs to user
    if (row.database.userId !== req.user!.id) {
      res.status(404).json({ error: 'Row not found' });
      return;
    }

    // Check if database is deleted
    if (row.database.deletedAt) {
      res.status(400).json({ error: 'Cannot restore row because the database is deleted. Please restore the database first.' });
      return;
    }

    await prisma.databaseRow.update({
      where: { id },
      data: { deletedAt: null },
    });

    res.json({ message: 'Row restored successfully' });
  } catch (error) {
    console.error('Restore row error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const permanentDeleteRow = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    const row = await prisma.databaseRow.findFirst({
      where: { id, deletedAt: { not: null } },
      include: {
        database: true,
      },
    });

    if (!row) {
      res.status(404).json({ error: 'Deleted row not found' });
      return;
    }

    // Check if database belongs to user
    if (row.database.userId !== req.user!.id) {
      res.status(404).json({ error: 'Row not found' });
      return;
    }

    await prisma.databaseRow.delete({
      where: { id },
    });

    res.json({ message: 'Row permanently deleted successfully' });
  } catch (error) {
    console.error('Permanent delete row error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkRestoreDatabases = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { ids, selectedAll, search } = req.body;

  try {
    let databasesToRestore: { id: string; name: string }[];

    if (selectedAll) {
      // Get all databases matching the search criteria
      const where: any = {
        userId: req.user!.id,
        deletedAt: { not: null },
      };

      if (search && search.trim()) {
        where.name = {
          contains: search.trim(),
          mode: 'insensitive',
        };
      }

      databasesToRestore = await prisma.database.findMany({
        where,
        select: { id: true, name: true },
      });
    } else {
      // Use specific IDs
      databasesToRestore = ids.map((id: string) => ({ id, name: '' }));

      // Verify all databases belong to user and are deleted
      const existingDatabases = await prisma.database.findMany({
        where: {
          id: { in: ids },
          userId: req.user!.id,
          deletedAt: { not: null },
        },
        select: { id: true, name: true },
      });

      if (existingDatabases.length !== ids.length) {
        res.status(404).json({ error: 'Some databases not found or not deleted' });
        return;
      }

      databasesToRestore = existingDatabases;
    }

    // Check for name conflicts before restoring
    if (selectedAll || databasesToRestore.length > 0) {
      const conflictingDatabases = await prisma.database.findMany({
        where: {
          userId: req.user!.id,
          deletedAt: null,
          name: {
            in: databasesToRestore.map(db => db.name),
          },
        },
        select: { name: true },
      });

      if (conflictingDatabases.length > 0) {
        res.status(400).json({
          error: 'Some databases cannot be restored due to name conflicts. Please rename them first.'
        });
        return;
      }
    }

    // Restore the databases
    await prisma.database.updateMany({
      where: {
        id: { in: databasesToRestore.map(db => db.id) },
        userId: req.user!.id,
      },
      data: { deletedAt: null },
    });

    res.json({
      message: `${databasesToRestore.length} database(s) restored successfully`,
      count: databasesToRestore.length
    });
  } catch (error) {
    console.error('Bulk restore databases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkDeleteDatabases = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { ids, selectedAll, search } = req.body;

  try {
    let databasesToDelete: { id: string }[];

    if (selectedAll) {
      // Get all databases matching the search criteria
      const where: any = {
        userId: req.user!.id,
        deletedAt: { not: null },
      };

      if (search && search.trim()) {
        where.name = {
          contains: search.trim(),
          mode: 'insensitive',
        };
      }

      databasesToDelete = await prisma.database.findMany({
        where,
        select: { id: true },
      });
    } else {
      // Use specific IDs
      databasesToDelete = ids.map((id: string) => ({ id }));

      // Verify all databases belong to user and are deleted
      const existingDatabases = await prisma.database.findMany({
        where: {
          id: { in: ids },
          userId: req.user!.id,
          deletedAt: { not: null },
        },
        select: { id: true },
      });

      if (existingDatabases.length !== ids.length) {
        res.status(404).json({ error: 'Some databases not found or not deleted' });
        return;
      }
    }

    // Delete the databases permanently
    await prisma.database.deleteMany({
      where: {
        id: { in: databasesToDelete.map(db => db.id) },
        userId: req.user!.id,
      },
    });

    res.json({
      message: `${databasesToDelete.length} database(s) permanently deleted successfully`,
      count: databasesToDelete.length
    });
  } catch (error) {
    console.error('Bulk delete databases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkRestoreRows = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { ids, selectedAll, search, database_id } = req.body;

  try {
    let rowsToRestore: { id: string }[];

    if (selectedAll) {
      // Get all rows matching the search criteria
      const where: any = {
        deletedAt: { not: null },
      };

      if (database_id) {
        where.databaseId = database_id as string;
        // Check if database exists and is not deleted
        const database = await prisma.database.findFirst({
          where: { id: database_id as string, userId: req.user!.id },
        });
        if (!database || database.deletedAt) {
          res.status(400).json({ error: 'Cannot restore rows from a deleted database' });
          return;
        }
      } else {
        // Get databases that are not deleted
        const activeDatabases = await prisma.database.findMany({
          where: { userId: req.user!.id, deletedAt: null },
          select: { id: true },
        });
        where.databaseId = { in: activeDatabases.map(db => db.id) };
      }

      rowsToRestore = await prisma.databaseRow.findMany({
        where,
        select: { id: true },
      });
    } else {
      // Use specific IDs
      rowsToRestore = ids.map((id: string) => ({ id }));

      // Verify all rows are deleted and belong to user's active databases
      const existingRows = await prisma.databaseRow.findMany({
        where: {
          id: { in: ids },
          deletedAt: { not: null },
        },
        include: {
          database: true,
        },
      });

      if (existingRows.length !== ids.length) {
        res.status(404).json({ error: 'Some rows not found or not deleted' });
        return;
      }

      // Check ownership and database status
      for (const row of existingRows) {
        if (row.database.userId !== req.user!.id) {
          res.status(404).json({ error: 'Some rows not found' });
          return;
        }
        if (row.database.deletedAt) {
          res.status(400).json({ error: 'Cannot restore rows from deleted databases. Please restore the databases first.' });
          return;
        }
      }
    }

    // Restore the rows
    await prisma.databaseRow.updateMany({
      where: {
        id: { in: rowsToRestore.map(row => row.id) },
      },
      data: { deletedAt: null },
    });

    res.json({
      message: `${rowsToRestore.length} row(s) restored successfully`,
      count: rowsToRestore.length
    });
  } catch (error) {
    console.error('Bulk restore rows error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkDeleteRows = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { ids, selectedAll, search, database_id } = req.body;

  try {
    let rowsToDelete: { id: string }[];

    if (selectedAll) {
      // Get all rows matching the search criteria
      const where: any = {
        deletedAt: { not: null },
      };

      if (database_id) {
        where.databaseId = database_id as string;
        // Check if database exists
        const database = await prisma.database.findFirst({
          where: { id: database_id as string, userId: req.user!.id },
        });
        if (!database) {
          res.status(404).json({ error: 'Database not found' });
          return;
        }
      } else {
        // Get databases that are not deleted
        const activeDatabases = await prisma.database.findMany({
          where: { userId: req.user!.id, deletedAt: null },
          select: { id: true },
        });
        where.databaseId = { in: activeDatabases.map(db => db.id) };
      }

      rowsToDelete = await prisma.databaseRow.findMany({
        where,
        select: { id: true },
      });
    } else {
      // Use specific IDs
      rowsToDelete = ids.map((id: string) => ({ id }));

      // Verify all rows are deleted and belong to user's databases
      const existingRows = await prisma.databaseRow.findMany({
        where: {
          id: { in: ids },
          deletedAt: { not: null },
        },
        include: {
          database: true,
        },
      });

      if (existingRows.length !== ids.length) {
        res.status(404).json({ error: 'Some rows not found or not deleted' });
        return;
      }

      // Check ownership
      for (const row of existingRows) {
        if (row.database.userId !== req.user!.id) {
          res.status(404).json({ error: 'Some rows not found' });
          return;
        }
      }
    }

    // Delete the rows permanently
    await prisma.databaseRow.deleteMany({
      where: {
        id: { in: rowsToDelete.map(row => row.id) },
      },
    });

    res.json({
      message: `${rowsToDelete.length} row(s) permanently deleted successfully`,
      count: rowsToDelete.length
    });
  } catch (error) {
    console.error('Bulk delete rows error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
