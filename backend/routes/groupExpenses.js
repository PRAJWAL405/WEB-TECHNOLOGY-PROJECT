import express from 'express';
import { body, validationResult } from 'express-validator';
import GroupExpense from '../models/GroupExpense.js';
import Group from '../models/Group.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   POST /api/group-expenses
// @desc    Add a new expense to a group
// @access  Private
router.post('/', [
    body('group').notEmpty().withMessage('Group ID is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('splits').isArray().withMessage('Splits must be an array')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { group, description, amount, splits, date } = req.body;

        // Verify group exists and user is member
        const groupDoc = await Group.findById(group);
        if (!groupDoc) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const isMember = groupDoc.members.some(member => member.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to add expense to this group' });
        }

        const groupExpense = await GroupExpense.create({
            group,
            description,
            amount,
            paidBy: req.body.paidBy || req.user._id,
            category: req.body.category || 'Other',
            date: date || Date.now(),
            splits
        });

        // Update group total expenses
        groupDoc.totalExpenses = (groupDoc.totalExpenses || 0) + parseFloat(amount);
        await groupDoc.save();

        res.status(201).json(groupExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/group-expenses/group/:groupId
// @desc    Get expenses for a specific group
// @access  Private
router.get('/group/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;

        // Verify group access
        const groupDoc = await Group.findById(groupId);
        if (!groupDoc) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const isMember = groupDoc.members.some(member => member.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to view this group' });
        }

        const expenses = await GroupExpense.find({ group: groupId })
            .populate('paidBy', 'name email')
            .populate('splits.user', 'name')
            .sort({ date: -1 });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/group-expenses/:id
// @desc    Delete a group expense
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const expense = await GroupExpense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Verify group access (must be payer or group creator? or just member?)
        // For now, let's say payer or group creator
        const groupDoc = await Group.findById(expense.group);
        if (!groupDoc) return res.status(404).json({ message: 'Group not found' });

        const isPayer = expense.paidBy.toString() === req.user._id.toString();
        const isCreator = groupDoc.createdBy.toString() === req.user._id.toString();

        if (!isPayer && !isCreator) {
            return res.status(403).json({ message: 'Not authorized to delete this expense' });
        }

        // Update group total
        groupDoc.totalExpenses = Math.max(0, (groupDoc.totalExpenses || 0) - expense.amount);
        await groupDoc.save();

        await expense.deleteOne();
        res.json({ message: 'Group expense removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
