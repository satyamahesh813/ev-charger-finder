import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users,
    Zap,
    Home,
    Settings,
    Plus,
    Edit2,
    Trash2,
    Power,
    Search,
    ChevronRight,
    LayoutDashboard,
    LogOut
} from 'lucide-react';

const AdminDashboard = ({ user, logout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        totalUsers: 0, activeUsers: 0, inactiveUsers: 0,
        totalChargers: 0, activeChargers: 0, inactiveChargers: 0,
        chargerStatusBreakdown: {}
    });
    const [users, setUsers] = useState([]);
    const [chargers, setChargers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({ show: false, type: null, data: null });
    const [detailModal, setDetailModal] = useState({ show: false, title: '', type: '', filter: null });
    const [selectedIds, setSelectedIds] = useState([]);
    const [filters, setFilters] = useState({ status: 'ALL', country: 'ALL', plugType: 'ALL', role: 'ALL' });
    const [searchTerm, setSearchTerm] = useState('');

    const token = user?.token;

    const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` }
    };

    useEffect(() => {
        fetchStats();
        if (activeTab === 'users' || activeTab === 'overview') fetchUsers(searchTerm);
        if (activeTab === 'chargers' || activeTab === 'overview') fetchChargers(searchTerm);
        if (activeTab === 'logs') fetchLogs();
    }, [activeTab, searchTerm]);

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/admin/stats', axiosConfig);
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching stats', err);
        }
    };

    const fetchUsers = async (search = '') => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/users?search=${search}`, axiosConfig);
            setUsers(res.data);
        } catch (err) {
            alert('Failed to load user database. Please check your connection or login again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchChargers = async (search = '') => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/chargers?search=${search}`, axiosConfig);
            setChargers(res.data);
        } catch (err) {
            alert('Failed to load charging network. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/logs', axiosConfig);
            setLogs(res.data);
        } catch (err) {
            console.error('Error fetching logs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleUser = async (id) => {
        try {
            await axios.patch(`/api/admin/users/${id}/toggle`, {}, axiosConfig);
            fetchUsers();
            fetchStats();
        } catch (err) {
            const msg = err.response?.data?.message || 'Unable to update user status. Ensure you have the required permissions.';
            alert(`Action Failed: ${msg}`);
        }
    };

    const handleToggleCharger = async (id) => {
        try {
            await axios.patch(`/api/admin/chargers/${id}/toggle`, {}, axiosConfig);
            fetchChargers();
            fetchStats();
        } catch (err) {
            const msg = err.response?.data?.message || 'Unable to update charger status.';
            alert(`Action Failed: ${msg}`);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await axios.delete(`/api/admin/users/${id}`, axiosConfig);
            fetchUsers();
            fetchStats();
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not delete user. They might be linked to other records.';
            alert(`Action Failed: ${msg}`);
        }
    };

    const handleDeleteCharger = async (id) => {
        if (!window.confirm('Are you sure you want to delete this charger?')) return;
        try {
            await axios.delete(`/api/admin/chargers/${id}`, axiosConfig);
            fetchChargers();
            fetchStats();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to delete charger point.';
            alert(`Action Failed: ${msg}`);
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData.entries());

        try {
            if (modalConfig.data) {
                await axios.put(`/api/admin/users/${modalConfig.data.id}`, userData, axiosConfig);
            } else {
                await axios.post('/api/admin/users', userData, axiosConfig);
            }
            fetchUsers();
            fetchStats();
            setModalConfig({ show: false, type: null, data: null });
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save user account. Please check the email and required fields.';
            alert(`Action Failed: ${msg}`);
        }
    };

    const handleSaveCharger = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const chargerData = Object.fromEntries(formData.entries());
        // Convert numbers
        chargerData.latitude = parseFloat(chargerData.latitude);
        chargerData.longitude = parseFloat(chargerData.longitude);
        chargerData.pricePerKwh = parseFloat(chargerData.pricePerKwh);

        try {
            if (modalConfig.data) {
                await axios.put(`/api/admin/chargers/${modalConfig.data.id}`, chargerData, axiosConfig);
            } else {
                await axios.post('/api/admin/chargers', chargerData, axiosConfig);
            }
            fetchChargers();
            fetchStats();
            setModalConfig({ show: false, type: null, data: null });
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save charger point information.';
            alert(`Action Failed: ${msg}`);
        }
    };

    const handleBulkToggle = async (type, enabled) => {
        if (selectedIds.length === 0) return;
        try {
            await axios.patch(`/api/admin/${type}s/bulk-toggle`, { ids: selectedIds, enabled }, axiosConfig);
            if (type === 'user') fetchUsers(searchTerm); else fetchChargers(searchTerm);
            fetchStats();
            setSelectedIds([]);
        } catch (err) {
            console.error('Bulk action failed:', err);
            const msg = err.response?.data?.message || 'Reason unknown';
            alert(`Bulk action failed: ${msg}`);
        }
    };

    const exportToCSV = () => {
        if (chargers.length === 0) return;
        const data = filteredChargers.map(c => ({
            Name: c.name,
            Address: c.address,
            Country: c.country,
            Technology: c.plugType,
            Status: c.status,
            Price: `${getCurrencySymbol(c.country)}${c.pricePerKwh}`,
            Service: c.enabled ? 'ACTIVE' : 'INACTIVE'
        }));

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `flux_charge_network_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getCurrencySymbol = (country) => {
        if (!country) return '$';
        const upper = country.trim().toUpperCase();
        const map = {
            'IN': '₹', 'INDIA': '₹',
            'US': '$', 'USA': '$', 'UNITED STATES': '$',
            'UK': '£', 'UNITED KINGDOM': '£', 'GB': '£',
            'FR': '€', 'FRANCE': '€',
            'DE': '€', 'GERMANY': '€',
            'IT': '€', 'ITALY': '€',
            'ES': '€', 'SPAIN': '€',
            'EU': '€', 'EUROPE': '€'
        };
        return map[upper] || '$';
    };

    const StatusBadge = ({ enabled, onClick, isReadOnly = false }) => (
        <button
            onClick={onClick}
            disabled={isReadOnly}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm
                ${enabled
                    ? 'bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200/80 border border-emerald-200'
                    : 'bg-rose-100/80 text-rose-700 hover:bg-rose-200/80 border border-rose-200'}
                ${isReadOnly ? 'opacity-70 cursor-not-allowed shadow-none' : 'hover:scale-105 active:scale-95'}`}
        >
            <Power size={14} className={enabled ? 'animate-pulse' : ''} />
            {enabled ? 'Active Service' : 'Out of Service'}
        </button>
    );

    const LocationBadge = ({ country }) => (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 font-bold text-[10px] tracking-widest uppercase">
            <Home size={10} /> {country || 'Global'}
        </span>
    );

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filters.role === 'ALL' || u.role === filters.role;
        const matchesStatus = filters.status === 'ALL' || (filters.status === 'ACTIVE' ? u.enabled : !u.enabled);
        return matchesSearch && matchesRole && matchesStatus;
    });

    const filteredChargers = chargers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filters.status === 'ALL' ||
            (filters.status === 'ACTIVE' ? c.enabled :
                filters.status === 'MAINTENANCE' ? c.status === 'MAINTENANCE' : !c.enabled);
        const matchesCountry = filters.country === 'ALL' || c.country === filters.country;
        const matchesPlug = filters.plugType === 'ALL' || c.plugType === filters.plugType;
        return matchesSearch && matchesStatus && matchesCountry && matchesPlug;
    });

    const toggleSelection = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const getDetailList = () => {
        if (detailModal.type === 'user') {
            return users.filter(u => u.enabled === detailModal.filter);
        }
        if (detailModal.type === 'charger') {
            return chargers.filter(c => c.enabled === detailModal.filter);
        }
        return [];
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-8">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
                            <Zap className="fill-white text-white" size={24} />
                        </div>
                        <span className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Flux Charge</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <SidebarItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                    />
                    <SidebarItem
                        icon={<Users size={20} />}
                        label="Users"
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                    />
                    <SidebarItem
                        icon={<Zap size={20} />}
                        label="Chargers"
                        active={activeTab === 'chargers'}
                        onClick={() => setActiveTab('chargers')}
                    />
                    <SidebarItem
                        icon={<Settings size={20} />}
                        label="Log History"
                        active={activeTab === 'logs'}
                        onClick={() => setActiveTab('logs')}
                    />
                </nav>

                <div className="p-6 border-t border-slate-100">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all duration-300 group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold">Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight capitalize">{activeTab}</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Management Portal</p>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search everything..."
                                className="pl-12 pr-6 py-2.5 bg-slate-100 border-2 border-transparent rounded-2xl w-72 focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 pl-8 border-l border-slate-200">
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-700 leading-tight">{user?.email?.split('@')[0]}</p>
                                <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-black uppercase tracking-tighter">System {user?.role}</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-200 border-2 border-white ring-1 ring-emerald-100">
                                {user?.email?.[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-10 max-w-7xl mx-auto w-full">
                    {activeTab === 'overview' && (
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    icon={<Users />}
                                    label="Active Drivers"
                                    value={stats.activeUsers}
                                    color="emerald"
                                    onClick={() => setDetailModal({ show: true, title: 'Active Drivers', type: 'user', filter: true })}
                                />
                                <StatCard
                                    icon={<Users />}
                                    label="Suspended Drivers"
                                    value={stats.inactiveUsers}
                                    color="rose"
                                    onClick={() => setDetailModal({ show: true, title: 'Suspended Drivers', type: 'user', filter: false })}
                                />
                                <StatCard
                                    icon={<Zap />}
                                    label="Online Services"
                                    value={stats.activeChargers}
                                    color="cyan"
                                    onClick={() => setDetailModal({ show: true, title: 'Online Chargers', type: 'charger', filter: true })}
                                />
                                <StatCard
                                    icon={<Zap />}
                                    label="Offline Services"
                                    value={stats.inactiveChargers}
                                    color="amber"
                                    onClick={() => setDetailModal({ show: true, title: 'Offline Chargers', type: 'charger', filter: false })}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <section className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-3xl" />
                                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                        <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                                        System Actions
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6 relative z-10">
                                        <QuickActionBtn
                                            icon={<Plus size={24} />}
                                            label="Register New User"
                                            onClick={() => setModalConfig({ show: true, type: 'user', data: null })}
                                        />
                                        <QuickActionBtn
                                            icon={<Plus size={24} />}
                                            label="Deploy New Station"
                                            onClick={() => setModalConfig({ show: true, type: 'charger', data: null })}
                                        />
                                    </div>

                                    {stats.chargerStatusBreakdown && (
                                        <div className="mt-10 pt-8 border-t border-slate-100">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Availability Breakdown</h4>
                                            <div className="flex gap-4">
                                                {Object.entries(stats.chargerStatusBreakdown).map(([status, count]) => (
                                                    <div key={status} className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{status}</p>
                                                        <p className="text-xl font-black text-slate-700">{count}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                                <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] shadow-xl flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                    <div className="relative z-10">
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-emerald-500/30">
                                            <Zap size={32} className="text-emerald-400 animate-pulse" />
                                        </div>
                                        <h4 className="text-white font-black text-xl mb-2">Network Health</h4>
                                        <p className="text-emerald-400 font-black italic tracking-widest text-sm uppercase">100% Operational</p>
                                        <div className="mt-6 flex gap-2">
                                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />)}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                            <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h3 className="font-black text-xl">User Directory</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage platform access</p>
                                </div>
                                <button
                                    onClick={() => setModalConfig({ show: true, type: 'user', data: null })}
                                    className="bg-emerald-600 text-white pr-6 pl-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 font-bold"
                                >
                                    <Plus size={20} /> Register User
                                </button>
                            </header>
                            <div className="p-8 border-b border-slate-100 flex flex-wrap gap-4 items-center bg-slate-50/10">
                                <select
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    value={filters.role}
                                    onChange={e => setFilters({ ...filters, role: e.target.value })}
                                >
                                    <option value="ALL">All Roles</option>
                                    <option value="ADMIN">System Admin</option>
                                    <option value="DRIVER">Fleet Driver</option>
                                </select>
                                <select
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    value={filters.status}
                                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="ACTIVE">System Active</option>
                                    <option value="INACTIVE">Deactivated</option>
                                </select>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                                            <th className="px-8 py-5 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
                                                    onChange={(e) => setSelectedIds(e.target.checked ? filteredUsers.filter(u => u.role !== 'ADMIN').map(u => u.id) : [])}
                                                    checked={selectedIds.length > 0 && selectedIds.length === filteredUsers.filter(u => u.role !== 'ADMIN').length}
                                                />
                                            </th>
                                            <th className="px-8 py-5">Profile Details</th>
                                            <th className="px-8 py-5">Access Level</th>
                                            <th className="px-8 py-5">Availability</th>
                                            <th className="px-8 py-5 text-right">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredUsers.map(u => (
                                            <tr key={u.id} className={`hover:bg-slate-50/80 transition-all duration-300 group ${selectedIds.includes(u.id) ? 'bg-emerald-50/50' : ''}`}>
                                                <td className="px-8 py-6 text-center">
                                                    {u.role !== 'ADMIN' && (
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
                                                            checked={selectedIds.includes(u.id)}
                                                            onChange={() => toggleSelection(u.id)}
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-black text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors capitalize shadow-sm">
                                                            {u.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-700 group-hover:text-emerald-700 transition-colors leading-tight">{u.name}</p>
                                                            <p className="text-xs font-medium text-slate-400">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${u.role === 'ADMIN' ? 'bg-purple-100/80 text-purple-700 border border-purple-200' : 'bg-blue-100/80 text-blue-700 border border-blue-200'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {u.role !== 'ADMIN' ? (
                                                        <StatusBadge enabled={u.enabled} onClick={() => handleToggleUser(u.id)} />
                                                    ) : (
                                                        <StatusBadge enabled={true} isReadOnly={true} />
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {u.role !== 'ADMIN' && (
                                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                            <button
                                                                onClick={() => setModalConfig({ show: true, type: 'user', data: u })}
                                                                className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'chargers' && (
                        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                            <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h3 className="font-black text-xl">Service Hub</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fleet & Network Monitor</p>
                                </div>
                                <button
                                    onClick={() => setModalConfig({ show: true, type: 'charger', data: null })}
                                    className="bg-emerald-600 text-white pr-6 pl-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 font-bold"
                                >
                                    <Plus size={20} /> Deploy Station
                                </button>
                            </header>
                            <div className="p-8 border-b border-slate-100 flex flex-wrap gap-4 items-center bg-slate-50/10">
                                <select
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    value={filters.country}
                                    onChange={e => setFilters({ ...filters, country: e.target.value })}
                                >
                                    <option value="ALL">All Regions</option>
                                    {[...new Set(chargers.map(c => c.country))].filter(Boolean).map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <select
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    value={filters.status}
                                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="ACTIVE">Online</option>
                                    <option value="INACTIVE">Offline</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                </select>
                                <button
                                    onClick={exportToCSV}
                                    className="ml-auto px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <LayoutDashboard size={14} /> Export Inventory
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                                            <th className="px-8 py-5 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
                                                    onChange={(e) => setSelectedIds(e.target.checked ? filteredChargers.map(c => c.id) : [])}
                                                    checked={selectedIds.length > 0 && selectedIds.length === filteredChargers.length}
                                                />
                                            </th>
                                            <th className="px-8 py-5 w-[35%]">Station Info</th>
                                            <th className="px-8 py-5 w-[25%]">Technology</th>
                                            <th className="px-8 py-5 w-[15%]">Pricing</th>
                                            <th className="px-8 py-5 w-[15%] text-center">Status</th>
                                            <th className="px-8 py-5 w-[10%] text-right">Ops</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredChargers.map(c => (
                                            <tr key={c.id} className={`hover:bg-slate-50/80 transition-all duration-300 group ${selectedIds.includes(c.id) ? 'bg-emerald-50/50' : ''}`}>
                                                <td className="px-8 py-6 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
                                                        checked={selectedIds.includes(c.id)}
                                                        onChange={() => toggleSelection(c.id)}
                                                    />
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-black text-slate-700 group-hover:text-emerald-700 transition-colors">{c.name}</p>
                                                            <LocationBadge country={c.country} />
                                                        </div>
                                                        <p className="text-xs font-medium text-slate-400">{c.address}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-wrap gap-1">
                                                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-tight uppercase border border-slate-200 inline-block overflow-hidden whitespace-nowrap text-ellipsis max-w-full" title={c.plugType}>
                                                            {c.plugType}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="inline-flex items-baseline gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 whitespace-nowrap">
                                                        <span className="text-sm font-black">{getCurrencySymbol(c.country)}{c.pricePerKwh}</span>
                                                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">/kWh</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <StatusBadge enabled={c.enabled} onClick={() => handleToggleCharger(c.id)} />
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                        <button
                                                            onClick={() => setModalConfig({ show: true, type: 'charger', data: c })}
                                                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCharger(c.id)}
                                                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                            <header className="p-8 border-b border-slate-100 bg-slate-50/30">
                                <h3 className="font-black text-xl">System Audit Logs</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Administrative Actions</p>
                            </header>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                                            <th className="px-8 py-5">Timestamp</th>
                                            <th className="px-8 py-5">Administrator</th>
                                            <th className="px-8 py-5">Action</th>
                                            <th className="px-8 py-5">Entity Type</th>
                                            <th className="px-8 py-5">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {logs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-6 text-xs text-slate-400 font-bold whitespace-nowrap">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-slate-700 text-sm">{log.adminEmail}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                                                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                                            log.action === 'DELETE' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-xs font-bold text-slate-500">
                                                    {log.entityType}
                                                </td>
                                                <td className="px-8 py-6 text-xs text-slate-600 font-medium max-w-xs truncate">
                                                    {log.details}
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold italic">
                                                    No activity recorded yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Create/Edit Modal */}
            {modalConfig.show && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[60] p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-[0_20px_70px_rgba(0,0,0,0.15)] border border-white/20 animate-in zoom-in-95 duration-300">
                        <header className="mb-8">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                {modalConfig.data ? `Refine ${modalConfig.type}` : `Register New ${modalConfig.type}`}
                            </h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                                {modalConfig.data ? 'Update object parameters' : 'Complete system registration'}
                            </p>
                        </header>
                        <form onSubmit={modalConfig.type === 'user' ? handleSaveUser : handleSaveCharger} className="space-y-6">
                            {modalConfig.type === 'user' ? (
                                <>
                                    <Input label="Full Identity" name="name" defaultValue={modalConfig.data?.name} placeholder="e.g. John Doe" required />
                                    <Input
                                        label="Electronic Mail"
                                        name="email"
                                        type="email"
                                        defaultValue={modalConfig.data?.email}
                                        placeholder="e.g. john@example.com"
                                        required
                                        readOnly={!!modalConfig.data}
                                        className={`w-full px-6 py-4 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-bold ${modalConfig.data ? 'bg-slate-100 cursor-not-allowed opacity-60' : 'bg-slate-100'}`}
                                    />
                                    {!modalConfig.data && (
                                        <Input label="Initial Auth Key" name="password" type="password" placeholder="********" required />
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                                        <select
                                            name="role"
                                            className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-bold"
                                            defaultValue={modalConfig.data?.role || 'DRIVER'}
                                        >
                                            <option value="DRIVER">Fleet Driver</option>
                                            <option value="ADMIN">System Administrator</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Input label="Station Designation" name="name" defaultValue={modalConfig.data?.name} placeholder="e.g. Downtown Supercharger" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Latitude" name="latitude" type="number" step="any" defaultValue={modalConfig.data?.latitude} required />
                                        <Input label="Longitude" name="longitude" type="number" step="any" defaultValue={modalConfig.data?.longitude} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Physical Coordinates" name="address" defaultValue={modalConfig.data?.address} placeholder="e.g. 123 Main St, NY" required />
                                        <Input label="Region Code" name="country" defaultValue={modalConfig.data?.country} placeholder="e.g. India, US, UK" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Connector Class" name="plugType" defaultValue={modalConfig.data?.plugType} placeholder="e.g. CCS2" required />
                                        <Input label="Base Rate" name="pricePerKwh" type="number" step="0.01" defaultValue={modalConfig.data?.pricePerKwh} placeholder="0.00" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Current Status</label>
                                        <select
                                            name="status"
                                            className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-bold"
                                            defaultValue={modalConfig.data?.status || 'AVAILABLE'}
                                        >
                                            <option value="AVAILABLE">Available</option>
                                            <option value="OCCUPIED">Occupied</option>
                                            <option value="MAINTENANCE">Under Maintenance</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setModalConfig({ show: false, type: null, data: null })}
                                    className="flex-1 px-6 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                                >
                                    Proceed
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail List Modal */}
            {detailModal.show && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-[0_20px_70px_rgba(0,0,0,0.15)] border border-white/20 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
                        <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{detailModal.title}</h3>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Filtered Intelligence Scan</p>
                            </div>
                            <button
                                onClick={() => setDetailModal({ show: false, title: '', type: '', filter: null })}
                                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90"
                            >
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </header>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm">
                                    <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                                        <th className="px-8 py-5">{detailModal.type === 'user' ? 'Entity' : 'Station'}</th>
                                        <th className="px-8 py-5">{detailModal.type === 'user' ? 'Access' : 'Coordinates'}</th>
                                        <th className="px-8 py-5 text-right">Value/Spec</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {getDetailList().length > 0 ? getDetailList().map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    {detailModal.type === 'user' && (
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 uppercase">
                                                            {item.name[0]}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-black text-slate-700 leading-tight">{item.name}</p>
                                                        <p className="text-[11px] font-medium text-slate-400">{detailModal.type === 'user' ? item.email : item.address}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {detailModal.type === 'user' ? (
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${item.role === 'ADMIN' ? 'bg-purple-100/70 text-purple-700' : 'bg-blue-100/70 text-blue-700'}`}>
                                                        {item.role}
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-600">{item.country || 'N/A'}</span>
                                                        <LocationBadge country={item.country} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {detailModal.type === 'charger' ? (
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{item.plugType}</p>
                                                        <p className="text-sm font-black text-emerald-600">{getCurrencySymbol(item.country)}{item.pricePerKwh}/kWh</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">Synchronized</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                                        <Search className="text-slate-200" size={24} />
                                                    </div>
                                                    <p className="text-slate-300 font-bold italic text-sm">No records found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-8 z-50 animate-in slide-in-from-bottom-10 duration-500 border border-white/10">
                    <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center font-black">
                            {selectedIds.length}
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest leading-none">Selected</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Objects Targeted</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleBulkToggle(activeTab === 'users' ? 'user' : 'charger', true)}
                            className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Power size={14} /> Bulk Activate
                        </button>
                        <button
                            onClick={() => handleBulkToggle(activeTab === 'users' ? 'user' : 'charger', false)}
                            className="bg-rose-600 hover:bg-rose-500 px-6 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Power size={14} className="rotate-180" /> Bulk Suspend
                        </button>
                    </div>
                    <button
                        onClick={() => setSelectedIds([])}
                        className="p-2.5 text-slate-400 hover:text-white transition-all ml-4"
                    >
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>
            )}
        </div>
    );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
    >
        {active && <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-100" />}
        <div className={`relative z-10 ${active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'} transition-colors`}>
            {icon}
        </div>
        <span className="relative z-10 font-black text-sm tracking-tight">{label}</span>
        {active && <ChevronRight size={16} className="relative z-10 ml-auto animate-in slide-in-from-left-2" />}
    </button>
);

const StatCard = ({ icon, label, value, color, onClick }) => {
    const colors = {
        emerald: 'bg-emerald-100/50 text-emerald-600 ring-emerald-100',
        rose: 'bg-rose-100/50 text-rose-600 ring-rose-100',
        cyan: 'bg-cyan-100/50 text-cyan-600 ring-cyan-100',
        amber: 'bg-amber-100/50 text-amber-600 ring-amber-100'
    };
    return (
        <div
            onClick={onClick}
            className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col gap-6 cursor-pointer transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-emerald-500/20 hover:-translate-y-2 group active:scale-95 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 group-hover:bg-emerald-50" />
            <div className={`w-14 h-14 rounded-2xl ${colors[color]} ring-4 flex items-center justify-center transition-all group-hover:rotate-12 group-hover:scale-110 relative z-10`}>
                {icon}
            </div>
            <div className="relative z-10">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-end justify-between">
                    <p className="text-4xl font-black text-slate-800 tracking-tighter">{value}</p>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuickActionBtn = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-5 p-6 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl hover:border-emerald-500 hover:bg-white hover:shadow-xl hover:shadow-emerald-500/5 transition-all group active:scale-95"
    >
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            {icon}
        </div>
        <div className="text-left">
            <span className="block text-sm font-black text-slate-700 group-hover:text-emerald-700 transition-colors">{label}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execute Action</span>
        </div>
    </button>
);

const Input = ({ label, className, ...props }) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input
            className={className || "w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"}
            {...props}
        />
    </div>
);

export default AdminDashboard;
