import mongoose from 'mongoose';

const groupExpenseSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Please provide an amount'],
        min: [0, 'Amount must be positive']
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    // Array of splits: who owes what
    splits: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: {
            type: Number,
            required: true
        },
        owed: { // The amount this person creates a debt for (usually amount - paid)
            type: Number,
            default: 0
        }
        // Could expand this later for unequal splits, shares, etc.
    }]
}, {
    timestamps: true
});

groupExpenseSchema.index({ group: 1, date: -1 });

const GroupExpense = mongoose.model('GroupExpense', groupExpenseSchema);

export default GroupExpense;
