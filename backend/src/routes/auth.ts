import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { loginSchema, registerSchema } from '@advantage/shared';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokens';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      sendError(res, 'Email already registered', 409);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, phone, role },
      select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    });

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    sendSuccess(res, { user, tokens: { accessToken, refreshToken } }, 'Registration successful', 201);
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 'Registration failed');
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role, clientId: user.clientId || undefined };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    const { password: _, ...userWithoutPassword } = user;
    sendSuccess(res, { user: userWithoutPassword, tokens: { accessToken, refreshToken } }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed');
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) {
      sendError(res, 'Refresh token required', 401);
      return;
    }

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      sendError(res, 'User not found or inactive', 401);
      return;
    }

    const newPayload = { userId: user.id, email: user.email, role: user.role, clientId: user.clientId || undefined };
    const accessToken = generateAccessToken(newPayload);
    const refreshToken = generateRefreshToken(newPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    sendSuccess(res, { tokens: { accessToken, refreshToken } });
  } catch {
    sendError(res, 'Invalid refresh token', 401);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  sendSuccess(res, null, 'Logged out successfully');
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        avatar: true, isActive: true, clientId: true, createdAt: true, updatedAt: true,
        client: true,
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    console.error('Me error:', error);
    sendError(res, 'Failed to get user');
  }
});

export default router;
