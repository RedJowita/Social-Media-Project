const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3000;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugify(value = 'my-server') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-server';
}

function buildServerPage(serverName) {
  const safeName = escapeHtml(serverName || 'My Server');
  const safeKey = slugify(serverName || 'My Server');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
    }

    body {
      min-height: 100vh;
      overflow: hidden;
    }

    .discord-app {
      display: flex;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(rgba(2, 8, 23, 0.18), rgba(11, 18, 32, 0.24)), url('/GliderSpace.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .server-bar {
      width: 92px;
      background: rgba(15, 23, 42, 0.45);
      border-right: 1px solid rgba(148, 163, 184, 0.15);
      padding-top: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .back-button {
      border: 1px solid rgba(148, 163, 184, 0.2);
      background: rgba(30, 41, 59, 0.8);
      color: #e2e8f0;
      border-radius: 10px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 13px;
    }

    .back-button:hover {
      background: rgba(96, 165, 250, 0.2);
      border-color: rgba(96, 165, 250, 0.55);
    }

    .server-icon {
      width: 58px;
      height: 58px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #60a5fa, #1d4ed8);
      color: white;
      font-size: 28px;
      font-weight: 700;
      box-shadow: 0 0 18px rgba(96, 165, 250, 0.5);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      margin-top: auto;
      padding: 10px 6px;
      background: rgba(15, 23, 42, 0.48);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 10px;
    }

    .user-pfp {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #fbbf24, #f97316);
      color: #111827;
      font-size: 14px;
      font-weight: 700;
    }

    .user-identity {
      min-width: 0;
    }

    .user-username {
      overflow: hidden;
      color: #f8fafc;
      font-size: 12px;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-status {
      color: #86efac;
      font-size: 10px;
    }

    .channel-panel {
      width: 260px;
      background: rgba(15, 23, 42, 0.56);
      border-right: 1px solid rgba(148, 163, 184, 0.12);
      padding: 18px 14px 12px;
      display: flex;
      flex-direction: column;
    }

    .server-name {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 18px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .owner-badge {
      background: rgba(96, 165, 250, 0.18);
      border: 1px solid rgba(96, 165, 250, 0.4);
      color: #bfdbfe;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 999px;
      font-weight: 600;
    }

    .channels-title {
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #94a3b8;
      margin: 10px 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .add-channel-btn {
      border: none;
      background: rgba(148, 163, 184, 0.12);
      color: #e2e8f0;
      border-radius: 8px;
      padding: 7px 10px;
      cursor: pointer;
      font-weight: 700;
    }

    .channel-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .channel-item {
      width: 100%;
      border: none;
      text-align: left;
      background: transparent;
      color: #cbd5e1;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 15px;
      cursor: pointer;
      transition: 0.2s ease;
    }

    .channel-item.active {
      background: rgba(59, 130, 246, 0.18);
      color: white;
      font-weight: 600;
    }

    .channel-item:hover {
      background: rgba(148, 163, 184, 0.08);
    }

    .channel-menu {
      position: fixed;
      z-index: 10;
      display: none;
      min-width: 130px;
      padding: 6px;
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 8px;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
    }

    .channel-menu.open {
      display: block;
    }

    .channel-menu button {
      width: 100%;
      border: none;
      background: transparent;
      color: #e2e8f0;
      border-radius: 5px;
      padding: 8px 10px;
      text-align: left;
      cursor: pointer;
    }

    .channel-menu button:hover {
      background: rgba(96, 165, 250, 0.2);
    }

    .chat-panel {
      flex: 1;
      background: rgba(15, 23, 42, 0.28);
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .chat-header {
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 22px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
      font-size: 18px;
      font-weight: 700;
      background: rgba(15, 23, 42, 0.34);
    }

    .channel-tag {
      color: #e2e8f0;
    }

    .message-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px 22px 14px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .message {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 10px 12px;
      border-radius: 12px;
    }

    .message:hover {
      background: rgba(148, 163, 184, 0.04);
    }

    .avatar {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fbbf24, #f97316);
      color: #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }

    .message-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .user-name {
      font-weight: 700;
      color: white;
    }

    .time {
      color: #94a3b8;
      font-size: 11px;
    }

    .chat-title {
      font-size: 17px;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 6px;
    }

    .text {
      color: #dbeafe;
      line-height: 1.5;
    }

    .reaction-bar {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }

    .reaction-btn {
      border: 1px solid rgba(148, 163, 184, 0.2);
      background: rgba(30, 41, 59, 0.8);
      color: #cbd5e1;
      border-radius: 8px;
      padding: 5px 9px;
      cursor: pointer;
      font-size: 13px;
    }

    .reaction-btn:hover,
    .reaction-btn.active {
      background: rgba(96, 165, 250, 0.2);
      border-color: rgba(96, 165, 250, 0.55);
      color: #f8fafc;
    }

    .reply-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
      padding-left: 14px;
      border-left: 2px solid rgba(96, 165, 250, 0.35);
    }

    .reply-item {
      color: #cbd5e1;
      font-size: 13px;
      line-height: 1.45;
    }

    .reply-author {
      color: #bfdbfe;
      font-weight: 700;
    }

    .composer {
      border-top: 1px solid rgba(148, 163, 184, 0.12);
      padding: 14px 18px 18px;
      background: rgba(15, 23, 42, 0.8);
    }

    .composer-box {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 14px;
      padding: 12px;
    }

    .replying-to {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #bfdbfe;
      font-size: 13px;
    }

    .cancel-reply-btn {
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      font-size: 12px;
    }

    .title-input,
    .message-input {
      width: 100%;
      background: transparent;
      border: none;
      color: white;
      font-size: 15px;
      outline: none;
    }

    .title-input::placeholder,
    .message-input::placeholder {
      color: #94a3b8;
    }

    .composer-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .message-input {
      flex: 1;
    }

    .send-btn {
      border: none;
      background: linear-gradient(135deg, #60a5fa, #2563eb);
      color: white;
      font-weight: 700;
      padding: 10px 16px;
      border-radius: 10px;
      cursor: pointer;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="discord-app">
    <div class="server-bar">
      <button class="back-button" id="backButton" type="button" title="Return to main page">Back</button>
      <div class="server-icon">${safeName.charAt(0).toUpperCase() || 'C'}</div>
      <div class="user-profile" title="Your profile">
        <div class="user-pfp">Y</div>
        <div class="user-identity">
          <div class="user-username">You</div>
          <div class="user-status">Online</div>
        </div>
      </div>
    </div>

    <aside class="channel-panel">
      <div class="server-name">
        <span>${safeName}</span>
        <span class="owner-badge">Owner</span>
      </div>

      <div class="channels-title">
        <span>Channels</span>
        <button class="add-channel-btn" id="addChannelBtn" type="button">+ Add</button>
      </div>

      <div class="channel-list" id="channelList"></div>
    </aside>

    <div class="channel-menu" id="channelMenu">
      <button id="renameChannelBtn" type="button">Rename</button>
    </div>

    <main class="chat-panel">
      <header class="chat-header">
        <span class="channel-tag" id="activeChannelTag">[chat]</span>
      </header>

      <div class="message-area" id="messageArea"></div>

      <div class="composer">
        <div class="composer-box">
          <div class="replying-to" id="replyingTo" hidden>
            <span id="replyingToText"></span>
            <button class="cancel-reply-btn" id="cancelReplyBtn" type="button">Cancel</button>
          </div>
          <input id="titleInput" class="title-input" placeholder="Title your chat..." />
          <div class="composer-row">
            <input id="messageInput" class="message-input" placeholder="Message [chat]" />
            <button id="sendBtn" class="send-btn" type="button">Send</button>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    const storageKey = ${JSON.stringify(safeKey)};
    const defaultState = {
      activeChannel: 'chat',
      channels: [
        {
          name: 'chat',
          messages: [
            { user: 'Owner', text: 'Welcome to ' + ${JSON.stringify(safeName)} + '! Create channels and start chatting.' }
          ]
        }
      ]
    };

    const savedState = JSON.parse(localStorage.getItem(storageKey) || 'null');
    const state = savedState || defaultState;
    const channelList = document.getElementById('channelList');
    const messageArea = document.getElementById('messageArea');
    const titleInput = document.getElementById('titleInput');
    const messageInput = document.getElementById('messageInput');
    const replyingTo = document.getElementById('replyingTo');
    const replyingToText = document.getElementById('replyingToText');
    const cancelReplyBtn = document.getElementById('cancelReplyBtn');
    const activeChannelTag = document.getElementById('activeChannelTag');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const sendBtn = document.getElementById('sendBtn');
    const channelMenu = document.getElementById('channelMenu');
    const renameChannelBtn = document.getElementById('renameChannelBtn');
    const backButton = document.getElementById('backButton');
    let replyTarget = null;
    let contextChannel = null;

    function saveState() {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }

    function getActiveChannel() {
      return state.channels.find(channel => channel.name === state.activeChannel) || state.channels[0];
    }

    function renderChannels() {
      channelList.innerHTML = '';

      state.channels.forEach(channel => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'channel-item' + (channel.name === state.activeChannel ? ' active' : '');
        button.textContent = '[' + channel.name + ']';
        button.addEventListener('click', () => {
          state.activeChannel = channel.name;
          render();
        });
        button.addEventListener('contextmenu', event => {
          event.preventDefault();
          contextChannel = channel;
          channelMenu.style.left = event.clientX + 'px';
          channelMenu.style.top = event.clientY + 'px';
          channelMenu.classList.add('open');
        });
        channelList.appendChild(button);
      });
    }

    function closeChannelMenu() {
      channelMenu.classList.remove('open');
      contextChannel = null;
    }

    function renameChannel() {
      if (!contextChannel) return;

      const newName = prompt('Rename channel:', contextChannel.name);
      const trimmedName = newName ? newName.trim() : '';
      if (!trimmedName || trimmedName === contextChannel.name) {
        closeChannelMenu();
        return;
      }

      const duplicate = state.channels.some(channel =>
        channel !== contextChannel && channel.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        alert('This channel already exists.');
        closeChannelMenu();
        return;
      }

      const oldName = contextChannel.name;
      contextChannel.name = trimmedName;
      if (state.activeChannel === oldName) {
        state.activeChannel = trimmedName;
      }

      saveState();
      closeChannelMenu();
      render();
    }

    function renderMessages() {
      const currentChannel = getActiveChannel();
      messageArea.innerHTML = '';
      activeChannelTag.textContent = '[' + currentChannel.name + ']';
      messageInput.placeholder = 'Message [' + currentChannel.name + ']';

      currentChannel.messages.forEach(message => {
        const row = document.createElement('div');
        row.className = 'message';

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = (message.user || 'U').charAt(0).toUpperCase();

        const body = document.createElement('div');
        body.style.flex = '1';

        const meta = document.createElement('div');
        meta.className = 'message-meta';

        const name = document.createElement('span');
        name.className = 'user-name';
        name.textContent = message.user || 'User';

        const time = document.createElement('span');
        time.className = 'time';
        time.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        const title = document.createElement('div');
        title.className = 'chat-title';
        title.textContent = message.title || 'Untitled chat';

        const text = document.createElement('div');
        text.className = 'text';
        text.textContent = message.text || '';

        meta.appendChild(name);
        meta.appendChild(time);
        body.appendChild(meta);
        body.appendChild(title);
        body.appendChild(text);

        const reactionBar = document.createElement('div');
        reactionBar.className = 'reaction-bar';

        const likeButton = document.createElement('button');
        likeButton.type = 'button';
        likeButton.className = 'reaction-btn' + (message.reaction === 'like' ? ' active' : '');
        likeButton.textContent = 'Like ' + (message.likes || 0);

        const dislikeButton = document.createElement('button');
        dislikeButton.type = 'button';
        dislikeButton.className = 'reaction-btn' + (message.reaction === 'dislike' ? ' active' : '');
        dislikeButton.textContent = 'Dislike ' + (message.dislikes || 0);

        likeButton.addEventListener('click', () => {
          updateReaction(message, 'like');
        });
        dislikeButton.addEventListener('click', () => {
          updateReaction(message, 'dislike');
        });

        reactionBar.appendChild(likeButton);
        reactionBar.appendChild(dislikeButton);
        const replyButton = document.createElement('button');
        replyButton.type = 'button';
        replyButton.className = 'reaction-btn';
        replyButton.textContent = 'Reply';
        replyButton.addEventListener('click', () => {
          replyTarget = message;
          updateReplyComposer();
          messageInput.focus();
        });
        reactionBar.appendChild(replyButton);

        const replies = message.replies || [];
        if (replies.length > 0) {
          const replyList = document.createElement('div');
          replyList.className = 'reply-list';
          replies.forEach(reply => {
            const replyItem = document.createElement('div');
            replyItem.className = 'reply-item';
            replyItem.innerHTML = '<span class="reply-author"></span>: <span class="reply-text"></span>';
            replyItem.querySelector('.reply-author').textContent = reply.user || 'User';
            replyItem.querySelector('.reply-text').textContent = reply.text || '';
            replyList.appendChild(replyItem);
          });
          body.appendChild(replyList);
        }

        row.appendChild(avatar);
        row.appendChild(body);
        body.appendChild(reactionBar);
        messageArea.appendChild(row);
      });

      messageArea.scrollTop = messageArea.scrollHeight;
    }

    function updateReplyComposer() {
      const isReplying = Boolean(replyTarget);
      replyingTo.hidden = !isReplying;
      titleInput.hidden = isReplying;

      if (isReplying) {
        replyingToText.textContent = 'Replying to: ' + (replyTarget.title || 'Untitled chat');
      }
    }

    function cancelReply() {
      replyTarget = null;
      updateReplyComposer();
    }

    function updateReaction(message, reaction) {
      message.likes = message.likes || 0;
      message.dislikes = message.dislikes || 0;

      if (message.reaction === reaction) {
        message[reaction === 'like' ? 'likes' : 'dislikes'] -= 1;
        message.reaction = null;
      } else {
        if (message.reaction) {
          message[message.reaction === 'like' ? 'likes' : 'dislikes'] -= 1;
        }

        message[reaction === 'like' ? 'likes' : 'dislikes'] += 1;
        message.reaction = reaction;
      }

      saveState();
      renderMessages();
    }

    function render() {
      renderChannels();
      renderMessages();
    }

    function sendMessage() {
      const title = titleInput.value.trim();
      const text = messageInput.value.trim();
      if (!text) return;

      const currentChannel = getActiveChannel();
      if (!currentChannel) return;

      if (replyTarget) {
        replyTarget.replies = replyTarget.replies || [];
        replyTarget.replies.push({ user: 'You', text });
      } else {
        currentChannel.messages.push({
          user: 'You',
          title: title || 'Untitled chat',
          text,
          likes: 0,
          dislikes: 0,
          reaction: null,
          replies: []
        });
      }

      replyTarget = null;
      titleInput.value = '';
      messageInput.value = '';
      saveState();
      updateReplyComposer();
      renderMessages();
    }

    function addChannel(name) {
      const channelName = String(name || '').trim();
      if (!channelName) return;

      const exists = state.channels.some(channel => channel.name.toLowerCase() === channelName.toLowerCase());
      if (exists) {
        alert('This channel already exists.');
        return;
      }

      state.channels.push({
        name: channelName,
        messages: [{ user: 'Owner', text: 'Channel [' + channelName + '] created.' }]
      });
      state.activeChannel = channelName;
      saveState();
      render();
    }

    addChannelBtn.addEventListener('click', () => {
      const channelName = prompt('Name your new channel:', 'chat');
      addChannel(channelName || '');
    });

    renameChannelBtn.addEventListener('click', renameChannel);
    backButton.addEventListener('click', () => {
      window.location.href = '/';
    });
    document.addEventListener('click', event => {
      if (!channelMenu.contains(event.target)) {
        closeChannelMenu();
      }
    });

    cancelReplyBtn.addEventListener('click', cancelReply);
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
      }
    });
    titleInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        messageInput.focus();
      }
    });

    if (!state.channels || state.channels.length === 0) {
      state.channels = defaultState.channels;
      state.activeChannel = 'chat';
    }

    render();
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    const launcherPath = path.join(__dirname, 'Glidernet.html');
    fs.readFile(launcherPath, (error, content) => {
      if (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Unable to load the main page.');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/styles.css') {
    const stylesPath = path.join(__dirname, 'styles.css');
    fs.readFile(stylesPath, (error, content) => {
      if (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Stylesheet not found.');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      res.end(content);
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/GliderSpace.png') {
    const imagePath = path.join(__dirname, 'GliderSpace.png');
    fs.readFile(imagePath, (error, content) => {
      if (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Background image not found.');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(content);
    });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/server/')) {
    const serverName = decodeURIComponent(url.pathname.replace('/server/', '') || 'My Server');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buildServerPage(serverName));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('GlideServer is running. Create a circle in Glidernet.html to open a personalized server page.');
});

server.listen(PORT, () => {
  console.log(`GlideServer running on http://localhost:${PORT}`);
});
