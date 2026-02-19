import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Friends from './pages/Friends';
import InviteHandler from './pages/InviteHandler';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return !user ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <ErrorBoundary>
                                <Dashboard />
                            </ErrorBoundary>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/groups"
                    element={
                        <PrivateRoute>
                            <ErrorBoundary>
                                <Groups />
                            </ErrorBoundary>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/groups/:id"
                    element={
                        <PrivateRoute>
                            <ErrorBoundary>
                                <GroupDetail />
                            </ErrorBoundary>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/friends"
                    element={
                        <PrivateRoute>
                            <Friends />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/invite/:code"
                    element={
                        <PrivateRoute>
                            <InviteHandler />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;
