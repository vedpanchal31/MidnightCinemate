import type { Server as IOServer } from "socket.io";

type GlobalWithIO = typeof globalThis & {
  io?: IOServer;
};

export const getIO = (): IOServer | undefined =>
  (globalThis as GlobalWithIO).io;
