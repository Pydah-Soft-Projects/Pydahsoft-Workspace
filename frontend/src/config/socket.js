import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

// Derive Socket URL from API_BASE_URL (removing trailing /api if present)
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};
