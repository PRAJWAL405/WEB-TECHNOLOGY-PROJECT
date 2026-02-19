import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const InviteHandler = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('joining'); // 'joining', 'success', 'error'
    const [error, setError] = useState('');

    useEffect(() => {
        const joinFriend = async () => {
            try {
                await api.post('/friends/request', { inviteCode: code });
                setStatus('success');
                setTimeout(() => {
                    navigate('/friends');
                }, 2000);
            } catch (err) {
                setStatus('error');
                setError(err.response?.data?.message || 'Failed to join via invite link');
                setTimeout(() => {
                    navigate('/friends');
                }, 3000);
            }
        };

        if (code) {
            joinFriend();
        } else {
            navigate('/friends');
        }
    }, [code, navigate]);

    return (
        <div className="flex-center" style={{ minHeight: '60vh' }}>
            <div className="card text-center" style={{ maxWidth: '400px', width: '90%' }}>
                {status === 'joining' && (
                    <>
                        <div className="spinner mb-md"></div>
                        <h3>Processing Invite...</h3>
                        <p className="text-secondary">Connecting you with your friend.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h3>Request Sent!</h3>
                        <p className="text-secondary">Friend request has been sent successfully. Redirecting...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                        <h3>Invite Failed</h3>
                        <p className="text-negative">{error}</p>
                        <p className="text-secondary mt-md">Redirecting back to friends...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default InviteHandler;
