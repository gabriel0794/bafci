import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import sequelize from './config/db.js';
import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';

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
app.use(cors());
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
