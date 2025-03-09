// Import Socket.IO client
import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

export const LiveChatExtension = {
  name: "LiveChat",
  type: "effect",
  match: ({ trace }) => {
    return trace.type === "ext_liveChat" || trace.payload?.name === "ext_liveChat";
  },
  effect: ({ trace }) => {
    const chatDiv = document.getElementById("voiceflow-chat");
    if (chatDiv) {
      const shadowRoot = chatDiv.shadowRoot;
      if (shadowRoot) {
        const inputContainer = shadowRoot.querySelector("._1vj16245");
        const dialogContainer = shadowRoot.querySelector(".vfrc-footer._1vj16242");
  
        if (inputContainer && dialogContainer) {
          // Create overlay to prevent interference with underlying elements
          const overlay = document.createElement("div");
          overlay.style.position = "absolute";
          overlay.style.top = "0";
          overlay.style.left = "0";
          overlay.style.width = "100%";
          overlay.style.height = "100%";
          overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
          overlay.style.zIndex = "1000";
  
          // Create the live chat container with animation
          const customContainer = document.createElement("div");
          customContainer.style.position = "absolute";
          customContainer.style.zIndex = "1000";
          customContainer.style.width = "100%";
          customContainer.style.bottom = "0";
  
          customContainer.innerHTML = `
            <style>
              .livechat-container {
                box-sizing: border-box;
                box-shadow: rgba(48, 31, 6, 0.04) 0px -2px 8px;
                height: 700px;
                transition: transform 0.5s ease-out, opacity 0.5s ease-out;
                transform: translateY(100%);
                opacity: 0;
                overflow: hidden;
                border: 1px solid rgb(232, 232, 235);
                border-radius: 16px 16px 0 0;
                background: #fff;
                padding: 10px;
                display: flex;
                flex-direction: column;
                font-family: "Open Sans", sans-serif;
              }
              .livechat-container.show {
                transform: translateY(0);
                opacity: 1;
              }
              .chat-history {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                padding: 5px;
                border-radius: 8px;
              }
              .chat-message {
                margin: 5px 0;
                padding: 8px;
                border-radius: 8px;
                max-width: 80%;
              }
              .chat-message.user {
                background: #2196f3;
                color: white;
                margin-left: auto;
              }
              .chat-message.server {
                background: #f1f0f0;
                margin-right: auto;
              }
              .chat-input-area {
                display: flex;
              }
              .chat-input-area textarea {
                flex: 1;
                padding: 5px;
                border-radius: 4px;
                border: 1px solid #ccc;
                resize: none;
              }
              .chat-input-area button {
                margin-left: 5px;
                padding: 5px 10px;
                border: none;
                border-radius: 4px;
                background: #2196f3;
                color: white;
                cursor: pointer;
              }
              .end-chat {
                margin-top: 10px;
                align-self: flex-end;
                background: #f44336;
                color: #fff;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
              }
            </style>
            <div class="livechat-container" id="livechat-container">
              <div class="chat-history" id="chat-history"></div>
              <div class="chat-input-area">
                <textarea id="chat-input" rows="2" placeholder="Type your message here..."></textarea>
                <button id="send-btn">Send</button>
              </div>
              <button class="end-chat" id="end-chat-btn">End Chat</button>
            </div>
          `;
  
          dialogContainer.appendChild(overlay);
          dialogContainer.appendChild(customContainer);
  
          // Trigger the slide-up animation after appending
          setTimeout(() => {
            const container = customContainer.querySelector('#livechat-container');
            container.classList.add('show');
          }, 10);
  
          // Initialize Socket.IO connection with error handling
          let socket;
          try {
            // Use the same server URL configuration as script.js
            const SERVER_URL = {
              PRODUCTION: 'https://livechat-server-s24m.onrender.com',
              LOCAL: 'http://localhost:3000'
            };
  
            function getServerUrl() {
              if (window.location.hostname.includes('github.io')) {
                return SERVER_URL.PRODUCTION;
              }
              return SERVER_URL.LOCAL;
            }
  
            socket = io(getServerUrl(), {
              transports: ['websocket'],
              reconnection: true,
              reconnectionAttempts: 5
            });
  
            socket.on('connect', () => {
              console.log('User connected to chat server');
              // Emit start chat event when connected
              socket.emit('start chat');
            });
  
            socket.on('connect_error', (error) => {
              console.error('Connection error:', error);
              appendMessage('Unable to connect to chat server. Please try again later.', 'server');
            });
          } catch (error) {
            console.error('Socket connection error:', error);
            appendMessage('Chat service is currently unavailable.', 'server');
            return;
          }
  
          // Helper function to append messages to the chat history
          function appendMessage(message, sender = 'user') {
            const chatHistory = customContainer.querySelector('#chat-history');
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${sender}`;
            messageDiv.textContent = message;
            chatHistory.appendChild(messageDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
          }
  
          // Function to send a message
          function sendMessage(message) {
            if (socket && socket.connected) {
              socket.emit('chat message', message);
            } else {
              appendMessage('Unable to send message. Please check your connection.', 'server');
            }
          }
  
          // Listen for incoming messages
          socket.on('chat message', (data) => {
            console.log('Received chat message:', data);
            appendMessage(data.message, data.userId === socket.id ? 'user' : 'server');
          });
  
          const sendBtn = customContainer.querySelector('#send-btn');
          const chatInput = customContainer.querySelector('#chat-input');
          const endChatBtn = customContainer.querySelector('#end-chat-btn');
  
          sendBtn.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message) {
              sendMessage(message);
              chatInput.value = '';
            }
          });
  
          // Optionally, allow sending messages by pressing Enter (without Shift)
          chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const message = chatInput.value.trim();
              if (message) {
                sendMessage(message);
                chatInput.value = '';
              }
            }
          });
  
          // End chat functionality – removes the extension UI
          endChatBtn.addEventListener('click', () => {
            if (socket) {
              socket.disconnect();
            }
            customContainer.remove();
            overlay.remove();
          });
        }
      }
    }
  },
};
