import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';
import { Prisma } from '@prisma/client';

export const getForms = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const forms = await prisma.form.findMany({
      where: { userId: req.user!.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      forms: forms.map((form) => ({
        id: form.id,
        name: form.name,
        is_published: form.isPublished,
        created_at: form.createdAt,
        updated_at: form.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getForm = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    const form = await prisma.form.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    res.json({
      form: {
        id: form.id,
        user_id: form.userId,
        name: form.name,
        fields: form.fields,
        header_config: form.headerConfig,
        footer_config: form.footerConfig,
        is_published: form.isPublished,
        created_at: form.createdAt,
        updated_at: form.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPublicForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    const form = await prisma.form.findFirst({
      where: { id, isPublished: true },
      select: {
        id: true,
        name: true,
        fields: true,
        headerConfig: true,
        footerConfig: true,
      },
    });

    if (!form) {
      res.status(404).json({ error: 'Form not found or not published' });
      return;
    }

    res.json({
      form: {
        id: form.id,
        name: form.name,
        fields: form.fields,
        header_config: form.headerConfig,
        footer_config: form.footerConfig,
      },
    });
  } catch (error) {
    console.error('Get public form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createForm = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { name } = req.body;

  try {
    // Check if form name already exists for this user
    const existingForm = await prisma.form.findFirst({
      where: { name, userId: req.user!.id },
    });

    if (existingForm) {
      res.status(400).json({ error: 'Form with this name already exists' });
      return;
    }

    const defaultHeaderConfig = {
      enabled: false,
      left: [],
      center: [],
      right: [],
    };

    const defaultFooterConfig = {
      enabled: false,
      left: [],
      center: [],
      right: [],
    };

    const form = await prisma.form.create({
      data: {
        userId: req.user!.id,
        name,
        fields: [],
        headerConfig: defaultHeaderConfig,
        footerConfig: defaultFooterConfig,
      },
    });

    res.status(201).json({
      message: 'Form created successfully',
      form: {
        id: form.id,
        user_id: form.userId,
        name: form.name,
        fields: form.fields,
        header_config: form.headerConfig,
        footer_config: form.footerConfig,
        is_published: form.isPublished,
        created_at: form.createdAt,
        updated_at: form.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateForm = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;
  const { name, fields, header_config, footer_config, is_published } = req.body;

  try {
    // Check if form exists and belongs to user
    const existingForm = await prisma.form.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!existingForm) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    // Check if new name conflicts with existing form
    if (name && name !== existingForm.name) {
      const nameCheck = await prisma.form.findFirst({
        where: {
          name,
          userId: req.user!.id,
          NOT: { id },
        },
      });

      if (nameCheck) {
        res.status(400).json({ error: 'Form with this name already exists' });
        return;
      }
    }

    const updateData: Prisma.FormUpdateInput = {};

    if (name !== undefined) updateData.name = name;
    if (fields !== undefined) updateData.fields = fields as Prisma.InputJsonValue;
    if (header_config !== undefined) updateData.headerConfig = header_config as Prisma.InputJsonValue;
    if (footer_config !== undefined) updateData.footerConfig = footer_config as Prisma.InputJsonValue;
    if (is_published !== undefined) updateData.isPublished = is_published;

    const form = await prisma.form.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Form updated successfully',
      form: {
        id: form.id,
        user_id: form.userId,
        name: form.name,
        fields: form.fields,
        header_config: form.headerConfig,
        footer_config: form.footerConfig,
        is_published: form.isPublished,
        created_at: form.createdAt,
        updated_at: form.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteForm = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    const form = await prisma.form.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    await prisma.form.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;
  const { data } = req.body;

  try {
    // Check if form exists and is published
    const form = await prisma.form.findFirst({
      where: { id, isPublished: true, deletedAt: null },
    });

    if (!form) {
      res.status(404).json({ error: 'Form not found or not published' });
      return;
    }

    // Save submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: id,
        data: data as Prisma.InputJsonValue,
      },
    });

    res.status(201).json({
      message: 'Form submitted successfully',
      submission: {
        id: submission.id,
        form_id: submission.formId,
        data: submission.data,
        created_at: submission.createdAt,
      },
    });
  } catch (error) {
    console.error('Submit form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFormSubmissions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    // Check if form belongs to user
    const form = await prisma.form.findFirst({
      where: { id, userId: req.user!.id, deletedAt: null },
    });

    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    const submissions = await prisma.formSubmission.findMany({
      where: { formId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      submissions: submissions.map((sub) => ({
        id: sub.id,
        form_id: sub.formId,
        data: sub.data,
        created_at: sub.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get form submissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDeletedForms = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const forms = await prisma.form.findMany({
      where: { userId: req.user!.id, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    res.json({
      forms: forms.map((form) => ({
        id: form.id,
        name: form.name,
        created_at: form.createdAt,
        updated_at: form.updatedAt,
        deleted_at: form.deletedAt,
      })),
    });
  } catch (error) {
    console.error('Get deleted forms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const restoreForm = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    const form = await prisma.form.findFirst({
      where: { id, userId: req.user!.id, deletedAt: { not: null } },
    });

    if (!form) {
      res.status(404).json({ error: 'Deleted form not found' });
      return;
    }

    // Check if name conflicts with existing non-deleted form
    const existingForm = await prisma.form.findFirst({
      where: { name: form.name, userId: req.user!.id, deletedAt: null },
    });

    if (existingForm) {
      res.status(400).json({ error: 'A form with this name already exists. Please rename the form before restoring.' });
      return;
    }

    await prisma.form.update({
      where: { id },
      data: { deletedAt: null },
    });

    res.json({ message: 'Form restored successfully' });
  } catch (error) {
    console.error('Restore form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const permanentDeleteForm = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  try {
    const form = await prisma.form.findFirst({
      where: { id, userId: req.user!.id, deletedAt: { not: null } },
    });

    if (!form) {
      res.status(404).json({ error: 'Deleted form not found' });
      return;
    }

    await prisma.form.delete({
      where: { id },
    });

    res.json({ message: 'Form permanently deleted successfully' });
  } catch (error) {
    console.error('Permanent delete form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
