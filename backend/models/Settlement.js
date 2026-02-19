import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    payer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    payee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Please provide an amount'],
        min: [0, 'Amount must be positive']
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

settlementSchema.index({ group: 1, date: -1 });

const Settlement = mongoose.model('Settlement', settlementSchema);

export default Settlement;
