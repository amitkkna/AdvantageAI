import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket() {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => console.log('WS connected'));
  socket.on('disconnect', () => console.log('WS disconnected'));

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
