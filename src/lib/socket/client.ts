"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentUserId: string | null = null;

export const getSocket = (userId: string): Socket => {
  if (socket && currentUserId === userId) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  currentUserId = userId;
  socket = io({
    path: "/socket.io",
    auth: { userId },
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
  socket = null;
  currentUserId = null;
};
