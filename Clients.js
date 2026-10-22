const socket = io();

const elements = {
  connectionStatus: document.getElementById("connection-status"),
  connectionLabel: document.getElementById("connection-label"),
  joinDialog: document.getElementById("join-dialog"),
  joinForm: document.getElementById("join-form"),
  usernameInput: document.getElementById("username-input"),
  joinButton: document.getElementById("join-button"),
  joinError: document.getElementById("join-error"),
  leaveButton: document.getElementById("leave-button"),
  messageForm: document.getElementById("message-form"),
  messageInput: document.getElementById("message-input"),
  sendButton: document.getElementById("send-button"),
  messages: document.getElementById("messages"),
  emptyState: document.getElementById("empty-state"),
  userList: document.getElementById("user-list"),
  userCount: document.getElementById("user-count"),
  errorMessage: document.getElementById("error-message"),
};

let username = "";

function setConnectionStatus(isConnected) {
  elements.connectionStatus.classList.toggle("is-connected", isConnected);
  elements.connectionStatus.classList.toggle("is-disconnected", !isConnected);
  elements.connectionLabel.textContent = isConnected
    ? "Conectado"
    : "Desconectado";
  elements.joinButton.disabled = !isConnected;

  if (!isConnected) {
    elements.messageInput.disabled = true;
    elements.sendButton.disabled = true;
  } else if (username) {
    setChatActive(true);
    socket.emit("user:join", username);
  }
}

function setChatActive(isActive) {
  elements.messageInput.disabled = !isActive;
  elements.sendButton.disabled = !isActive;
  elements.leaveButton.hidden = !isActive;
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function scrollToLatestMessage() {
  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function addSystemMessage(text) {
  elements.emptyState.hidden = true;

  const message = document.createElement("div");
  message.className = "system-message";
  message.textContent = text;
  elements.messages.append(message);
  scrollToLatestMessage();
}

function addChatMessage({ username: sender, text, timestamp }) {
  elements.emptyState.hidden = true;

  const message = document.createElement("article");
  message.className = "message";
  if (sender === username) message.classList.add("is-own");

  const metadata = document.createElement("div");
  metadata.className = "message-meta";

  const name = document.createElement("strong");
  name.textContent = sender;

  const time = document.createElement("time");
  time.dateTime = timestamp;
  time.textContent = formatTime(timestamp);

  const content = document.createElement("div");
  content.className = "message-bubble";
  content.textContent = text;

  metadata.append(name, time);
  message.append(metadata, content);
  elements.messages.append(message);
  scrollToLatestMessage();
}

function renderUsers(users) {
  elements.userList.replaceChildren();
  elements.userCount.textContent = String(users.length);

  for (const name of users) {
    const item = document.createElement("li");
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = name.charAt(0).toLocaleUpperCase("es");

    const label = document.createElement("span");
    label.textContent = name;
    item.append(avatar, label);
    elements.userList.append(item);
  }
}

function resetConversation() {
  elements.messages.replaceChildren(elements.emptyState);
  elements.emptyState.hidden = false;
  elements.messageInput.value = "";
  elements.errorMessage.textContent = "";
}

function showJoinDialog() {
  elements.joinError.textContent = "";
  elements.usernameInput.value = "";
  elements.joinButton.disabled = !socket.connected;

  if (!elements.joinDialog.open) {
    elements.joinDialog.showModal();
  }
  elements.usernameInput.focus();
}

function joinChat(event) {
  event.preventDefault();
  elements.joinError.textContent = "";

  const name = elements.usernameInput.value.trim().slice(0, 24);
  if (!name) {
    elements.joinError.textContent = "Escribe un nombre para continuar.";
    elements.usernameInput.focus();
    return;
  }
  if (!socket.connected) {
    elements.joinError.textContent =
      "No hay conexión con el servidor. Inténtalo de nuevo.";
    return;
  }

  username = name;
  socket.emit("user:join", username);
  elements.joinDialog.close();
  setChatActive(true);
  elements.messageInput.focus();
}

function leaveChat() {
  socket.emit("user:leave");
  username = "";
  setChatActive(false);
  resetConversation();
  showJoinDialog();
}

function sendMessage(event) {
  event.preventDefault();
  elements.errorMessage.textContent = "";

  const text = elements.messageInput.value.trim();
  if (!text || !socket.connected || !username) return;

  socket.emit("chat:message", text);
  elements.messageInput.value = "";
  elements.messageInput.focus();
}

socket.on("connect", () => setConnectionStatus(true));
socket.on("disconnect", () => setConnectionStatus(false));
socket.on("users:update", renderUsers);
socket.on("chat:system", ({ text }) => {
  if (username) addSystemMessage(text);
});
socket.on("chat:message", (message) => {
  if (username) addChatMessage(message);
});
socket.on("chat:error", (message) => {
  const target = elements.joinDialog.open
    ? elements.joinError
    : elements.errorMessage;
  target.textContent = message;
});

elements.joinForm.addEventListener("submit", joinChat);
elements.leaveButton.addEventListener("click", leaveChat);
elements.messageForm.addEventListener("submit", sendMessage);
elements.messageInput.addEventListener("input", () => {
  elements.errorMessage.textContent = "";
});

elements.joinDialog.showModal();
elements.usernameInput.focus();
