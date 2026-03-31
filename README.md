# Accuro - Beamex Instrumentation & Calibration Platform

A full-stack web platform for **Accuro**, an authorized distributor of Beamex calibration and instrumentation equipment in the Philippines. The platform enables customers to browse products, book service meetings, request quotations, and manage their accounts, while providing administrators with a comprehensive dashboard for operations management.

## Live Demo

- **Website:** [accuro-vercel-sfom.vercel.app](https://accuro-vercel-sfom.vercel.app)
- **API:** [accuro-backend.onrender.com](https://accuro-backend.onrender.com)

## Features

### Customer-Facing
- Product catalog with search, filtering, and detailed product pages
- Service meeting booking with time slot selection
- Quotation request system with customer approval workflow (accept/decline/re-quote)
- View assigned technician details for confirmed bookings
- Email verification and two-factor authentication (TOTP)
- Real-time notifications via Socket.IO
- User dashboard with booking history, quotation tracking, and getting-started guide
- Product reviews and ratings

### Technician Dashboard
- Dedicated dashboard for dispatched technicians
- View assigned bookings and upcoming schedule
- Start meetings and mark bookings as in-progress
- Submit completion reports with service details and attachments
- Revise rejected reports based on superadmin feedback
- Profile management with specialization details visible to customers

### Admin Dashboard
- Interactive booking calendar (FullCalendar) with status color coding
- Quotation management with send-quote and re-quotation workflow
- Real-time analytics and business metrics
- Chat support system with automated bot responses
- Activity logs and audit trail
- Data export (CSV)

### Superadmin Dashboard
- All admin features plus:
- Technician dispatch — assign certified technicians to confirmed bookings
- Technician availability checking to prevent scheduling conflicts
- Reassign technicians to bookings when needed
- Review and approve/reject completion reports submitted by technicians
- User management with role assignment (user, technician, admin, superadmin)
- Booking completion workflow oversight

### Security
- JWT authentication with refresh token rotation
- Two-factor authentication (TOTP with backup codes)
- Role-based access control (User / Technician / Admin / Superadmin)
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
│       └── utils/           # TOTP, email templates, seed scripts
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
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` - Default admin account credentials
- `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` - Default superadmin account
- `TECH1_EMAIL` / `TECH1_PASSWORD` through `TECH3_*` - Pre-seeded technician accounts

**Frontend** (see `my-accuro-website/.env.example`):
- `REACT_APP_API_URL` - Backend API URL

## User Roles & Permissions

| Role | Access |
|------|--------|
| **User (Customer)** | Browse products, book meetings, request quotations, accept/decline quotes, view assigned technician, manage profile |
| **Technician** | View assigned bookings, start meetings, submit completion reports, revise rejected reports, manage profile & specialization |
| **Admin** | All technician features + manage all bookings, send quotation pricing, chat support |
| **Superadmin** | All admin features + dispatch technicians, review completion reports, manage user roles, analytics |


## User Flows

### Customer Flow
1. **Register & verify email** — Create an account and verify via email link
2. **Browse products** — Explore the Beamex product catalog with search and filters
3. **Request a quotation** — Add products to quote list and submit a quotation request
4. **Receive & review quote** — Admin sends pricing; customer receives a detailed quotation
5. **Accept or decline** — Accept the quote to proceed, or decline to request a revised quote
6. **Book a meeting** — Schedule a consultation/service meeting at a preferred date and time
7. **Technician assigned** — A certified technician is dispatched to the booking; customer sees technician details
8. **Service completed** — Technician completes the service; customer receives confirmation

### Technician Flow
1. **Log in** — Use pre-seeded credentials or get promoted by a superadmin
2. **Complete profile** — Fill in name, phone, and specialization (shown to customers)
3. **View assignments** — See all assigned bookings on the technician dashboard
4. **Start meeting** — Mark a booking as "in progress" when the service begins
5. **Submit completion report** — Upload service details and attachments after finishing
6. **Revise if needed** — If the superadmin rejects the report, revise and resubmit with corrections

### Admin Flow
1. **Manage quotations** — Review pending quotation requests and send pricing to customers
2. **Re-quote declined quotations** — If a customer declines, revise the quote and resend
3. **Manage bookings** — View all bookings on the calendar dashboard
4. **Chat support** — Respond to customer inquiries via the chat system
5. **Monitor activity** — Track user activity and business metrics

### Superadmin Flow
1. **Confirm & dispatch** — When a booking is pending, confirm it and assign a technician
2. **Check availability** — View technician availability to prevent scheduling conflicts
3. **Reassign technicians** — Change the assigned technician if needed
4. **Review completion reports** — Approve or reject technician-submitted service reports
5. **Manage users** — Assign roles (user, technician, admin, superadmin) to any account
6. **Analytics & oversight** — Access business analytics, audit trails, and system-wide reports

## Quotation Workflow

```
Customer submits request ──> Admin sends quote ──> Customer reviews
                                                       │
                                              ┌────────┴────────┐
                                           Accept            Decline
                                              │                 │
                                         Accepted         Admin re-quotes
                                                              │
                                                     Customer reviews again
```

- Quotation statuses: `pending` → `quoted` → `accepted` / `declined` → (re-quote loop) / `rejected` / `expired`
- Full quotation history is preserved for each re-quote round

## Booking & Dispatch Workflow

```
Customer books meeting ──> Superadmin confirms & dispatches technician
                                         │
                              Technician assigned (customer notified)
                                         │
                              Technician starts meeting (in_progress)
                                         │
                              Technician submits completion report
                                         │
                              Superadmin reviews report
                                    │           │
                                 Approve      Reject (with feedback)
                                    │           │
                               Completed    Technician revises & resubmits
```

- Booking statuses: `pending` → `confirmed` → `in_progress` → `pending_review` → `completed`
- Technician dispatch is mandatory when confirming a booking
- Only the assigned technician (or superadmin) can submit completion reports

## API Overview

The backend exposes 100+ endpoints across 23 route groups:

- `POST /api/auth/register` - User registration with email verification
- `POST /api/auth/login` - Login with optional 2FA
- `GET /api/products` - Product catalog with filtering
- `POST /api/bookings` - Create service booking
- `PUT /api/bookings/:id/confirm-dispatch` - Confirm booking & assign technician
- `PUT /api/bookings/:id/start` - Mark booking as in-progress
- `GET /api/bookings/my-assignments` - Technician's assigned bookings
- `GET /api/bookings/technician-availability` - Check technician scheduling conflicts
- `POST /api/quotations` - Request a quotation
- `PUT /api/quotations/:id/send-quote` - Admin sends pricing to customer
- `PUT /api/quotations/:id/accept` - Customer accepts quotation
- `PUT /api/quotations/:id/decline` - Customer declines quotation
- `GET /api/users/technicians` - List all technicians
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
