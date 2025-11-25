import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import sequelize from './config/db.js';
import './models/index.js'; // Import models to initialize associations
import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';
import revenueRoutes from './routes/revenue.js';
import branchRoutes from './routes/branch.js';
import memberRoutes from './routes/member.js';
import fieldWorkerRoutes from './routes/fieldWorker.js';
import paymentRoutes from './routes/payment.js';
import programRoutes from './routes/program.js';
import notificationRoutes from './routes/notification.js';
import barangayMemberRoutes from './routes/barangayMember.js';
import bootstrapRoutes from './routes/bootstrap.js';
import { initializeSMSScheduler } from './services/smsScheduler.js';

// Load environment variables
dotenv.config();

const app = express();

// Connect to database
connectDB();

// Sync database models (don't alter tables, use migrations instead)
sequelize.sync({ alter: false }).then(() => {
  console.log('Database models synced!');
}).catch((err) => {
  console.error('Error syncing database:', err);
});

// Init Middleware
// Configure CORS with specific origin and credentials
const allowedOrigins = [
  'http://localhost:5173',
  'https://bafci.onrender.com',
  'https://bafci-client.onrender.com',
  'https://bafci-testing.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

// TEMPORARY: Simplified CORS for debugging
const corsOptions = {
  origin: true, // Allow all origins temporarily for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'authorization', 'Authorization', 'Accept'],
  exposedHeaders: ['x-auth-token'],
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(express.json());

// Serve static files from the 'uploads' directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/field-workers', fieldWorkerRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/barangay-members', barangayMemberRoutes);
app.use('/api/bootstrap', bootstrapRoutes); // TEMPORARY - Remove after seeding production DB

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  
  // Initialize automatic SMS scheduler after a short delay to ensure models are loaded
  setTimeout(() => {
    initializeSMSScheduler();
  }, 2000);
});
