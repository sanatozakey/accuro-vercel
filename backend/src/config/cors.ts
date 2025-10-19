export const corsConfig = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://accuro-vercel-sfom.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // 10 minutes
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
