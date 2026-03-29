# Accuro Web Frontend

React-based frontend for the Accuro platform.

## Stack

- React 19 + TypeScript
- Tailwind CSS 3.4 + Radix UI
- React Router v7
- React Query (server state)
- Context API (Auth, Cart, Theme, Socket)
- FullCalendar (booking calendar)
- Socket.IO (real-time updates)
- Axios with automatic token refresh

## Setup

```bash
cp .env.example .env
npm install
npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend API URL (e.g., `http://localhost:5000/api`) |
