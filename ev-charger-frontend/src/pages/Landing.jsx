import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Zap, MapPin, Search, Navigation, ShieldCheck, Star, Users, Database, Globe } from 'lucide-react';

const Landing = ({ user }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, available: 0, users: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/chargers/stats');
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching stats:", error);
                setStats({ total: 450, available: 380, users: 2100 });
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white font-sans overflow-x-hidden selection:bg-emerald-500/30">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.1); }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s infinite ease-in-out;
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s infinite ease-in-out;
                }
            `}} />

            {/* Nav */}
            <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex items-center justify-between bg-[#0b0e14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => user ? navigate('/landing') : navigate('/login')}>
                    <div className="bg-emerald-500 p-1.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover:rotate-12 transition-transform">
                        <Zap size={22} className="text-white fill-current" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
                        EV<span className="text-emerald-500">Finder</span>
                    </span>
                </div>
                <div className="hidden md:flex items-center gap-8 mr-auto ml-12 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                    {/* <span className="cursor-pointer hover:text-emerald-500 transition-colors">Global Network</span>
                    <span className="cursor-pointer hover:text-emerald-500 transition-colors">Smart Features</span>
                    <span className="cursor-pointer hover:text-emerald-500 transition-colors">API Sync</span> */}
                </div>
                <div className="flex items-center gap-4">
                    {!user && (
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 rounded-full text-sm font-bold text-gray-400 hover:text-white transition-all"
                        >
                            Sign In
                        </button>
                    )}
                    <button
                        onClick={() => user ? navigate('/') : navigate('/login')}
                        className="px-8 py-2.5 bg-emerald-500 rounded-full text-sm font-black hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-95 text-black italic uppercase tracking-tighter"
                    >
                        {user ? 'Open Dashboard' : 'Get Started'}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-52 pb-40 px-8">
                <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full -z-10 animate-pulse-slow"></div>

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-12 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                        Live Network Sync Active
                    </div>

                    <h1 className="text-8xl md:text-[9.5rem] font-black leading-[0.9] tracking-tighter mb-10 bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent italic">
                        DRIVE <span className="text-emerald-500 not-italic">GREEN</span><br />
                        <span className="opacity-80">STAY</span> POWERED
                    </h1>

                    <p className="max-w-3xl mx-auto text-gray-400 text-lg md:text-2xl font-medium mb-16 leading-relaxed opacity-80">
                        Access {stats.total.toLocaleString()}+ verified charging stations globally. <br className="hidden md:block" />
                        Real-time status updates powered by the EVFinder Cloud.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-24">
                        <button
                            onClick={() => user ? navigate('/') : navigate('/login')}
                            className="group relative px-12 py-6 bg-emerald-500 text-black rounded-3xl font-black text-xl transition-all hover:scale-105 hover:bg-emerald-400 hover:shadow-[0_20px_60px_rgba(16,185,129,0.3)] active:scale-95 italic tracking-tighter"
                        >
                            {user ? 'GOTO MAP VIEW' : 'FIND CHARGERS NOW'}
                            <Navigation className="inline-block ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={24} />
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            <StatBox
                                icon={<Database size={14} />}
                                value={stats.total}
                                label="Live Stations"
                            />
                            <StatBox
                                icon={<Users size={14} />}
                                value={stats.users}
                                label="Active Users"
                            />
                        </div>
                    </div>
                </div>

                {/* App Preview */}
                <div className="mt-12 max-w-6xl mx-auto relative group perspective-1000">
                    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-emerald-800/20 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-[#161b22] rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                        <div className="h-14 bg-[#1f242d] flex items-center px-8 gap-3 border-b border-white/5">
                            <div className="flex gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
                            </div>
                            <div className="mx-auto bg-[#0b0e14]/50 px-6 py-1.5 rounded-xl text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase">
                                system.evfinder.io/live-map
                            </div>
                        </div>
                        <div className="relative h-[600px] overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=2000"
                                className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                                alt="Map Preview"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] via-[#161b22]/20 to-transparent"></div>
                            <div className="absolute top-10 right-10 flex items-center gap-3 bg-emerald-500 px-4 py-2 rounded-full shadow-2xl animate-bounce-slow">
                                <Zap size={14} className="text-black fill-current" />
                                <span className="text-[10px] font-black text-black uppercase tracking-widest">Real-time Data Sync</span>
                            </div>

                            <div className="absolute bottom-16 left-16">
                                <div className="flex items-center gap-5 bg-white/5 backdrop-blur-2xl border border-white/20 p-6 rounded-[2rem] shadow-2xl">
                                    <div className="bg-emerald-500 p-3 rounded-2xl">
                                        <MapPin className="text-black" size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live from Cloud</p>
                                        </div>
                                        <p className="text-2xl font-black italic text-white tracking-tight leading-none mb-1">METRO CHARGE • 0.8 KM</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">AVAILABLE • ₹15/kWh</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-40 px-8">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
                    <FeatureCard
                        icon={<Globe />}
                        title="GLOBAL SYNC"
                        desc={`Access a database of ${stats.total.toLocaleString()} stations worldwide with real-time occupancy data.`}
                    />
                    <FeatureCard
                        icon={<ShieldCheck />}
                        title="VERIFIED SPOTS"
                        desc="Every station is manually verified for reliability and pricing accuracy."
                    />
                    <FeatureCard
                        icon={<Navigation />}
                        title="PRECISION ROUTING"
                        desc="Seamless integration with Google Maps and local routing engines for the fastest path."
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-8 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Zap size={20} className="text-emerald-500 fill-current" />
                        <span className="font-black italic uppercase tracking-tighter">EV<span className="text-emerald-500">FINDER</span></span>
                    </div>
                    <p className="text-gray-600 text-[10px] font-bold tracking-[0.2em] uppercase">
                        © 2025 ALL RIGHTS RESERVED • THE FUTURE IS ELECTRIC
                    </p>
                    <div className="flex gap-6">
                        {['Terms', 'Privacy', 'Network'].map(t => (
                            <span key={t} className="text-[10px] font-black uppercase tracking-widest text-gray-500 cursor-pointer hover:text-white transition-colors">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
};

const StatBox = ({ icon, value, label }) => (
    <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4 group hover:border-emerald-500/30 transition-colors">
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div className="text-left">
            <p className="text-xl font-black italic leading-none mb-1">
                {value.toLocaleString()}<span className="text-emerald-500">+</span>
            </p>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">
                {label}
            </p>
        </div>
    </div>
);

const FeatureCard = ({ icon, title, desc }) => (
    <div className="p-12 rounded-[3rem] bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -z-10 group-hover:bg-emerald-500/10 transition-colors"></div>
        <div className="mb-10 p-5 bg-emerald-500/10 rounded-2xl w-fit group-hover:scale-110 transition-transform">
            {React.cloneElement(icon, { size: 32, className: "text-emerald-500" })}
        </div>
        <h3 className="text-3xl font-black mb-6 italic tracking-tight">{title}</h3>
        <p className="text-gray-400 font-medium leading-relaxed opacity-70">
            {desc}
        </p>
    </div>
);

export default Landing;
