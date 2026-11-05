import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';

// Custom clean pin icon with brand styling
const createCustomIcon = (priceText) => L.divIcon({
  className: 'custom-map-marker',
  html: `
    <div style="
      background-color: #0e8ce4;
      color: white;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(14, 140, 228, 0.4);
      border: 2px solid white;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      transform: translate(-50%, -50%);
    ">
      <span>${priceText}</span>
    </div>
  `,
  iconSize: [60, 24],
  iconAnchor: [30, 12],
});

/**
 * Controller component to smoothly pan and fit bounds when hotels or center changes
 */
const MapViewController = ({ center, hotels }) => {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 12, { animate: true });
    } else if (hotels && hotels.length > 0) {
      const validPoints = hotels
        .filter((h) => h.coordinates?.lat && h.coordinates?.lng)
        .map((h) => [h.coordinates.lat, h.coordinates.lng]);

      if (validPoints.length === 1) {
        map.setView(validPoints[0], 13, { animate: true });
      } else if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true });
      }
    }
  }, [center, hotels, map]);

  return null;
};

export const HotelMap = ({
  hotels = [],
  onSelectHotel,
  center,
  zoom = 12,
}) => {
  const { currency, exchangeRates } = useAuth();

  const defaultCenter = useMemo(() => {
    if (center && center[0] && center[1]) return center;
    if (hotels.length > 0 && hotels[0].coordinates?.lat) {
      return [hotels[0].coordinates.lat, hotels[0].coordinates.lng];
    }
    // Default fallback center
    return [21.4194, 91.9772];
  }, [center, hotels]);

  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[400px]"
      >
        {/* Esri World Street Map - Global English Map, No API Key Watermarks */}
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, METI, TomTom"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />

        {/* Dynamic Map Pan & Zoom Controller */}
        <MapViewController center={center} hotels={hotels} />

        {hotels.map((hotel) => {
          if (!hotel.coordinates?.lat || !hotel.coordinates?.lng) return null;
          const priceText = formatCurrency(hotel.pricePerNight, currency, exchangeRates);
          const icon = createCustomIcon(priceText);
          const distanceStr = hotel.distanceKm
            ? `${hotel.distanceKm} km from center`
            : 'Nearby location';

          return (
            <Marker
              key={hotel._id || hotel.name}
              position={[hotel.coordinates.lat, hotel.coordinates.lng]}
              icon={icon}
            >
              <Popup>
                <div className="w-52 text-left space-y-1.5 p-1">
                  <img
                    src={hotel.thumbnail || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=80'}
                    alt={hotel.name}
                    className="w-full h-24 object-cover rounded-lg mb-1.5"
                  />
                  <h4 className="font-bold text-xs text-slate-900 leading-tight">{hotel.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    📍 {hotel.district || 'City Center'} • {distanceStr}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      ★ {hotel.reviewScore?.toFixed(1) || '4.5'}
                    </span>
                    <span className="text-xs font-black text-brand-600">{priceText} / night</span>
                  </div>
                  {onSelectHotel && (
                    <button
                      type="button"
                      onClick={() => onSelectHotel(hotel)}
                      className="w-full mt-2 py-1.5 text-center bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[10px] font-bold transition-colors"
                    >
                      View Hotel
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
