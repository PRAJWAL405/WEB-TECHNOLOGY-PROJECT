import express from 'express';
import { body, validationResult } from 'express-validator';
import Group from '../models/Group.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/groups
// @desc    Get all groups for logged in user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const groups = await Group.find({
            $or: [
                { createdBy: req.user._id },
                { 'members.user': req.user._id }
            ],
            isActive: true
        }).sort({ updatedAt: -1 });

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/groups/:id
// @desc    Get single group
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is member
        const isMember = group.createdBy.toString() === req.user._id.toString() ||
            group.members.some(m => m.user && m.user.toString() === req.user._id.toString());

        if (!isMember) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/groups
// @desc    Create new group
// @access  Private
router.post('/', [
    body('name').trim().notEmpty().withMessage('Group name is required'),
    body('type').optional().isIn(['Trip', 'Household', 'Event', 'Couple', 'Other'])
], async (req, res) => {
    console.log('Group creation request body:', req.body);
    console.log('User ID:', req.user._id);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, description, type, members } = req.body;

        // Add creator as first member
        const groupMembers = [{
            user: req.user._id,
            name: req.user.name,
            email: req.user.email
        }];

        // Add additional members if provided
        if (members && Array.isArray(members)) {
            groupMembers.push(...members);
        }

        const group = await Group.create({
            name,
            description,
            type: type || 'Other',
            createdBy: req.user._id,
            members: groupMembers
        });

        console.log('Group created successfully:', group);
        res.status(201).json(group);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/groups/:id
// @desc    Update group
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Only creator can update group details
        if (group.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { name, description, type } = req.body;

        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        if (type) group.type = type;

        const updatedGroup = await group.save();
        res.json(updatedGroup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/groups/:id/members
// @desc    Add member to group
// @access  Private
router.post('/:id/members', [
    body('name').trim().notEmpty().withMessage('Member name is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const { name, email, userId } = req.body;

        group.members.push({
            user: userId || null,
            name,
            email: email || null
        });

        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/groups/:id/members/:memberId
// @desc    Remove member from group
// @access  Private
router.delete('/:id/members/:memberId', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        group.members = group.members.filter(
            m => m._id.toString() !== req.params.memberId
        );

        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/groups/:id
// @desc    Delete/deactivate group
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        group.isActive = false;
        await group.save();

        res.json({ message: 'Group deactivated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
