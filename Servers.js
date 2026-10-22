const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

function getConnectedUsers() {
  return Array.from(io.sockets.sockets.values())
    .filter((socket) => socket.data.username)
    .map((socket) => socket.data.username);
}

function broadcastConnectedUsers() {
  io.emit("users:update", getConnectedUsers());
}

function leaveChat(socket) {
  const username = socket.data.username;
  if (!username) return;

  delete socket.data.username;
  socket.broadcast.emit("chat:system", {
    text: `${username} salió del chat.`,
    timestamp: new Date().toISOString(),
  });
  broadcastConnectedUsers();
}

io.on("connection", (socket) => {
  socket.emit("users:update", getConnectedUsers());

  socket.on("user:join", (rawUsername) => {
    if (socket.data.username) return;

    const username =
      typeof rawUsername === "string" ? rawUsername.trim().slice(0, 24) : "";

    if (!username) {
      socket.emit("chat:error", "Escribe un nombre válido para entrar.");
      return;
    }

    socket.data.username = username;
    socket.broadcast.emit("chat:system", {
      text: `${username} se unió al chat.`,
      timestamp: new Date().toISOString(),
    });
    broadcastConnectedUsers();
  });

  socket.on("user:leave", () => {
    leaveChat(socket);
  });

  socket.on("chat:message", (rawMessage) => {
    if (!socket.data.username) {
      socket.emit("chat:error", "Debes elegir un nombre antes de enviar mensajes.");
      return;
    }

    const text = typeof rawMessage === "string" ? rawMessage.trim() : "";
    if (!text) return;

    if (text.length > 500) {
      socket.emit("chat:error", "El mensaje no puede superar los 500 caracteres.");
      return;
    }

    io.emit("chat:message", {
      username: socket.data.username,
      text,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    leaveChat(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Chat disponible en http://localhost:${PORT}`);
});
