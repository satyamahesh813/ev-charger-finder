import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { useState, useEffect } from 'react';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loggedInUser = localStorage.getItem("user");
        if (loggedInUser) {
            setUser(JSON.parse(loggedInUser));
        }
    }, []);

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
    };

    return (
        <Router>
            <div className="flex flex-col h-screen">
                <Routes>
                    <Route path="/login" element={<Login setUser={setUser} />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/landing" element={<Landing user={user} />} />
                    <Route
                        path="/admin/*"
                        element={
                            <ProtectedRoute user={user} requiredRole="ADMIN">
                                <AdminDashboard user={user} logout={logout} />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={user ? (user.role === 'ADMIN' ? <Navigate to="/admin" /> : <Home user={user} logout={logout} />) : <Landing user={user} />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
