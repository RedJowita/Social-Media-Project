const http = require('http');
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
      background: linear-gradient(135deg, #020817, #0b1220 35%, #111827 100%);
    }

    .server-bar {
      width: 92px;
      background: rgba(15, 23, 42, 0.85);
      border-right: 1px solid rgba(148, 163, 184, 0.15);
      padding-top: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
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

    .channel-panel {
      width: 260px;
      background: rgba(15, 23, 42, 0.96);
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

    .chat-panel {
      flex: 1;
      background: rgba(15, 23, 42, 0.72);
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
      background: rgba(15, 23, 42, 0.6);
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
      <div class="server-icon">${safeName.charAt(0).toUpperCase() || 'C'}</div>
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

    <main class="chat-panel">
      <header class="chat-header">
        <span class="channel-tag" id="activeChannelTag"># chat</span>
      </header>

      <div class="message-area" id="messageArea"></div>

      <div class="composer">
        <div class="composer-box">
          <input id="titleInput" class="title-input" placeholder="Title your chat..." />
          <div class="composer-row">
            <input id="messageInput" class="message-input" placeholder="Message #chat" />
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
    const activeChannelTag = document.getElementById('activeChannelTag');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const sendBtn = document.getElementById('sendBtn');

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
        button.textContent = '#' + channel.name;
        button.addEventListener('click', () => {
          state.activeChannel = channel.name;
          render();
        });
        channelList.appendChild(button);
      });
    }

    function renderMessages() {
      const currentChannel = getActiveChannel();
      messageArea.innerHTML = '';
      activeChannelTag.textContent = '# ' + currentChannel.name;
      messageInput.placeholder = 'Message #' + currentChannel.name;

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
        row.appendChild(avatar);
        row.appendChild(body);
        messageArea.appendChild(row);
      });

      messageArea.scrollTop = messageArea.scrollHeight;
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

      currentChannel.messages.push({
        user: 'You',
        title: title || 'Untitled chat',
        text
      });

      titleInput.value = '';
      messageInput.value = '';
      saveState();
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
        messages: [{ user: 'Owner', text: 'Channel #' + channelName + ' created.' }]
      });
      state.activeChannel = channelName;
      saveState();
      render();
    }

    addChannelBtn.addEventListener('click', () => {
      const channelName = prompt('Name your new channel:', 'chat');
      addChannel(channelName || '');
    });

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
