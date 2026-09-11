import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

export const getSocketUrl = () => {
  let url = API_BASE_URL.replace(/\/api\/?$/, '');
  
  // If API_BASE_URL uses localhost but page is accessed via LAN IP or custom hostname,
  // substitute hostname so secondary devices connect to backend IP instead of their own localhost
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    url = url.replace('localhost', window.location.hostname).replace('127.0.0.1', window.location.hostname);
  }
  return url;
};

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};
