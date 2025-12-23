import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('DRIVER');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/signup', { name, email, password, role });
            navigate('/login');
        } catch (err) {
            setError('Registration failed. Try again.');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-4 text-2xl font-bold text-center text-primary">EV Charger Finder</h2>
                <h3 className="mb-6 text-xl text-center">Sign Up</h3>
                {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
                <form onSubmit={handleSignup}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700">Name</label>
                        <input type="text" className="w-full px-3 py-2 border rounded" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700">Email</label>
                        <input type="email" className="w-full px-3 py-2 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700">Password</label>
                        <input type="password" className="w-full px-3 py-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-700">Role</label>
                        <select className="w-full px-3 py-2 border rounded" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="DRIVER">Driver</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full px-4 py-2 font-bold text-white transition duration-200 rounded bg-primary hover:bg-green-600">
                        Sign Up
                    </button>
                </form>
                <p className="mt-4 text-sm text-center">
                    Already have an account? <Link to="/login" className="text-secondary hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
