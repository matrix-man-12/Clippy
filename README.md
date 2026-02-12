# Clippy — Clipboard Sync Web App

A persistent cross-device clipboard vault. Save text, formatted text, JSON, and images — access them across phone and browser instantly.

## Tech Stack

| Layer    | Technology         |
| -------- | ------------------ |
| Frontend | React + Vite       |
| Backend  | Node.js + Express  |
| Database | PostgreSQL         |
| Auth     | Clerk              |
| Storage  | S3-compatible      |

## Project Structure

```
├── client/    # React + Vite frontend
├── server/    # Express API backend
└── docs/      # PRD, guides, and documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm

### Client

```bash
cd client
npm install
npm run dev
```

Opens at `http://localhost:5173`

### Server

```bash
cd server
cp .env.example .env   # fill in your values
npm install
node index.js
```

Runs at `http://localhost:3001`
