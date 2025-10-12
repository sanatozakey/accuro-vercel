# Accuro Backend API

Backend server for Accuro Calibration website built with Node.js, Express, TypeScript, and MongoDB.

## Features

- JWT Authentication
- Role-based authorization (User/Admin)
- RESTful API endpoints
- MongoDB database with Mongoose ODM
- TypeScript for type safety
- Input validation
- Error handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Update the environment variables in `.env`:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `PORT`: Server port (default: 5000)
   - Admin credentials will be auto-created on first run

## Running the Server

Development mode with hot reload:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user (Protected)
- PUT `/api/auth/updatedetails` - Update user details (Protected)
- PUT `/api/auth/updatepassword` - Update password (Protected)

### Bookings
- GET `/api/bookings` - Get all bookings (Admin only)
- POST `/api/bookings` - Create booking (Public)
- GET `/api/bookings/my` - Get my bookings (Protected)
- GET `/api/bookings/:id` - Get single booking (Protected)
- PUT `/api/bookings/:id` - Update booking (Admin only)
- DELETE `/api/bookings/:id` - Delete booking (Admin only)

### Quotes
- GET `/api/quotes` - Get all quotes (Admin only)
- POST `/api/quotes` - Create quote request (Public)
- GET `/api/quotes/:id` - Get single quote (Protected)
- PUT `/api/quotes/:id` - Update quote (Admin only)
- DELETE `/api/quotes/:id` - Delete quote (Admin only)

### Contacts
- GET `/api/contacts` - Get all contact messages (Admin only)
- POST `/api/contacts` - Create contact message (Public)
- GET `/api/contacts/:id` - Get single contact (Admin only)
- PUT `/api/contacts/:id` - Update contact (Admin only)
- DELETE `/api/contacts/:id` - Delete contact (Admin only)

## Default Admin Credentials

On first run, an admin user will be created with credentials from `.env`:
- Email: admin@accuro.com.ph
- Password: AdminPassword123!

**⚠️ IMPORTANT: Change these credentials in production!**

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <your_token_here>
```

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── server.ts       # Server entry point
├── .env               # Environment variables
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript config
```
