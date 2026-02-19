import express from 'express';
import { body, validationResult } from 'express-validator';
import Settlement from '../models/Settlement.js';
import Group from '../models/Group.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   POST /api/settlements
// @desc    Record a settlement (payment) between users
// @access  Private
router.post('/', [
    body('group').notEmpty(),
    body('payee').notEmpty(),
    body('amount').isNumeric()
], async (req, res) => {
    try {
        const { group, payee, amount } = req.body;
        const payer = req.user._id;

        // Verify group membership
        const groupDoc = await Group.findById(group);
        if (!groupDoc) return res.status(404).json({ message: 'Group not found' });

        const isMember = groupDoc.members.some(m => m.user.toString() === payer.toString());
        if (!isMember) return res.status(403).json({ message: 'Not a member of this group' });

        const settlement = await Settlement.create({
            group,
            payer,
            payee,
            amount: parseFloat(amount)
        });

        res.status(201).json(settlement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/settlements/group/:groupId
// @desc    Get settlements for a group
// @access  Private
router.get('/group/:groupId', async (req, res) => {
    try {
        const settlements = await Settlement.find({ group: req.params.groupId })
            .populate('payer', 'name')
            .populate('payee', 'name')
            .sort({ date: -1 });
        res.json(settlements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/settlements/user
// @desc    Get all settlements for the current user
// @access  Private
router.get('/user', async (req, res) => {
    try {
        const settlements = await Settlement.find({
            $or: [
                { payer: req.user._id },
                { payee: req.user._id }
            ]
        })
            .populate('payer', 'name')
            .populate('payee', 'name')
            .populate('group', 'name')
            .sort({ date: -1 });
        res.json(settlements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
