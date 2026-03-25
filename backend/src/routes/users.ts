import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// PUT /api/users/profile - Update current user profile
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, phone, avatar } = req.body;
    const userId = req.user!.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        avatar: true, isActive: true, clientId: true, createdAt: true, updatedAt: true,
      },
    });

    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    console.error('Profile update error:', error);
    sendError(res, 'Failed to update profile');
  }
});

// PUT /api/users/password - Change password
router.put('/password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    if (!currentPassword || !newPassword) {
      sendError(res, 'Current password and new password are required', 400);
      return;
    }

    if (newPassword.length < 6) {
      sendError(res, 'New password must be at least 6 characters', 400);
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      sendError(res, 'Current password is incorrect', 401);
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('Password change error:', error);
    sendError(res, 'Failed to change password');
  }
});

export default router;
