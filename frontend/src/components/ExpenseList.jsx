import { format } from 'date-fns';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/ExpenseList.css';
import '../styles/SplitExpense.css';

const ExpenseList = ({ expenses, onEdit, onDelete }) => {
    const { user } = useContext(AuthContext);
    const currentUserId = user?._id || user?.id;

    if (expenses.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No expenses yet</h3>
                <p className="text-secondary">Add an expense to get started</p>
            </div>
        );
    }

    return (
        <div className="expense-list">
            {expenses.map((expense) => {
                if (!expense) return null;
                let date;
                try {
                    date = expense.date ? new Date(expense.date) : new Date();
                    if (isNaN(date.getTime())) date = new Date();
                } catch (e) {
                    date = new Date();
                }

                return (
                    <div key={expense._id || Math.random()} className="expense-item-row">
                        <div className="expense-date-col">
                            <span className="month">{format(date, 'MMM').toUpperCase()}</span>
                            <span className="day">{format(date, 'dd')}</span>
                        </div>

                        <div className="expense-icon-col">
                            <div className={`category-icon-bg category-${(expense.category || 'Other').toLowerCase()}`}>
                                {getCategoryIcon(expense.category || 'Other')}
                            </div>
                        </div>

                        <div className="expense-info-col">
                            <h4 className="expense-title">{expense.title || expense.description}</h4>
                            {expense.group && <span className="group-tag">Group Expense</span>}
                        </div>

                        <div className="expense-amount-col">
                            {(() => {
                                const amount = parseFloat(expense.amount) || 0;
                                const numParticipants = (expense.numberOfPeople || expense.splits?.length || 1);
                                const perPerson = (expense.isSplit || expense.group) ? (amount / numParticipants) : 0;

                                const isPayer = expense.paidBy === currentUserId ||
                                    expense.paidBy?._id === currentUserId ||
                                    expense.user === currentUserId ||
                                    expense.user?._id === currentUserId;

                                if (isPayer) {
                                    return (
                                        <>
                                            <div className="payer-info">
                                                <span className="label">you paid</span>
                                                <span className="amount">₹{(amount).toFixed(2)}</span>
                                            </div>
                                            {(expense.isSplit || expense.group) && (
                                                <div className="lending-info">
                                                    <span className="label">you lent</span>
                                                    <span className="amount positive">
                                                        ₹{(amount - perPerson).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    );
                                } else {
                                    const mySplit = expense.splits?.find(s => {
                                        const sId = s.user?._id || s.user;
                                        return sId === currentUserId;
                                    });
                                    const myOwe = mySplit ? (mySplit.owed || mySplit.amount) : perPerson;
                                    const safeMyOwe = parseFloat(myOwe) || 0;

                                    return (
                                        <>
                                            <div className="payer-info">
                                                <span className="label">{expense.paidBy?.name || 'Someone'} paid</span>
                                                <span className="amount">₹{(amount).toFixed(2)}</span>
                                            </div>
                                            <div className="lending-info">
                                                <span className="label">you borrowed</span>
                                                <span className="amount negative">
                                                    ₹{safeMyOwe.toFixed(2)}
                                                </span>
                                            </div>
                                        </>
                                    );
                                }
                            })()}
                        </div>

                        <div className="expense-actions-col">
                            <button
                                onClick={() => onEdit(expense)}
                                className="action-btn edit-btn"
                                title="Edit"
                            >
                                ✎
                            </button>
                            <button
                                onClick={() => onDelete(expense._id)}
                                className="action-btn delete-btn"
                                title="Delete"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Helper to get icon based on category
const getCategoryIcon = (category) => {
    const icons = {
        Food: '🍔',
        Transport: '🚗',
        Entertainment: '🎬',
        Shopping: '🛍️',
        Bills: '📄',
        Healthcare: '⚕️',
        Education: '🎓',
        Other: '🏷️'
    };
    return icons[category] || '🏷️';
};

export default ExpenseList;
