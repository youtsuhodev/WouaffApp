# Wouaff

Secure instant messaging application — chat, calls, stories, and video feed.

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-61DAFB)
![Express](https://img.shields.io/badge/Express-4.21-green)
![License](https://img.shields.io/badge/License-Custom-blue)
![Electron](https://img.shields.io/badge/Electron-33-47848F)

## Features

- **End-to-end encrypted messaging** (ECDH P-256 + AES-256-GCM)
- **Voice & video calls** via WebRTC
- **Stories** with music overlay (expire after 12h)
- **TikTok-like video feed** with likes, comments, and location
- **Group chats** with roles, permissions, and invite links
- **Ephemeral messages** with auto-destruction (5s to 24h)
- **File sharing** with image, voice, and document support
- **Rich text** with Markdown rendering and link previews
- **Cross-platform**: Web (PWA), Desktop (Electron), Mobile (PWA)
- **Custom themes** including dark/light mode
- **Admin panel** for moderation and user management

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Express 4, Socket.IO, MySQL (mysql2) |
| Desktop | Electron 33, electron-builder |
| Security | ECDH + AES-256-GCM (E2EE), bcrypt, httpOnly sessions |
| Storage | MySQL, Google Cloud Storage (cold archive) |
| Real-time | Socket.IO (messaging, calls, typing, presence) |

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/wouaff.git
cd wouaff

# Install dependencies
cd client && npm install
cd ../server && npm install
cd ..

# Set up environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit .env files with your configuration

# Run database migrations (auto on server start)
cd server && npm run dev
```

### Development

```bash
# Terminal 1 — Server
cd server
npm run dev

# Terminal 2 — Client
cd client
npm run dev
```

The client dev server runs on `http://localhost:5173` and proxies API requests to the server on `http://localhost:7284`.

### Production Build

```bash
cd client && npm run build
cd ../server && npm run build
cd ..
npm run start:prod
```

### Desktop (Electron)

```bash
cd client
npm run electron:dev    # Development mode
npm run electron:build  # Production build (Windows/Mac/Linux)
```

## Architecture

```
wouaff/
├── client/          # React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # React contexts (Auth, Call, Theme)
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API client, Socket.IO, E2EE, WebRTC
│   │   ├── types/        # TypeScript definitions
│   │   └── utils/        # Helpers
│   └── electron/         # Electron main process
├── server/          # Express API (TypeScript)
│   ├── src/
│   │   ├── config/       # Database, migrations
│   │   ├── middleware/    # Auth, rate limit, error handling
│   │   ├── routes/       # REST API endpoints
│   │   ├── services/     # Business logic, storage
│   │   ├── socket/       # Socket.IO server
│   │   └── types/        # TypeScript definitions
│   └── migrations/       # SQL migration files
└── docs/            # Documentation
```

## Security

- **E2EE**: Messages are encrypted client-side with ECDH key exchange and AES-256-GCM
- **Session-based auth**: httpOnly cookies, no JWT exposed to JavaScript
- **Rate limiting**: Per-endpoint protection against abuse
- **XSS prevention**: HTML sanitization on rendered content
- **CSRF**: SameSite cookies
- **Ephemeral messages**: Server-enforced auto-deletion

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Wouaff License](LICENSE) — Allowed for contributions and improvements only. Redistribution under a different name or branding is prohibited.
