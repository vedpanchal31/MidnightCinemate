/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const next = require("next");
const { Server } = require("socket.io");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = http.createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  global.io = io;

  io.on("connection", (socket) => {
    const authUserId =
      (socket.handshake.auth && socket.handshake.auth.userId) ||
      socket.handshake.query.userId;

    if (authUserId) {
      socket.join(`user:${authUserId}`);
    }
  });

  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
