import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation } from 'lucide-react';

// Create a custom SVG marker icon
const createCustomIcon = (status, selected) => {
    const color = status === 'AVAILABLE' ? '#00ffa3' : '#ff4b4b';
    const glow = status === 'AVAILABLE' ? '#00ffa3' : '#ff4b4b';
    const size = selected ? 48 : 36;
    const shadow = selected ? `0 0 20px ${glow}` : `0 0 10px ${glow}`;

    const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="filter: drop-shadow(${shadow}); transition: all 0.3s ease;">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                fill="${color}" stroke="${selected ? '#ffffff' : 'rgba(255,255,255,0.7)'}" stroke-width="${selected ? 2.5 : 1.5}"/>
        </svg>`;

    return L.divIcon({
        html: svgIcon,
        className: `custom-leaflet-icon \${selected ? 'selected-marker' : ''}`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
};

const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const MapEvents = ({ onMapMove }) => {
    const map = useMapEvents({
        moveend: () => {
            const center = map.getCenter();
            if (onMapMove) {
                onMapMove([center.lat, center.lng]);
            }
        }
    });
    return null;
};

// Create a custom SVG marker icon for the user
const createUserIcon = () => {
    return L.divIcon({
        html: `
            <div class="user-location-marker">
                <div class="pulse"></div>
                <div class="dot"></div>
            </div>`,
        className: 'user-marker-container',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
};

const MapComponent = ({ chargers, center, onMarkerClick, selectedCharger, onMapMove, onGetDirections, isDarkMode, userLocation }) => {
    const position = center || [12.9716, 77.5946];

    const getCurrencySymbol = (charger) => {
        const country = (charger.country || "").toUpperCase();
        const address = (charger.address || "").toLowerCase();

        // Priority 1: Explicit country field
        if (country === "US" || country === "USA") return "$";
        if (country === "GB" || country === "UK") return "£";
        if (country === "DE" || country === "FR" || country === "EU" || country === "IT" || country === "ES") return "€";
        if (country === "AU") return "A$";
        if (country === "CA") return "C$";

        // Priority 2: Precise Address string fallback
        const isUS = /\busa\b|\bunited states\b/.test(address);
        const isUK = /\buk\b|\bunited kingdom\b|\blondon\b/.test(address);
        const isEU = /\bgermany\b|\bfrance\b|\beurope\b|\bberlin\b|\bparis\b|\bitaly\b|\bspain\b/.test(address);

        if (isUS) return "$";
        if (isUK) return "£";
        if (isEU) return "€";

        return "₹";
    };

    // Dynamic Leaflet Tile URLs
    const tileUrl = isDarkMode
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    return (
        <MapContainer center={position} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0 bg-[#0b0e14]">
            <RecenterMap center={position} />
            <MapEvents onMapMove={onMapMove} />

            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url={tileUrl}
            />

            {/* User Location Marker */}
            {userLocation && (
                <Marker position={userLocation} icon={createUserIcon()} zIndexOffset={1000}>
                    <Popup>
                        <div className="font-bold text-center">You are here</div>
                    </Popup>
                </Marker>
            )}

            {Array.isArray(chargers) && chargers.map((charger) => {
                if (!charger || !charger.id || isNaN(charger.latitude) || isNaN(charger.longitude)) return null;
                return (
                    <Marker
                        key={charger.id}
                        position={[charger.latitude, charger.longitude]}
                        icon={createCustomIcon(charger.status, selectedCharger === charger.id)}
                        eventHandlers={{
                            click: () => onMarkerClick && onMarkerClick(charger)
                        }}
                    >
                        <Popup className="premium-popup">
                            <div className={`p-4 \${isDarkMode ? 'bg-[#161b22] text-white border-[#30363d]' : 'bg-white text-gray-900 border-gray-100'} border-b rounded-t-xl w-64 shadow-2xl`}>
                                <h3 className={`font-black text-lg mb-1 leading-tight \${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{charger.name || 'Unknown Spot'}</h3>
                                <p className={`\${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs mb-3 italic`}>{charger.address || 'Address unavailable'}</p>

                                <div className={`space-y-2 text-xs uppercase tracking-widest font-bold border-t \${isDarkMode ? 'border-[#30363d]' : 'border-gray-100'} pt-3`}>
                                    <div className="flex justify-between">
                                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Connector:</span>
                                        <span className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}>{charger.plugType || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Service Fee:</span>
                                        <span className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}>{getCurrencySymbol(charger)}{charger.pricePerKwh || '0'}/kWh</span>
                                    </div>

                                    <div className="pt-2">
                                        <div className={`text-center py-2 rounded-lg border mb-3 transition-all ${charger.status === 'AVAILABLE'
                                            ? isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-500/20 text-emerald-600'
                                            : isDarkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-500/20 text-red-600'
                                            }`}>
                                            {charger.status || 'UNKNOWN'}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onGetDirections && onGetDirections(charger.latitude, charger.longitude);
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-black transition-all shadow-lg ${isDarkMode
                                                ? 'bg-emerald-500 text-[#0d1117] hover:bg-emerald-400 shadow-emerald-500/20'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                                                }`}
                                        >
                                            <Navigation size={14} fill="currentColor" />
                                            GET DIRECTIONS
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
};

export default MapComponent;
