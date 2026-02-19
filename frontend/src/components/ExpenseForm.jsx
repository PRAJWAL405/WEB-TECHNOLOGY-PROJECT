import { useState } from 'react';
import '../styles/SplitExpense.css';

const ExpenseForm = ({ onSubmit, initialData = null, onCancel, defaultType = 'personal', groupMembers = [] }) => {
    const defaultSplit = defaultType === 'splitwise' || groupMembers.length > 0;

    let currentUserId = null;
    try {
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            currentUserId = user?._id || user?.id;
        }
    } catch (e) {
        console.error('Failed to parse user data');
    }

    const [formData, setFormData] = useState(initialData || {
        title: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        description: '',
        isSplit: defaultSplit,
        numberOfPeople: groupMembers.length > 0 ? groupMembers.length : (defaultSplit ? 2 : 1),
        splitWith: groupMembers.length > 0 ? groupMembers.filter(m => (m.user?._id || m.user) !== currentUserId).map(m => m.name) : [],
        paidBy: currentUserId,
        splits: groupMembers.length > 0 ? groupMembers.filter(m => m).map(m => ({
            user: m.user?._id || m.user,
            name: m.name || 'Member',
            amount: 0
        })) : []
    });

    const [participantInput, setParticipantInput] = useState('');

    const categories = [
        'Food',
        'Transport',
        'Entertainment',
        'Shopping',
        'Bills',
        'Healthcare',
        'Education',
        'Other'
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSplitToggle = (e) => {
        const isSplit = e.target.checked;
        setFormData({
            ...formData,
            isSplit,
            numberOfPeople: isSplit ? 2 : 1,
            splitWith: isSplit ? [] : []
        });
    };

    const addParticipant = () => {
        if (participantInput.trim() && !formData.splitWith.includes(participantInput.trim())) {
            setFormData({
                ...formData,
                splitWith: [...formData.splitWith, participantInput.trim()],
                numberOfPeople: formData.splitWith.length + 2
            });
            setParticipantInput('');
        }
    };

    const removeParticipant = (index) => {
        const newSplitWith = formData.splitWith.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            splitWith: newSplitWith,
            numberOfPeople: newSplitWith.length + 1
        });
    };

    const calculatePerPerson = () => {
        const amt = parseFloat(formData.amount);
        if (isNaN(amt)) return '0.00';

        if ((formData.isSplit || groupMembers.length > 0)) {
            const count = groupMembers.length > 0 ? groupMembers.length : formData.numberOfPeople;
            if (count > 0) return (amt / count).toFixed(2);
        }
        return amt.toFixed(2);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Ensure title and amount are present
        if (!formData.title.trim()) return alert('Title is required');
        if (!formData.amount || parseFloat(formData.amount) <= 0) return alert('Please enter a valid amount');

        // Format splits for group expense if needed
        let submissionData = {
            ...formData,
            amount: parseFloat(formData.amount)
        };

        if (groupMembers.length > 0) {
            const perPerson = parseFloat(calculatePerPerson());
            submissionData.splits = groupMembers.filter(m => m).map(m => ({
                user: m.user?._id || m.user,
                amount: perPerson,
                owed: (m.user?._id || m.user) === formData.paidBy ? 0 : perPerson
            }));
            submissionData.description = formData.title; // Group expenses use description as title
        }

        onSubmit(submissionData);
    };

    return (
        <form onSubmit={handleSubmit} className="expense-form">
            <div className="form-group">
                <label htmlFor="title" className="form-label">Title</label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-input"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Grocery shopping"
                />
            </div>

            <div className="grid grid-2">
                <div className="form-group">
                    <label htmlFor="amount" className="form-label">Amount</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        className="form-input"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="paidBy" className="form-label">Paid By</label>
                    <select
                        id="paidBy"
                        name="paidBy"
                        className="form-select"
                        value={formData.paidBy}
                        onChange={handleChange}
                    >
                        <option value={currentUserId}>You</option>
                        {groupMembers.filter(m => (m.user?._id || m.user) !== currentUserId).map(m => (
                            <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="category" className="form-label">Category</label>
                <select
                    id="category"
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleChange}
                    required
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="date" className="form-label">Date</label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    className="form-input"
                    value={formData.date}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="description" className="form-label">Description (Optional)</label>
                <textarea
                    id="description"
                    name="description"
                    className="form-textarea"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add any notes..."
                />
            </div>

            {/* Only show toggle if NOT in default splitwise mode, or if we want to allow toggling off */}
            {!defaultSplit && groupMembers.length === 0 && (
                <div className="form-group">
                    <div className="split-toggle">
                        <input
                            type="checkbox"
                            id="isSplit"
                            name="isSplit"
                            checked={formData.isSplit}
                            onChange={handleSplitToggle}
                        />
                        <label htmlFor="isSplit" className="split-label">
                            💰 Split this expense
                        </label>
                    </div>
                </div>
            )}

            {(formData.isSplit || groupMembers.length > 0) && (
                <div className="split-section">
                    {groupMembers.length === 0 ? (
                        <>
                            <div className="form-group">
                                <label className="form-label">
                                    {defaultSplit ? 'With you and:' : 'Add Participants'}
                                </label>
                                <div className="participant-input-group">
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={participantInput}
                                        onChange={(e) => setParticipantInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                                        placeholder="Enter name or email"
                                    />
                                    <button
                                        type="button"
                                        onClick={addParticipant}
                                        className="btn btn-secondary btn-small"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {formData.splitWith.length > 0 && (
                                <div className="participants-list">
                                    <p className="form-label">
                                        {defaultSplit ? 'Splitting with:' : 'Participants:'}
                                        ({formData.numberOfPeople} people)
                                    </p>
                                    <div className="participant-chips">
                                        <span className="participant-chip you-chip">You</span>
                                        {formData.splitWith.map((person, index) => (
                                            <span key={index} className="participant-chip">
                                                {person}
                                                <button
                                                    type="button"
                                                    onClick={() => removeParticipant(index)}
                                                    className="remove-participant"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="participants-list">
                            <p className="form-label">Splitting with all members of <strong>{groupMembers.length}</strong> people</p>
                            <div className="participant-chips">
                                {groupMembers.map((m, i) => (
                                    <span key={i} className={`participant-chip ${(m.user?._id || m.user) === currentUserId ? 'you-chip' : ''}`}>
                                        {(m.user?._id || m.user) === currentUserId ? 'You' : m.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.amount && (
                        <div className="split-summary">
                            <div className="split-amount-display">
                                <span className="split-label-text">Amount per person:</span>
                                <span className="split-amount">${calculatePerPerson()}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                    {initialData ? 'Update Expense' : 'Add Expense'}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="btn btn-secondary">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default ExpenseForm;
