import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ setUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const fullUrl = `${import.meta.env.VITE_API_URL}/api/auth/login`;
            onsole.log('🚀 Fetching stats from:', fullUrl); // DEBUG
            const response = await axios.post(fullUrl, { email, password });
            localStorage.setItem('user', JSON.stringify(response.data));
            setUser(response.data);
            navigate('/');
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-4 text-2xl font-bold text-center text-primary">EV Charger Finder</h2>
                <h3 className="mb-6 text-xl text-center">Login</h3>
                {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border rounded shadow focus:outline-none focus:ring focus:border-green-300"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-700">Password</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border rounded shadow focus:outline-none focus:ring focus:border-green-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-bold text-white transition duration-200 rounded bg-primary hover:bg-green-600"
                    >
                        Login
                    </button>
                </form>
                <p className="mt-4 text-sm text-center">
                    Don't have an account? <Link to="/signup" className="text-secondary hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
