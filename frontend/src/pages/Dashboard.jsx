import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [friends, setFriends] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('splitwise'); // 'personal' or 'splitwise'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [personalRes, groupsRes, friendsRes, settlementsRes] = await Promise.all([
                api.get('/personal-expenses').catch(err => ({ data: [] })),
                api.get('/group-expenses').catch(err => ({ data: [] })),
                api.get('/friends').catch(err => ({ data: [] })),
                api.get('/settlements/user').catch(err => ({ data: [] }))
            ]);

            const personalExpenses = Array.isArray(personalRes.data) ? personalRes.data : [];
            const groupExpenses = Array.isArray(groupsRes.data) ? groupsRes.data : [];

            setExpenses([...personalExpenses, ...groupExpenses]);
            setFriends(Array.isArray(friendsRes.data) ? friendsRes.data : []);
            setSettlements(Array.isArray(settlementsRes.data) ? settlementsRes.data : []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter expenses based on active tab
    const getFilteredExpenses = () => {
        if (activeTab === 'personal') {
            return expenses.filter(exp => !exp.isSplit && !exp.group);
        }
        return expenses.filter(exp => exp.isSplit || exp.group);
    };

    const filteredExpenses = getFilteredExpenses();

    const calculateBalances = () => {
        // Splitwise calculations
        if (activeTab === 'splitwise') {
            let totalOwed = 0;
            let totalOwe = 0;
            const currentUserId = user?._id || user?.id;

            filteredExpenses.forEach(exp => {
                const amount = parseFloat(exp.amount) || 0;
                // Handle Ad-hoc splits (from personal-expenses)
                if (exp.isSplit) {
                    const count = parseInt(exp.numberOfPeople) || 1;
                    const myShare = amount / count;
                    const othersOwe = amount - myShare;
                    totalOwed += othersOwe;
                }
                // Handle Group expenses (from group-expenses)
                else if (exp.group) {
                    const isPayer = exp.paidBy && (typeof exp.paidBy === 'string' ? exp.paidBy === currentUserId : exp.paidBy._id === currentUserId);

                    if (isPayer) {
                        const mySplit = exp.splits?.find(s => (s.user?._id || s.user) === currentUserId);
                        const splitCount = exp.splits?.length || 1;
                        const myShare = mySplit ? (parseFloat(mySplit.amount) || 0) : (amount / splitCount);
                        totalOwed += (amount - myShare);
                    } else {
                        const mySplit = exp.splits?.find(s => (s.user?._id || s.user) === currentUserId);
                        if (mySplit) totalOwe += (parseFloat(mySplit.owed || mySplit.amount) || 0);
                    }
                }
            });

            // Adjust for settlements
            settlements.forEach(settle => {
                if (!settle) return;
                const payerId = settle.payer?._id || settle.payer;
                const payeeId = settle.payee?._id || settle.payee;
                const amount = parseFloat(settle.amount) || 0;

                const isPayer = payerId === currentUserId;
                const isPayee = payeeId === currentUserId;

                if (isPayer) {
                    totalOwe -= amount;
                } else if (isPayee) {
                    totalOwed -= amount;
                }
            });

            return {
                totalOwed: Math.max(0, totalOwed),
                totalOwe: Math.max(0, totalOwe),
                balance: totalOwed - totalOwe
            };
        }

        // Personal calculations
        else {
            const totalSpent = filteredExpenses.reduce((sum, exp) => {
                const amt = parseFloat(exp.amount);
                return sum + (isNaN(amt) ? 0 : amt);
            }, 0);
            return { totalSpent };
        }
    };

    const stats = calculateBalances();

    const handleCreateExpense = async (formData) => {
        try {
            // Ensure amount is a number for the backend
            const preparedData = {
                ...formData,
                amount: parseFloat(formData.amount)
            };

            const endpoint = '/personal-expenses';
            await api.post(endpoint, preparedData);

            setShowForm(false);
            await fetchData();
        } catch (error) {
            console.error('Error creating expense:', error);
            const msg = error.response?.data?.message ||
                (error.response?.data?.errors?.[0]?.msg) ||
                'Failed to add expense';
            alert(msg);
        }
    };

    const handleUpdateExpense = async (formData) => {
        try {
            const endpoint = editingExpense.group ? `/group-expenses/${editingExpense._id}` : `/personal-expenses/${editingExpense._id}`;
            await api.put(endpoint, formData);
            setEditingExpense(null);
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Error updating expense:', error);
            alert('Failed to update expense');
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            const expenseToDelete = expenses.find(e => e._id === id);
            const endpoint = expenseToDelete.group ? `/group-expenses/${id}` : `/personal-expenses/${id}`;
            await api.delete(endpoint);
            fetchData();
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Failed to delete expense');
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="dashboard-container">
            {/* Tab Navigation */}
            <div className="dashboard-tabs">
                <button
                    className={`tab-btn ${activeTab === 'splitwise' ? 'active' : ''}`}
                    onClick={() => setActiveTab('splitwise')}
                >
                    Splitwise
                </button>
                <button
                    className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    Personal
                </button>
            </div>

            <div className="dashboard-header-section">
                {activeTab === 'splitwise' ? (
                    <>
                        <div className="balance-card total-balance">
                            <h3>Total Balance</h3>
                            <p className={stats.balance >= 0 ? 'positive' : 'negative'}>
                                {stats.balance >= 0 ? '+' : '-'}${Math.abs(stats.balance).toFixed(2)}
                            </p>
                        </div>
                        <div className="balance-card you-owe">
                            <h3>you owe</h3>
                            <p>${stats.totalOwe.toFixed(2)}</p>
                        </div>
                        <div className="balance-card you-are-owed">
                            <h3>you are owed</h3>
                            <p>${stats.totalOwed.toFixed(2)}</p>
                        </div>
                    </>
                ) : (
                    <div className="balance-card personal-spend">
                        <h3>Total Spending</h3>
                        <p className="negative">
                            ${stats.totalSpent.toFixed(2)}
                        </p>
                    </div>
                )}
            </div>

            <div className="dashboard-actions">
                <h2>{activeTab === 'splitwise' ? 'Group Activity' : 'Personal Expenses'}</h2>
                <button onClick={() => { setEditingExpense(null); setShowForm(true); }} className="btn btn-primary add-expense-btn">
                    Add {activeTab} expense
                </button>
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingExpense ? 'Edit expense' : 'Add an expense'}</h2>
                            <button onClick={() => setShowForm(false)} className="close-btn">×</button>
                        </div>
                        <ExpenseForm
                            onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}
                            initialData={editingExpense}
                            onCancel={() => setShowForm(false)}
                            defaultType={activeTab} // Pass tab to form to default to personal/split
                        />
                    </div>
                </div>
            )}

            <div className="expenses-list-container">
                <ExpenseList
                    expenses={filteredExpenses}
                    onEdit={(exp) => { setEditingExpense(exp); setShowForm(true); }}
                    onDelete={handleDeleteExpense}
                />
            </div>
        </div>
    );
};

export default Dashboard;
