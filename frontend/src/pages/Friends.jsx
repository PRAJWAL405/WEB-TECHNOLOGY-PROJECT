import { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/Dashboard.css'; // Reuse dashboard styles

const Friends = () => {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addMethod, setAddMethod] = useState('email'); // 'email' or 'code'
    const [newFriendEmail, setNewFriendEmail] = useState('');
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const [userInviteCode, setUserInviteCode] = useState('');
    const [message, setMessage] = useState('');

    const user = JSON.parse(localStorage.getItem('user'));
    const currentUserId = user?._id || user?.id;

    useEffect(() => {
        fetchFriends();
    }, []);

    const fetchFriends = async () => {
        try {
            const [friendsRes, requestsRes, codeRes] = await Promise.all([
                api.get('/friends'),
                api.get('/friends/requests'),
                api.get('/friends/my-code')
            ]);
            setFriends(friendsRes.data);
            setRequests(requestsRes.data);
            setUserInviteCode(codeRes.data.inviteCode);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching friends:', error);
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'accept') {
                await api.put(`/friends/${id}/accept`);
                setMessage('Friend request accepted');
            } else if (action === 'delete') {
                await api.delete(`/friends/${id}`);
                setMessage('Friend removed');
            }
            fetchFriends();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error(error);
            alert('Action failed');
        }
    };

    const handleAddFriend = async (e) => {
        e.preventDefault();
        try {
            const payload = addMethod === 'email'
                ? { email: newFriendEmail }
                : { inviteCode: inviteCodeInput };

            await api.post('/friends/request', payload);
            setMessage(`Friend request sent successfully!`);
            setNewFriendEmail('');
            setInviteCodeInput('');
            setTimeout(() => setMessage(''), 3000);
            setShowAddModal(false);
            fetchFriends();
        } catch (error) {
            console.error(error);
            setMessage(error.response?.data?.message || 'Failed to send request');
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/invite/${userInviteCode}`;
        navigator.clipboard.writeText(link);
        setMessage('Invite link copied to clipboard!');
        setTimeout(() => setMessage(''), 3000);
    };

    if (loading) return <div className="loading-spinner">Loading friends...</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
                <h1>Friends</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={copyInviteLink} className="btn btn-secondary">
                        🔗 Copy Invite Link
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                        + Add Friend
                    </button>
                </div>
            </div>

            <div className="card mb-xl" style={{ border: '1px dashed var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div className="flex-between" style={{ padding: '1rem' }}>
                    <div>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Your Unique Invite Code</p>
                        <h3 style={{ margin: '0.25rem 0 0 0', letterSpacing: '2px', color: 'var(--primary-color)' }}>{userInviteCode}</h3>
                    </div>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(userInviteCode);
                            setMessage('Code copied!');
                            setTimeout(() => setMessage(''), 2000);
                        }}
                        className="btn btn-secondary btn-small"
                    >
                        Copy Code
                    </button>
                </div>
            </div>

            {message && <div className="alert alert-info">{message}</div>}

            {requests.length > 0 && (
                <div className="requests-section" style={{ marginBottom: '2rem' }}>
                    <h2>Pending Requests</h2>
                    <div className="card">
                        {requests.map(req => (
                            <div key={req._id} className="friend-item-row" style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="category-icon-bg" style={{ background: '#fff9e6' }}>🔔</div>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{req.requester?.name}</h4>
                                        <p className="text-secondary" style={{ fontSize: '0.8rem', margin: 0 }}>{req.requester?.email}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleAction(req._id, 'accept')} className="btn btn-primary btn-small">Accept</button>
                                    <button onClick={() => handleAction(req._id, 'delete')} className="btn btn-secondary btn-small">Ignore</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <h2>My Friends</h2>
            <div className="card">
                {friends.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👋</div>
                        <h3>No friends yet</h3>
                        <p className="text-secondary">Add friends to start splitting bills!</p>
                    </div>
                ) : (
                    <div className="grid">
                        {friends.map(friend => {
                            const isRequester = (friend.requester?._id || friend.requester) === currentUserId;
                            const friendData = isRequester ? friend.recipient : friend.requester;

                            return (
                                <div key={friend._id} className="friend-item-row" style={{ padding: '1.2rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="category-icon-bg" style={{ background: '#eef2ff' }}>👤</div>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{friendData?.name || 'Unknown User'}</h4>
                                            <p className="text-secondary" style={{ fontSize: '0.8rem', margin: 0 }}>{friendData?.email}</p>
                                        </div>
                                    </div>
                                    <div className="balances" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        {friend.balance !== 0 ? (
                                            <div style={{ textAlign: 'right' }}>
                                                <p className="label" style={{ margin: 0, textTransform: 'lowercase', fontSize: '0.75rem' }}>
                                                    {friend.balance > 0 ? (isRequester ? 'owes you' : 'you owe') : (isRequester ? 'you owe' : 'owes you')}
                                                </p>
                                                <p className={`amount ${((friend.balance > 0 && isRequester) || (friend.balance < 0 && !isRequester)) ? 'positive' : 'negative'}`} style={{ margin: 0, fontWeight: '600' }}>
                                                    ${Math.abs(friend.balance).toFixed(2)}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Settled up</span>
                                        )}
                                        <button onClick={() => handleAction(friend._id, 'delete')} className="action-btn delete-btn" title="Remove Friend" style={{ fontSize: '1.2rem' }}>×</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content card" style={{ maxWidth: '450px', width: '90%', padding: '0' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ padding: '1.5rem 1.5rem 1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ margin: 0 }}>Add a Friend</h2>
                            <button onClick={() => setShowAddModal(false)} className="close-btn" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <button
                                className={`btn-tab ${addMethod === 'email' ? 'active' : ''}`}
                                onClick={() => setAddMethod('email')}
                                style={{ flex: 1, padding: '0.5rem', border: 'none', background: addMethod === 'email' ? 'var(--primary-light)' : 'transparent', borderRadius: 'var(--radius-md)', color: addMethod === 'email' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}
                            >
                                By Email
                            </button>
                            <button
                                className={`btn-tab ${addMethod === 'code' ? 'active' : ''}`}
                                onClick={() => setAddMethod('code')}
                                style={{ flex: 1, padding: '0.5rem', border: 'none', background: addMethod === 'code' ? 'var(--primary-light)' : 'transparent', borderRadius: 'var(--radius-md)', color: addMethod === 'code' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}
                            >
                                By Code
                            </button>
                        </div>

                        <form onSubmit={handleAddFriend} style={{ padding: '1.5rem' }}>
                            {addMethod === 'email' ? (
                                <div className="form-group">
                                    <label className="form-label">Friend's Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={newFriendEmail}
                                        onChange={(e) => setNewFriendEmail(e.target.value)}
                                        placeholder="Enter email address"
                                        required
                                    />
                                    <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>We'll send a friend request to this email.</p>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">Invite Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={inviteCodeInput}
                                        onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                                        placeholder="ENTER-CODE"
                                        required
                                        style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}
                                    />
                                    <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Enter the 6-character code your friend shared with you.</p>
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                {addMethod === 'email' ? 'Send Invite' : 'Add Friend'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Friends;
