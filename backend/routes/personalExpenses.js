import express from 'express';
import { body, validationResult } from 'express-validator';
import PersonalExpense from '../models/PersonalExpense.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/personal-expenses
// @desc    Get all personal expenses for logged in user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { category, startDate, endDate } = req.query;

        // Build query
        const query = { user: req.user._id };

        if (category) {
            query.category = category;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        const expenses = await PersonalExpense.find(query).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/personal-expenses/:id
// @desc    Get single personal expense
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const expense = await PersonalExpense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Make sure user owns expense
        if (expense.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/personal-expenses
// @desc    Create new personal expense
// @access  Private
router.post('/', [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, amount, category, date, description, isSplit, numberOfPeople, splitWith } = req.body;

        const expense = await PersonalExpense.create({
            user: req.user._id,
            title,
            amount,
            category,
            date: date || Date.now(),
            description,
            isSplit: isSplit || false,
            numberOfPeople: numberOfPeople || 1,
            splitWith: splitWith || []
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/personal-expenses/:id
// @desc    Update personal expense
// @access  Private
router.put('/:id', [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('date').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const expense = await PersonalExpense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Make sure user owns expense
        if (expense.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { title, amount, category, date, description, isSplit, numberOfPeople, splitWith } = req.body;

        expense.title = title || expense.title;
        expense.amount = amount !== undefined ? amount : expense.amount;
        expense.category = category || expense.category;
        expense.date = date || expense.date;
        expense.description = description !== undefined ? description : expense.description;
        expense.isSplit = isSplit !== undefined ? isSplit : expense.isSplit;
        expense.numberOfPeople = numberOfPeople !== undefined ? numberOfPeople : expense.numberOfPeople;
        expense.splitWith = splitWith || expense.splitWith;

        const updatedExpense = await expense.save();
        res.json(updatedExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/personal-expenses/:id
// @desc    Delete personal expense
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const expense = await PersonalExpense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Make sure user owns expense
        if (expense.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await expense.deleteOne();
        res.json({ message: 'Expense removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
