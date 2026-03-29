import { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/Dashboard.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        totalSpent: 0,
        totalOwed: 0,
        totalOwe: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const [profileRes, personalRes, groupsRes, settlementsRes] = await Promise.all([
                api.get('/auth/profile'),
                api.get('/personal-expenses'),
                api.get('/group-expenses'),
                api.get('/settlements/user')
            ]);

            const profileUser = profileRes.data;
            setUser(profileUser);

            const personal = personalRes.data || [];
            const groupExp = groupsRes.data || [];
            const settlements = settlementsRes.data || [];
            const currentUserId = profileUser._id;

            let totalSpent = 0;
            let totalOwed = 0;
            let totalOwe = 0;

            // Personal and ad-hoc splits
            personal.forEach(exp => {
                const amount = parseFloat(exp.amount) || 0;
                totalSpent += amount;
                if (exp.isSplit) {
                    const count = parseInt(exp.numberOfPeople) || 1;
                    const myShare = amount / count;
                    totalOwed += (amount - myShare);
                }
            });

            // Group expenses
            groupExp.forEach(exp => {
                const amount = parseFloat(exp.amount) || 0;
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
            });

            // Settlements
            settlements.forEach(settle => {
                const payerId = settle.payer?._id || settle.payer;
                const payeeId = settle.payee?._id || settle.payee;
                const amount = parseFloat(settle.amount) || 0;

                if (payerId === currentUserId) totalOwe -= amount;
                else if (payeeId === currentUserId) totalOwed -= amount;
            });

            setStats({
                totalSpent,
                totalOwed: Math.max(0, totalOwed),
                totalOwe: Math.max(0, totalOwe)
            });

            setLoading(false);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner">Loading profile...</div>;
    if (!user) return <div className="container mt-lg text-center"><h3>User not found</h3></div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
                <h1>My Profile</h1>
            </div>

            <div className="grid grid-2">
                <div className="card profile-main-card">
                    <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="avatar-large" style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'var(--primary-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            color: 'white',
                            fontWeight: 'bold'
                        }}>
                            {user.name[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ margin: 0 }}>{user.name}</h2>
                            <p className="text-secondary" style={{ margin: 0 }}>{user.email}</p>
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="detail-item" style={{ marginBottom: '1.5rem' }}>
                            <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Invite Code</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <code style={{
                                    fontSize: '1.25rem',
                                    background: 'var(--bg-tertiary)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    letterSpacing: '2px',
                                    fontWeight: 'bold',
                                    color: 'var(--primary-color)'
                                }}>
                                    {user.inviteCode}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(user.inviteCode);
                                        alert('Code copied!');
                                    }}
                                    className="btn btn-secondary btn-small"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div className="detail-item">
                            <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Account Created</label>
                            <p style={{ margin: 0, fontWeight: '500' }}>
                                {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card profile-stats-card">
                    <h3>Activity Summary</h3>
                    <div className="stats-list" style={{ marginTop: '1.5rem' }}>
                        <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span className="text-secondary">Personal Spent</span>
                            <span style={{ fontWeight: '600' }}>₹{stats.totalSpent.toFixed(2)}</span>
                        </div>
                        <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span className="text-secondary">You Owe</span>
                            <span style={{ fontWeight: '600', color: 'var(--error)' }}>₹{stats.totalOwe.toFixed(2)}</span>
                        </div>
                        <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span className="text-secondary">You are Owed</span>
                            <span style={{ fontWeight: '600', color: 'var(--success)' }}>₹{stats.totalOwed.toFixed(2)}</span>
                        </div>
                        <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0' }}>
                            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Member since {new Date(user.createdAt).getFullYear()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p className="text-secondary">More profile settings coming soon!</p>
            </div>
        </div>
    );
};

export default Profile;
