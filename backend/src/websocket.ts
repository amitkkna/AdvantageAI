import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env';

let io: SocketIOServer | null = null;

export function setupWebSocket(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:8081'],
      credentials: true,
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);
    if (socket.data.role === 'ADMIN') socket.join('admins');
    console.log(`WS connected: ${userId}`);

    socket.on('disconnect', () => {
      console.log(`WS disconnected: ${userId}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// Emit to specific user
export function emitToUser(userId: string, event: string, data: any) {
  io?.to(`user:${userId}`).emit(event, data);
}

// Emit to all admins
export function emitToAdmins(event: string, data: any) {
  io?.to('admins').emit(event, data);
}

// Emit to all connected clients
export function emitToAll(event: string, data: any) {
  io?.emit(event, data);
}
