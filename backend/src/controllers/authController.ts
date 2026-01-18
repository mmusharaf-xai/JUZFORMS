import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AuthRequest } from '../types';

const JWT_EXPIRES_IN = '7d';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { first_name, last_name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: first_name,
        lastName: last_name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        created_at: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { first_name, last_name, old_password, new_password } = req.body;

  try {
    const updateData: { firstName: string; lastName: string; password?: string } = {
      firstName: first_name,
      lastName: last_name,
    };

    // If changing password, verify old password
    if (new_password) {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { password: true },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const isValidPassword = await bcrypt.compare(old_password, user.password);

      if (!isValidPassword) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(new_password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        first_name: updatedUser.firstName,
        last_name: updatedUser.lastName,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAccount = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await prisma.user.delete({
      where: { id: req.user!.id },
    });
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
