import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import personalExpenseRoutes from './routes/personalExpenses.js';
import groupExpenseRoutes from './routes/groupExpenses.js';
import groupRoutes from './routes/groups.js';
import friendRoutes from './routes/friends.js';
import settlementRoutes from './routes/settlements.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'SplitEase API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/personal-expenses', personalExpenseRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/group-expenses', groupExpenseRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/settlements', settlementRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
