import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';

export const getStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Count forms
    const formsCount = await prisma.form.count({
      where: { userId: req.user!.id },
    });

    // Get form IDs for this user
    const userForms = await prisma.form.findMany({
      where: { userId: req.user!.id },
      select: { id: true },
    });

    const formIds = userForms.map((f) => f.id);

    // Count submissions
    let submissionsCount = 0;
    if (formIds.length > 0) {
      submissionsCount = await prisma.formSubmission.count({
        where: { formId: { in: formIds } },
      });
    }

    // Count databases
    const databasesCount = await prisma.database.count({
      where: { userId: req.user!.id },
    });

    res.json({
      stats: {
        forms_created: formsCount,
        forms_submitted: submissionsCount,
        databases_created: databasesCount,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
