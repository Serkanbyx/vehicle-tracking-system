# Vehicle Tracking System

Real-time vehicle tracking system built with **NestJS** (backend) and **React** (frontend).

## Project Structure

```
vehicle-tracking-system/
├── .gitignore
├── biome.json          # Shared linter & formatter config
├── README.md
├── STEPS.md
├── server/             # NestJS backend API
└── client/             # React frontend app
```

## Tech Stack

### Backend
- **NestJS** — TypeScript-based Node.js framework
- **PostgreSQL** — Relational database
- **Prisma** — ORM
- **Socket.IO** — Real-time communication

### Frontend
- **React** — UI library
- **TypeScript** — Type safety
- **Tailwind CSS** — Utility-first CSS

## Getting Started

Detailed setup instructions for each part of the project can be found in `STEPS.md`.

## Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting, configured via the root `biome.json`.
