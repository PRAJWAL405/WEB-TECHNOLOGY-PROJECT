import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <nav className="navbar">
            <div className="container">
                <div className="navbar-content">
                    <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
                        <h2 className="brand-text">💰 SplitEase</h2>
                    </div>

                    {user && (
                        <>
                            <div className="navbar-links">
                                <button onClick={() => navigate('/dashboard')} className="nav-link">
                                    Dashboard
                                </button>
                                <button onClick={() => navigate('/groups')} className="nav-link">
                                    Groups
                                </button>
                                <button onClick={() => navigate('/friends')} className="nav-link">
                                    Friends
                                </button>
                                <button onClick={() => navigate('/profile')} className="nav-link">
                                    Profile
                                </button>
                            </div>
                            <div className="navbar-user">
                                <span className="user-name">Hello, {user.name}</span>
                                <button
                                    onClick={() => {
                                        logout();
                                        navigate('/login');
                                    }}
                                    className="btn btn-secondary btn-small"
                                >
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
