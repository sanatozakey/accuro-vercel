# Accuro - Beamex Instrumentation & Calibration Platform

A full-stack web platform for **Accuro**, an authorized distributor of Beamex calibration and instrumentation equipment in the Philippines. The platform enables customers to browse products, book service meetings, request quotations, and manage their accounts, while providing administrators with a comprehensive dashboard for operations management.

## Live Demo

- **Website:** [accuro-vercel-sfom.vercel.app](https://accuro-vercel-sfom.vercel.app)
- **API:** [accuro-backend.onrender.com](https://accuro-backend.onrender.com)

## Features

### Customer-Facing
- Product catalog with search, filtering, and detailed product pages
- Service meeting booking with time slot selection
- Quotation request system for custom pricing
- Email verification and two-factor authentication (TOTP)
- Real-time notifications via Socket.IO
- User dashboard with booking history and quotation tracking
- Product reviews and ratings

### Admin Dashboard
- Interactive booking calendar (FullCalendar) with status color coding
- Booking completion workflow with proof submission and superadmin review
- Real-time analytics and business metrics
- User management with role-based access control
- Chat support system with automated bot responses
- Quotation management and approval
- Activity logs and audit trail
- Data export (CSV)

### Security
- JWT authentication with refresh token rotation
- Two-factor authentication (TOTP with backup codes)
- Role-based access control (User / Admin / Superadmin)
- Rate limiting and input validation
- Helmet security headers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Radix UI, React Query |
| Backend | Node.js, Express, TypeScript, MongoDB/Mongoose |
| Auth | JWT + Refresh Tokens + 2FA (TOTP) |
| Real-time | Socket.IO |
| Email | Gmail API (OAuth2) |
| Calendar | FullCalendar, Google Calendar Integration |
| Deployment | Vercel (frontend), Render (backend) |

## Project Structure

```
.
├── my-accuro-website/       # React frontend
│   ├── public/              # Static assets & product images
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── contexts/        # Auth, Cart, Theme, Socket providers
│       ├── pages/           # Route-level page components
│       ├── services/        # API service layer (Axios)
│       └── utils/           # Helpers and utilities
├── backend/                 # Express API server
│   └── src/
│       ├── controllers/     # Route handlers
│       ├── models/          # Mongoose schemas (19 models)
│       ├── routes/          # API route definitions
│       ├── middleware/       # Auth, validation, rate limiting
│       ├── services/        # Socket.IO, email, notifications
│       └── utils/           # TOTP, email templates
├── vercel.json              # Vercel deployment config
└── render.yaml              # Render deployment config
```

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Gmail account with OAuth2 credentials (for email features)

### Backend Setup
```bash
cd backend
cp .env.example .env        # Configure your environment variables
npm install
npm run dev                  # Starts on http://localhost:5000
```

### Frontend Setup
```bash
cd my-accuro-website
cp .env.example .env         # Set REACT_APP_API_URL
npm install
npm start                    # Starts on http://localhost:3000
```

### Environment Variables

**Backend** (see `backend/.env.example`):
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for signing tokens
- `EMAIL_USER` / `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` / `GMAIL_REFRESH_TOKEN` - Gmail OAuth2
- `FRONTEND_URL` - Frontend origin for CORS and email links

**Frontend** (see `my-accuro-website/.env.example`):
- `REACT_APP_API_URL` - Backend API URL

## User Roles

| Role | Access |
|------|--------|
| **User** | Browse products, book meetings, request quotations, manage profile |
| **Admin** | All user features + manage bookings, submit completion reports, chat support |
| **Superadmin** | All admin features + review/approve completion reports, manage users, analytics |

## Booking Completion Workflow

1. Admin (technician) submits a completion report with service details and attachments
2. Booking moves to `pending_review` status
3. Superadmin reviews the report and approves or rejects with feedback
4. If rejected, the admin can revise and resubmit
5. Approved bookings move to `completed` status

## API Overview

The backend exposes 100+ endpoints across 23 route groups:

- `POST /api/auth/register` - User registration with email verification
- `POST /api/auth/login` - Login with optional 2FA
- `GET /api/products` - Product catalog with filtering
- `POST /api/bookings` - Create service booking
- `POST /api/quotations` - Request a quotation
- `GET /api/analytics` - Business metrics (admin)
- `POST /api/chat` - Real-time chat messaging

See `backend/.env.example` for full configuration options.

## Authors

Built as a capstone project by:
- Bigornia
- Bunyi
- Larga
- Lipata

## License

This project is proprietary and developed for academic purposes.
