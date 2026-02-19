import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Groups.css';

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroup, setNewGroup] = useState({
        name: '',
        description: '',
        type: 'Other',
        members: []
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [groupsRes, friendsRes] = await Promise.all([
                api.get('/groups'),
                api.get('/friends')
            ]);
            setGroups(groupsRes.data);
            setFriends(friendsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            let currentUserId = null;
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                currentUserId = user?._id || user?.id;
            } catch (err) { }

            await api.post('/groups', newGroup);
            setNewGroup({ name: '', description: '', type: 'Other', members: [] });
            setShowCreateModal(false);
            fetchData();
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    const toggleMember = (friend) => {
        let currentUserId = null;
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            currentUserId = user?._id || user?.id;
        } catch (err) { }

        const isRequester = friend?.requester?._id === currentUserId;
        const friendData = isRequester ? friend?.recipient : friend?.requester;

        if (!friendData?._id) return;

        const exists = newGroup.members?.find(m => m.user === friendData._id);
        if (exists) {
            setNewGroup({
                ...newGroup,
                members: newGroup.members.filter(m => m.user !== friendData._id)
            });
        } else {
            setNewGroup({
                ...newGroup,
                members: [...newGroup.members, {
                    user: friendData._id,
                    name: friendData.name,
                    email: friendData.email
                }]
            });
        }
    };

    const groupTypes = ['Trip', 'Household', 'Event', 'Couple', 'Other'];

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="groups-page">
            <div className="page-header">
                <h1>My Groups</h1>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                    + Create Group
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>No groups yet</h3>
                    <p className="text-secondary">Create a group to start splitting expenses with friends</p>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        Create Your First Group
                    </button>
                </div>
            ) : (
                <div className="groups-grid">
                    {groups.map((group) => (
                        <div
                            key={group._id}
                            className="group-card card"
                            onClick={() => navigate(`/groups/${group._id}`)}
                        >
                            <div className="group-header">
                                <div className="group-icon">{getGroupIcon(group.type)}</div>
                                <span className="group-type-badge">{group.type}</span>
                            </div>
                            <h3 className="group-name">{group.name}</h3>
                            {group.description && (
                                <p className="group-description text-secondary">{group.description}</p>
                            )}
                            <div className="group-stats">
                                <div className="stat">
                                    <span className="stat-value">{group.members?.length || 0}</span>
                                    <span className="stat-label">Members</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">${group.totalExpenses?.toFixed(2) || '0.00'}</span>
                                    <span className="stat-label">Total</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Group</h2>
                            <button onClick={() => setShowCreateModal(false)} className="modal-close">×</button>
                        </div>
                        <form onSubmit={handleCreateGroup} className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Group Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    placeholder="e.g., Vegas Trip 2024"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select
                                    className="form-select"
                                    value={newGroup.type}
                                    onChange={(e) => setNewGroup({ ...newGroup, type: e.target.value })}
                                >
                                    {groupTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Invite Friends</label>
                                <div className="friend-selection-list" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '0.5rem' }}>
                                    {friends.length === 0 ? (
                                        <p style={{ fontSize: '0.8rem', color: '#888' }}>No friends found. Add friends first!</p>
                                    ) : (
                                        friends.map(friend => {
                                            const isRequester = friend.requester?._id === JSON.parse(localStorage.getItem('user'))?._id;
                                            const friendData = isRequester ? friend.recipient : friend.requester;
                                            const isChecked = newGroup.members.some(m => m.user === friendData._id);

                                            return (
                                                <div key={friend._id} className="member-select-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleMember(friend)}
                                                        id={`friend-${friend._id}`}
                                                    />
                                                    <label htmlFor={`friend-${friend._id}`} style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                                        {friendData.name}
                                                    </label>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Group</button>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

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

export default Groups;
