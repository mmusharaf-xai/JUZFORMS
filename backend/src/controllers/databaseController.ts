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
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
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
      where: { id, userId: req.user!.id },
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
      where: { id, userId: req.user!.id },
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
      where: { id, userId: req.user!.id },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    await prisma.database.delete({
      where: { id },
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
      where: { id, userId: req.user!.id },
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

    await prisma.databaseColumn.delete({
      where: { id: columnId },
    });

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
      where: { id, userId: req.user!.id },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    // Fetch all rows
    const allRows = await prisma.databaseRow.findMany({
      where: { databaseId: id },
      orderBy: { createdAt: 'desc' },
    });

    let filteredRows = allRows;

    // Apply filters if provided
    if (filters) {
      try {
        const filterArray = JSON.parse(filters as string) as Array<{
          column: string;
          operator: string;
          value: string;
        }>;

        filterArray.forEach((filter) => {
          filteredRows = filteredRows.filter((row) => {
            const data = row.data as Record<string, unknown>;
            const value = String(data[filter.column] || '');
            const filterValue = filter.value;

            switch (filter.operator) {
              case 'equals':
                return value === filterValue;
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
      where: { id, userId: req.user!.id },
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
      where: { id, userId: req.user!.id },
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
      where: { id, userId: req.user!.id },
    });

    if (!database) {
      res.status(404).json({ error: 'Database not found' });
      return;
    }

    const row = await prisma.databaseRow.findFirst({
      where: { id: rowId, databaseId: id },
    });

    if (!row) {
      res.status(404).json({ error: 'Row not found' });
      return;
    }

    await prisma.databaseRow.delete({
      where: { id: rowId },
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
