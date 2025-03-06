# Live Chat Extension

A real-time chat extension that integrates with Voiceflow and provides live chat functionality.

## Features
- Real-time messaging using Socket.IO
- Integration with Voiceflow chat interface
- Modern and responsive UI
- Instant message delivery
- Connection status feedback

## Setup
1. Clone the repository:
```bash
git clone https://github.com/nextsolution-ai/livechat.git
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. For production deployment:
- Update the Socket.IO connection URL in `extensions.js` to point to your production server
- Deploy the server to your hosting platform
- Enable GitHub Pages for the frontend

## Usage
1. Import the extension into your Voiceflow project
2. Trigger the live chat using the `ext_liveChat` event
3. Start chatting! 