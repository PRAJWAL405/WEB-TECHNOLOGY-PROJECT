import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a group name'],
        trim: true,
        maxlength: [100, 'Group name cannot be more than 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    type: {
        type: String,
        enum: ['Trip', 'Household', 'Event', 'Couple', 'Other'],
        default: 'Other'
    },
    currency: {
        type: String,
        default: 'USD' // Could be INR based on user location later
    },
    simplifyDebts: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    totalExpenses: { // Caching total for display
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
groupSchema.index({ createdBy: 1 });
groupSchema.index({ 'members.user': 1 });

const Group = mongoose.model('Group', groupSchema);

export default Group;
