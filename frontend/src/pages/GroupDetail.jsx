import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import '../styles/Dashboard.css'; // Reuse dashboard styles
import '../styles/Groups.css';

const getGroupIcon = (type) => {
    const icons = {
        Trip: '✈️',
        Household: '🏠',
        Event: '🎉',
        Couple: '💑',
        Other: '👥'
    };
    return icons[type] || '👥';
};

const GroupDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [settleData, setSettleData] = useState({ payee: '', amount: '' });

    const currentUserId = user?._id || user?.id;

    useEffect(() => {
        fetchGroupData();
    }, [id]);

    const fetchGroupData = async () => {
        try {
            setLoading(true);
            const [groupRes, expensesRes, settlementsRes] = await Promise.all([
                api.get(`/groups/${id}`),
                api.get(`/group-expenses/group/${id}`),
                api.get(`/settlements/group/${id}`)
            ]);
            setGroup(groupRes.data);
            setExpenses(expensesRes.data || []);
            setSettlements(settlementsRes.data || []);
        } catch (error) {
            console.error('Error fetching group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (formData) => {
        try {
            await api.post('/group-expenses', { ...formData, group: id });
            setShowForm(false);
            fetchGroupData();
        } catch (error) {
            console.error('Error adding expense:', error);
            alert(error.response?.data?.message || 'Failed to add expense');
        }
    };

    const handleAddMember = async (email) => {
        try {
            await api.post(`/groups/${id}/members`, { email, name: email.split('@')[0] });
            fetchGroupData();
        } catch (error) {
            console.error('Error adding member:', error);
        }
    };

    const handleSettleUp = async (e) => {
        e.preventDefault();
        try {
            await api.post('/settlements', {
                group: id,
                payee: settleData.payee,
                amount: settleData.amount
            });
            setShowSettleModal(false);
            setSettleData({ payee: '', amount: '' });
            fetchGroupData();
        } catch (error) {
            console.error('Error settling up:', error);
            alert('Failed to settle up');
        }
    };

    const calculateGroupBalances = () => {
        try {
            if (!group || !group.members) return {};
            const balances = {};

            group.members.forEach(m => {
                if (!m) return;
                const mId = m.user?._id || m.user;
                if (mId) balances[mId] = 0;
            });

            if (Array.isArray(expenses)) {
                expenses.forEach(exp => {
                    if (!exp) return;
                    const payerId = exp.paidBy?._id || exp.paidBy;
                    const amount = parseFloat(exp.amount) || 0;

                    if (payerId && balances[payerId] !== undefined) {
                        balances[payerId] += amount;
                    }

                    exp.splits?.forEach(split => {
                        if (!split) return;
                        const memberId = split.user?._id || split.user;
                        const splitAmount = parseFloat(split.amount) || 0;
                        if (memberId && balances[memberId] !== undefined) {
                            balances[memberId] -= splitAmount;
                        }
                    });
                });
            }

            if (Array.isArray(settlements)) {
                settlements.forEach(settle => {
                    if (!settle) return;
                    const payerId = settle.payer?._id || settle.payer;
                    const payeeId = settle.payee?._id || settle.payee;
                    const amount = parseFloat(settle.amount) || 0;

                    if (payerId && balances[payerId] !== undefined) balances[payerId] += amount;
                    if (payeeId && balances[payeeId] !== undefined) balances[payeeId] -= amount;
                });
            }

            return balances;
        } catch (error) {
            console.error('Error calculating balances:', error);
            return {};
        }
    };

    const groupBalances = calculateGroupBalances();

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '80vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }
    if (!group) return <div className="container mt-lg text-center"><h3>Group not found</h3></div>;

    return (
        <div className="dashboard-container">
            <div className="group-header-section" style={{ marginBottom: '2rem' }}>
                <button onClick={() => navigate('/groups')} className="btn btn-secondary mb-md">
                    ← Back to Groups
                </button>
                <div className="group-title-card card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="group-icon-wrapper" style={{ fontSize: '2.5rem' }}>
                            {getGroupIcon(group.type)}
                        </div>
                        <div>
                            <h1 className="group-name" style={{ margin: 0 }}>{group.name}</h1>
                            <p className="text-secondary" style={{ margin: 0 }}>{group.type} • {group.members?.length} members</p>
                        </div>
                    </div>
                    <div className="member-avatars">
                        <div className="avatar-stack">
                            {group.members?.slice(0, 5).map((m, i) => (
                                <div key={i} className="avatar" title={m.name || 'User'}>
                                    {(m.name || '?')[0].toUpperCase()}
                                </div>
                            ))}
                            {group.members?.length > 5 && (
                                <div className="avatar">+{group.members.length - 5}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-actions">
                <h2>Group Overview</h2>
                <div className="action-buttons">
                    <button onClick={() => setShowForm(true)} className="btn btn-primary">
                        + Add Expense
                    </button>
                    <button onClick={() => setShowSettleModal(true)} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
                        🤝 Settle Up
                    </button>
                </div>
            </div>

            <div className="group-stats-grid grid grid-3 mb-xl">
                {group.members?.map(member => {
                    const mId = member.user?._id || member.user;
                    const bal = groupBalances[mId] || 0;
                    return (
                        <div key={mId || Math.random()} className="card text-center">
                            <h3 className="stat-label" style={{ marginBottom: '0.5rem' }}>
                                {mId === currentUserId ? 'You' : (member.name || 'Unknown')}
                            </h3>
                            <p className={`amount ${bal >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '1.5rem' }}>
                                {bal >= 0 ? '+' : '-'}${Math.abs(bal).toFixed(2)}
                            </p>
                            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                {bal >= 0 ? (bal === 0 ? 'Settled' : 'is owed') : 'owes'}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="section-header">
                <h2>Expenses</h2>
            </div>
            <div className="expenses-list-container">
                <ExpenseList
                    expenses={expenses}
                    onEdit={() => { }}
                    onDelete={() => { }}
                />
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Group Expense</h2>
                            <button onClick={() => setShowForm(false)} className="close-btn">×</button>
                        </div>
                        <ExpenseForm
                            onSubmit={handleAddExpense}
                            onCancel={() => setShowForm(false)}
                            groupMembers={group.members}
                            defaultType="splitwise"
                        />
                    </div>
                </div>
            )}

            {showSettleModal && (
                <div className="modal-overlay" onClick={() => setShowSettleModal(false)}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Settle Up</h2>
                            <button onClick={() => setShowSettleModal(false)} className="close-btn">×</button>
                        </div>
                        <form onSubmit={handleSettleUp}>
                            <div className="form-group">
                                <label className="form-label">Who did you pay?</label>
                                <select
                                    className="form-select"
                                    value={settleData.payee}
                                    onChange={e => setSettleData({ ...settleData, payee: e.target.value })}
                                    required
                                >
                                    <option value="">Select a member</option>
                                    {group.members?.filter(m => (m.user?._id || m.user) !== currentUserId).map(m => (
                                        <option key={(m.user?._id || m.user) || Math.random()} value={m.user?._id || m.user}>
                                            {m.name || 'Unknown Member'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settleData.amount}
                                    onChange={e => setSettleData({ ...settleData, amount: e.target.value })}
                                    placeholder="0.00"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Settlement</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDetail;

