import mongoose from 'mongoose';

const personalExpenseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    amount: {
        type: Number,
        required: [true, 'Please provide an amount'],
        min: [0, 'Amount cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other']
    },
    date: {
        type: Date,
        required: [true, 'Please provide a date'],
        default: Date.now
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    isSplit: {
        type: Boolean,
        default: false
    },
    numberOfPeople: {
        type: Number,
        default: 1
    },
    splitWith: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Index for faster queries
personalExpenseSchema.index({ user: 1, date: -1 });

const PersonalExpense = mongoose.model('PersonalExpense', personalExpenseSchema);

export default PersonalExpense;
