import { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from '../components/Map';
import { LogOut, Zap, Search, Navigation, MapPin, LocateFixed } from 'lucide-react';

const Home = ({ user, logout }) => {
    const [chargers, setChargers] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [filter, setFilter] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCharger, setSelectedCharger] = useState(null);
    const [mapCenter, setMapCenter] = useState(null); // Wait for GPS to avoid showing Bengaluru
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const hour = new Date().getHours();
        return hour >= 18 || hour < 6; // Dark mode from 6 PM to 6 AM, Light mode otherwise
    });
    const [notification, setNotification] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d.toFixed(1);
    };

    const getCurrencySymbol = (charger) => {
        const country = (charger.country || "").toUpperCase();
        const address = (charger.address || "").toLowerCase();

        // Priority 1: Explicit country field
        if (country === "US" || country === "USA") return "$";
        if (country === "GB" || country === "UK") return "£";
        if (country === "DE" || country === "FR" || country === "EU" || country === "IT" || country === "ES") return "€";
        if (country === "AU") return "A$";
        if (country === "CA") return "C$";

        // Priority 2: Precise Address string fallback to avoid false positives (e.g., "Lousa" shouldn't trigger "usa")
        const isUS = /\busa\b|\bunited states\b/.test(address);
        const isUK = /\buk\b|\bunited kingdom\b|\blondon\b/.test(address);
        const isEU = /\bgermany\b|\bfrance\b|\beurope\b|\bberlin\b|\bparis\b|\bitaly\b|\bspain\b/.test(address);

        if (isUS) return "$";
        if (isUK) return "£";
        if (isEU) return "€";

        return "₹"; // Default to INR
    };

    const handleLocateMe = () => {
        if (userLocation) {
            setMapCenter([userLocation[0], userLocation[1]]);
            showNotification("Centering on your location", "info");
        } else {
            showNotification("Location not detected yet", "error");
        }
    };

    const handleGetDirections = (lat, lon) => {
        if (!lat || !lon) {
            showNotification("Location coordinates missing for this spot", "error");
            return;
        }
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
        window.open(url, '_blank');
    };

    useEffect(() => {
        const getPosition = (options) => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
        };

        const detectLocation = async () => {
            if (!("geolocation" in navigator)) {
                setLocationError("Geolocation is not supported by your browser.");
                setMapCenter([12.9716, 77.5946]); // Final default fallback
                return;
            }

            try {
                // Try high accuracy first
                const pos = await getPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
                const { latitude, longitude } = pos.coords;
                console.log("[HOME] High-accuracy location found:", latitude, longitude);
                setMapCenter([latitude, longitude]);
                setUserLocation([latitude, longitude]);
            } catch (err) {
                console.warn("[HOME] High accuracy failed, trying low accuracy...", err);
                try {
                    // Try low accuracy as a fallback
                    const pos = await getPosition({ enableHighAccuracy: false, timeout: 5000 });
                    const { latitude, longitude } = pos.coords;
                    setMapCenter([latitude, longitude]);
                    setUserLocation([latitude, longitude]);
                } catch (finalErr) {
                    console.error("[HOME] Geolocation failed completely:", finalErr);
                    let errorMsg = "Could not detect your exact location.";
                    if (finalErr.code === 1) errorMsg = "Location access denied. Please enable it in browser settings.";
                    else if (finalErr.code === 3) errorMsg = "Location request timed out.";

                    setLocationError(errorMsg);
                    // Don't set mapCenter automatically if we want to show the error screen
                }
            }
        };

        detectLocation();
    }, []);

    useEffect(() => {
        const fetchChargers = async () => {
            if (!mapCenter) return; // Don't fetch until we have a location

            setLoading(true);
            setChargers([]); // Clear stale data immediately when center changes

            try {
                const token = user.token;
                const config = {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        lat: mapCenter[0],
                        lng: mapCenter[1]
                    }
                };
                const fullUrl = `${import.meta.env.VITE_API_URL}/api/chargers`;
                const response = await axios.get(fullUrl, config);
                setChargers(response.data);
            } catch (error) {
                console.error("Error fetching chargers", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchChargers, 500); // 500ms debounce to let GPS settle
        return () => clearTimeout(timer);
    }, [user, mapCenter]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchInput.trim().length < 3) {
                setSuggestions([]);
                return;
            }

            try {
                let url = `https://photon.komoot.io/api/?q=${searchInput}&limit=5`;
                if (userLocation) {
                    url += `&lat=${userLocation[0]}&lon=${userLocation[1]}`;
                }
                const response = await axios.get(url);
                if (response.data && response.data.features) {
                    const formatted = response.data.features.map(f => ({
                        id: f.properties.osm_id,
                        display_name: [
                            f.properties.name,
                            f.properties.city,
                            f.properties.state,
                            f.properties.country
                        ].filter(Boolean).join(', '),
                        lat: f.geometry.coordinates[1],
                        lon: f.geometry.coordinates[0]
                    }));
                    setSuggestions(formatted);
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(timeoutId);
    }, [searchInput, userLocation]);

    const handleSuggestionClick = (suggestion) => {
        setMapCenter([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
        setSearchInput(suggestion.display_name);
        setFilter('');
        setChargers([]);
        setSuggestions([]);
    };

    const handleSearch = async (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            if (suggestions.length > 0) {
                handleSuggestionClick(suggestions[0]);
            }
        }
    };

    const handleMarkerClick = (charger) => {
        setSelectedCharger(charger.id);
        const element = document.getElementById(`charger-${charger.id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    const handleMapMove = (newCenter) => {
        setMapCenter(newCenter);
        setChargers([]); // Clear stale results when map moves
    };

    const filteredChargers = chargers.filter(c => {
        if (!c.latitude || !c.longitude) return false; // Defensive: Hide points with no coordinates
        const name = c.name?.toLowerCase() || '';
        const type = c.plugType?.toLowerCase() || '';
        const search = filter.toLowerCase();
        return name.includes(search) || type.includes(search);
    }).sort((a, b) => {
        if (!userLocation) return 0;
        const distA = parseFloat(calculateDistance(userLocation[0], userLocation[1], a.latitude, a.longitude));
        const distB = parseFloat(calculateDistance(userLocation[0], userLocation[1], b.latitude, b.longitude));
        return distA - distB;
    });

    if (!user) return null;

    if (!mapCenter) {
        return (
            <div className={`flex flex-col items-center justify-center h-screen ${isDarkMode ? 'bg-[#0b0e14] text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="relative mb-8">
                    <Zap className={`${locationError ? 'text-rose-500' : 'text-emerald-500'} animate-pulse`} size={64} fill="currentColor" />
                    <div className={`absolute inset-0 ${locationError ? 'bg-rose-500/20' : 'bg-emerald-500/20'} blur-3xl scale-150 rounded-full animate-pulse`}></div>
                </div>
                {locationError ? (
                    <div className="text-center max-w-md px-6">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-rose-500">Location Sync Failed</h2>
                        <p className="text-gray-500 font-bold text-sm mb-8 uppercase tracking-widest">{locationError}</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                            >
                                Try Sync Again
                            </button>
                            <button
                                onClick={() => setMapCenter([12.9716, 77.5946])}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95"
                            >
                                Continue with Default View
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-white">Syncing your location</h2>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-bounce">Scanning for nearby stations...</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-screen font-sans transition-colors duration-500 overflow-hidden ${isDarkMode ? 'bg-[#0b0e14] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <header className={`${isDarkMode ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-gray-200'} border-b px-6 py-4 flex items-center justify-between sticky top-0 z-[1001] shadow-lg`}>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/landing'}>
                    <div className="bg-emerald-500 p-1.5 rounded-lg">
                        <Zap size={20} className="text-white fill-current" />
                    </div>
                    <span className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        EV<span className="text-emerald-500">Finder</span>
                    </span>
                </div>

                <div className="flex-1 max-w-2xl mx-12 relative group">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} group-focus-within:text-emerald-500 transition-colors`} size={20} />
                    <input
                        type="text"
                        placeholder="Explore locations or charging spots..."
                        className={`w-full ${isDarkMode ? 'bg-[#0d1117] border-[#30363d] text-gray-200 placeholder-gray-600 focus:border-emerald-500/50' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500'} pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner`}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleSearch}
                    />

                    {suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl mt-2 z-50 overflow-hidden backdrop-blur-md">
                            {suggestions.map((suggestion) => (
                                <div
                                    key={suggestion.id}
                                    className="px-5 py-3 hover:bg-[#21262d] cursor-pointer flex items-start space-x-3 transition border-b border-[#30363d] last:border-0"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    <Zap className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <div className="text-sm font-semibold text-gray-100">
                                            {suggestion.display_name.split(',')[0]}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {suggestion.display_name.split(',').slice(1).join(',').trim()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-6 shrink-0">
                    <div className="hidden lg:flex flex-col items-end">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">Operator</span>
                        <span className="text-sm text-gray-300 font-semibold">{user.email.split('@')[0]}</span>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 group"
                    >
                        <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar - List View */}
                <aside className={`${isDarkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-white border-gray-200'} border-r w-96 flex flex-col z-10 shadow-2xl overflow-hidden`}>
                    <div className={`${isDarkMode ? 'bg-[#161b22]/50' : 'bg-gray-50'} p-5 border-b ${isDarkMode ? 'border-[#30363d]' : 'border-gray-200'} backdrop-blur-md`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`font-black text-xl flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Nearby Spots
                            </h2>
                            <div className="px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-500 text-[10px] font-bold tracking-tighter animate-pulse uppercase">
                                {filteredChargers.length} FOUND
                            </div>
                        </div>

                        <div className="relative mb-2">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} size={14} />
                            <input
                                type="text"
                                placeholder="Filter by name or type..."
                                className={`w-full ${isDarkMode ? 'bg-[#0d1117]/80 border-[#30363d] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-900'} pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-emerald-500/30 transition-all`}
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                        <p className={`text-[10px] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} italic font-medium`}>API Ninjas Real-time Data Sync</p>
                    </div>

                    <div className={`flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 ${isDarkMode ? 'bg-[#0d1117]/50' : 'bg-gray-50/50'}`}>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 opacity-50">
                                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                                <p className={`text-xs uppercase tracking-widest font-black ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>Syncing Chargers...</p>
                            </div>
                        ) : filteredChargers.length === 0 ? (
                            <div className={`text-center py-20 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                <Zap className="mx-auto mb-4 opacity-20" size={48} />
                                <p className="text-sm font-medium">No chargers found in this area.</p>
                                <p className="text-[10px]">Try moving the map or searching another city.</p>
                            </div>
                        ) : (
                            filteredChargers.map((charger) => (
                                <div
                                    key={charger.id}
                                    id={`charger-${charger.id}`}
                                    onClick={() => {
                                        setMapCenter([charger.latitude, charger.longitude]);
                                        setSelectedCharger(charger.id);
                                    }}
                                    className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${selectedCharger === charger.id
                                        ? (isDarkMode ? 'bg-emerald-500/5 border-emerald-500/40' : 'bg-emerald-50/50 border-emerald-500/40')
                                        : (isDarkMode ? 'bg-[#161b22] border-[#30363d] hover:border-[#424b55]' : 'bg-white border-gray-200 hover:border-emerald-200')
                                        } ${selectedCharger === charger.id ? 'shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'hover:shadow-md'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-black text-sm leading-tight group-hover:text-emerald-400 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {charger.name}
                                        </h3>
                                        <div className={`w-2 h-2 rounded-full ${charger.status === 'AVAILABLE' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
                                    </div>

                                    <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mb-4 line-clamp-1 italic`}>{charger.address}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <div className={`px-2 py-1 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'} rounded text-[9px] font-black uppercase tracking-wider w-fit`}>
                                                {charger.plugType}
                                            </div>
                                            {userLocation && (
                                                <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                                                    <MapPin size={10} />
                                                    {calculateDistance(userLocation[0], userLocation[1], charger.latitude, charger.longitude)} km away
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-emerald-500 font-extrabold text-sm">
                                            {getCurrencySymbol(charger)}{charger.pricePerKwh} / kWh
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleGetDirections(charger.latitude, charger.longitude);
                                        }}
                                        className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-all group-hover:scale-[1.02] border ${isDarkMode
                                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                            : 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-sm'
                                            }`}
                                    >
                                        <Navigation size={16} />
                                        GET DIRECTIONS
                                    </button>

                                    {/* Selection indicator */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 transition-transform ${selectedCharger === charger.id ? 'translate-x-0' : '-translate-x-full group-hover:translate-x-0'
                                        }`}></div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Map Section */}
                <main className="flex-1 relative">
                    <div className="absolute inset-0">
                        <MapComponent
                            chargers={filteredChargers}
                            center={mapCenter}
                            onMarkerClick={handleMarkerClick}
                            selectedCharger={selectedCharger}
                            onMapMove={handleMapMove}
                            onGetDirections={handleGetDirections}
                            isDarkMode={isDarkMode}
                            userLocation={userLocation}
                        />
                    </div>

                    {/* Map Overlays */}
                    <div className="absolute bottom-6 right-6 z-10 pointer-events-none">
                        <div className="bg-[#161b22]/90 backdrop-blur-md border border-[#30363d] p-3 rounded-xl shadow-2xl pointer-events-auto">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={toggleTheme}
                                    className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-[#30363d] text-yellow-400 hover:bg-[#3d444d]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} shadow-sm`}
                                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                >
                                    {isDarkMode ? <Zap size={20} fill="currentColor" /> : <Zap size={20} />}
                                </button>

                                <button
                                    onClick={handleLocateMe}
                                    className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-[#30363d] text-emerald-400 hover:bg-[#3d444d]' : 'bg-gray-100 text-emerald-600 hover:bg-gray-200'} shadow-sm`}
                                    title="Locate Me"
                                >
                                    <LocateFixed size={20} />
                                </button>

                                <div className="flex items-center space-x-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></div>
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Available</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Occupied</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            {/* Notifications */}
            {notification && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 rounded-xl shadow-2xl border transition-all animate-bounce ${notification.type === 'error'
                    ? 'bg-red-500/90 border-red-400 text-white'
                    : 'bg-emerald-500/90 border-emerald-400 text-white'
                    }`}>
                    <div className="flex items-center gap-3 font-bold">
                        <Zap size={18} />
                        {notification.message}
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 5px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: ${isDarkMode ? '#30363d' : '#e2e8f0'};
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #10b981;
                    }
                    .leaflet-container {
                        font-family: inherit;
                    }
                    .premium-popup .leaflet-popup-content-wrapper {
                        background: transparent !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .premium-popup .leaflet-popup-content {
                        margin: 0 !important;
                        width: auto !important;
                    }
                    .premium-popup .leaflet-popup-tip-container {
                        display: none;
                    }
                    @keyframes slideUp {
                        from { transform: translate(-50%, 100%); opacity: 0; }
                        to { transform: translate(-50%, 0); opacity: 1; }
                    }
                    .animate-slideUp {
                        animation: slideUp 0.3s ease-out forwards;
                    }
                    .user-location-marker {
                        position: relative;
                        width: 20px;
                        height: 20px;
                    }
                    .user-location-marker .dot {
                        width: 12px;
                        height: 12px;
                        background: #3b82f6;
                        border: 2px solid white;
                        border-radius: 50%;
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        z-index: 2;
                        box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
                    }
                    .user-location-marker .pulse {
                        width: 20px;
                        height: 20px;
                        background: rgba(59, 130, 246, 0.4);
                        border-radius: 50%;
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        animation: pulse-ring 2s infinite;
                        z-index: 1;
                    }
                    @keyframes pulse-ring {
                        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                        100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
                    }
                `
            }} />
        </div>
    );
};


export default Home;
