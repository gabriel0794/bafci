import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import sequelize from './config/db.js';
import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';
import revenueRoutes from './routes/revenue.js';

// Load environment variables
dotenv.config();

const app = express();

// Connect to database
connectDB();

// Sync database models
sequelize.sync().then(() => {
  console.log('Database & tables created!');
});

// Init Middleware
// Configure CORS with specific origin and credentials
const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/revenue', revenueRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
