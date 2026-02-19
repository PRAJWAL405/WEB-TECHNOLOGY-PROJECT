import express from 'express';
import { body, validationResult } from 'express-validator';
import Friend from '../models/Friend.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/friends
// @desc    Get all friends for logged in user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const friends = await Friend.find({
            $or: [
                { requester: req.user._id, status: 'accepted' },
                { recipient: req.user._id, status: 'accepted' }
            ]
        }).populate('requester', 'name email')
            .populate('recipient', 'name email');

        res.json(friends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/friends/requests
// @desc    Get pending friend requests
// @access  Private
router.get('/requests', async (req, res) => {
    try {
        const requests = await Friend.find({
            recipient: req.user._id,
            status: 'pending'
        }).populate('requester', 'name email');

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/friends/my-code
// @desc    Get current user's invite code
// @access  Private
router.get('/my-code', async (req, res) => {
    try {
        let user = await User.findById(req.user._id).select('inviteCode');

        if (!user.inviteCode) {
            user.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            await user.save();
        }

        res.json({ inviteCode: user.inviteCode });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/friends/request
// @desc    Send friend request
// @access  Private
router.post('/request', [
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('inviteCode').optional().isString().withMessage('Invalid invite code')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, inviteCode } = req.body;

        if (!email && !inviteCode) {
            return res.status(400).json({ message: 'Please provide either an email or an invite code' });
        }

        // Find recipient user
        let recipient;
        if (email) {
            recipient = await User.findOne({ email });
        } else if (inviteCode) {
            recipient = await User.findOne({ inviteCode: inviteCode.toUpperCase() });
        }

        if (!recipient) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (recipient._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot add yourself as friend' });
        }

        // Check if friendship already exists
        const existingFriend = await Friend.findOne({
            $or: [
                { requester: req.user._id, recipient: recipient._id },
                { requester: recipient._id, recipient: req.user._id }
            ]
        });

        if (existingFriend) {
            return res.status(400).json({ message: 'Friendship or request already exists' });
        }

        const friendRequest = await Friend.create({
            requester: req.user._id,
            recipient: recipient._id
        });

        res.status(201).json(friendRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/friends/:id/accept
// @desc    Accept friend request
// @access  Private
router.put('/:id/accept', async (req, res) => {
    try {
        const friendRequest = await Friend.findById(req.params.id);

        if (!friendRequest) {
            return res.status(404).json({ message: 'Friend request not found' });
        }

        if (friendRequest.recipient.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        friendRequest.status = 'accepted';
        await friendRequest.save();

        res.json(friendRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/friends/:id
// @desc    Reject/remove friend
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const friendRequest = await Friend.findById(req.params.id);

        if (!friendRequest) {
            return res.status(404).json({ message: 'Friend request not found' });
        }

        const isInvolved = friendRequest.requester.toString() === req.user._id.toString() ||
            friendRequest.recipient.toString() === req.user._id.toString();

        if (!isInvolved) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await friendRequest.deleteOne();
        res.json({ message: 'Friend removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
