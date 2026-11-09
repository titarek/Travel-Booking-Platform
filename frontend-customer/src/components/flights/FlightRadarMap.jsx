import {
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Plane,
  Navigation,
} from 'lucide-react';
import {
  getAirportCoordinates,
  calculateGreatCirclePath,
  getInterpolatedPosition,
} from '../../utils/airportCoordinates.js';

// Geoapify Map Tiles endpoint powered by user's key
const GEOAPIFY_API_KEY = '7ce40ffb71cf4ca59ea23cc96d69bb67';
const GEOAPIFY_TILE_URL = `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`;
const FALLBACK_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

/**
 * Custom Origin Departure Pin
 */
const createOriginIcon = (code) => L.divIcon({
  className: 'custom-flight-origin-marker',
  html: `
    <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%);">
      <div style="background:#059669; color:white; font-size:10px; font-weight:900; padding:2.5px 7px; border-radius:9999px; border:2px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3); white-space:nowrap; display:flex; align-items:center; gap:3px;">
        <span>DEP: ${code}</span>
      </div>
      <div style="width:7px; height:7px; border-radius:50%; background:#059669; border:2px solid white; box-shadow:0 0 6px rgba(5,150,105,0.8); margin-top:1px;"></div>
    </div>
  `,
  iconSize: [60, 30],
  iconAnchor: [30, 20],
});

/**
 * Custom Destination Arrival Pin
 */
const createDestinationIcon = (code) => L.divIcon({
  className: 'custom-flight-dest-marker',
  html: `
    <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%);">
      <div style="background:#dc2626; color:white; font-size:10px; font-weight:900; padding:2.5px 7px; border-radius:9999px; border:2px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3); white-space:nowrap; display:flex; align-items:center; gap:3px;">
        <span>ARR: ${code}</span>
      </div>
      <div style="width:7px; height:7px; border-radius:50%; background:#dc2626; border:2px solid white; box-shadow:0 0 6px rgba(220,38,38,0.8); margin-top:1px;"></div>
    </div>
  `,
  iconSize: [60, 30],
  iconAnchor: [30, 20],
});

/**
 * Custom Live Aircraft Icon with Bearing Rotation & Radar Beacon
 */
const createAircraftIcon = (bearing, flightNumber, altitude) => L.divIcon({
  className: 'custom-flight-plane-marker',
  html: `
    <div style="position:relative; width:44px; height:44px; transform: translate(-50%, -50%); display:flex; align-items:center; justify-content:center;">
      <!-- Concentric animated radar radar pulse -->
      <div style="position:absolute; inset:0; border-radius:50%; background:rgba(14,140,228,0.22); border:1.5px solid rgba(14,140,228,0.6); animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <!-- Plane circle badge with directional orientation -->
      <div style="position:relative; width:34px; height:34px; border-radius:50%; background:#0e8ce4; border:2px solid white; box-shadow:0 4px 12px rgba(14,140,228,0.55); display:flex; align-items:center; justify-content:center; color:white; transform: rotate(${bearing - 90}deg); transition: transform 0.5s ease-out;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
      </div>
      <!-- Floating telemetry label badge directly on the map -->
      <div style="position:absolute; left:50%; top:-18px; transform:translateX(-50%); background:rgba(15,23,42,0.9); backdrop-filter:blur(4px); color:white; font-size:9px; font-weight:800; padding:2px 6px; border-radius:6px; border:1px solid rgba(255,255,255,0.25); white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.3); pointer-events:none;">
        ${flightNumber || 'FLIGHT'} • ${altitude || 'Level Cruise'}
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

/**
 * Controller component to automatically pan and fit bounds smoothly ONCE per route,
 * without overriding manual user interactions like zooming in (+) or dragging.
 */
const MapAutoFitter = ({ routeKey, originCoords, destCoords }) => {
  const map = useMap();
  const fittedKeyRef = useRef(null);

  useEffect(() => {
    if (!originCoords || !destCoords) return;
    if (fittedKeyRef.current === routeKey) return;

    try {
      const leafletBounds = L.latLngBounds([
        [originCoords.lat, originCoords.lng],
        [destCoords.lat, destCoords.lng],
      ]);
      map.fitBounds(leafletBounds, {
        padding: [45, 45],
        maxZoom: 6,
        animate: false,
      });
      fittedKeyRef.current = routeKey;
    } catch {
      // Fallback
    }
  }, [routeKey, originCoords, destCoords, map]);

  return null;
};

export const FlightRadarMap = ({
  flight,
  statusData = {},
  height = 'h-64 sm:h-72',
  className = '',
}) => {
  // 1. Resolve Origin and Destination Coordinates
  const originCode = statusData.origin || flight?.origin?.code || 'DAC';
  const originCity = statusData.originCity || flight?.origin?.city || '';
  const destCode = statusData.destination || flight?.destination?.code || 'DXB';
  const destCity = statusData.destinationCity || flight?.destination?.city || '';

  const originCoords = useMemo(
    () => getAirportCoordinates(originCode, originCity),
    [originCode, originCity],
  );

  const destCoords = useMemo(
    () => getAirportCoordinates(destCode, destCity),
    [destCode, destCity],
  );

  // 2. Flight status parsing
  const rawStatus = (statusData.rawStatus || statusData.status || flight?.status || '').toLowerCase();
  const isLanded = rawStatus === 'landed';
  const isScheduled = rawStatus === 'scheduled';
  const baseProgress = statusData.progressPercent != null ? statusData.progressPercent : 55;

  // 3. Live incremental progress animation for in-flight mode
  const [liveProgress, setLiveProgress] = useState(baseProgress);

  useEffect(() => {
    setLiveProgress(baseProgress);
  }, [baseProgress]);

  useEffect(() => {
    if (isLanded || isScheduled) return () => {};

    const interval = setInterval(() => {
      setLiveProgress((prev) => {
        if (prev >= 98) return 50; // loop back realistically for demonstration
        return Number((prev + 0.15).toFixed(2));
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLanded, isScheduled]);

  // 4. Calculate Great Circle Trajectory Path (40 points)
  const fullTrajectoryPath = useMemo(
    () => calculateGreatCirclePath(originCoords, destCoords, 50),
    [originCoords, destCoords],
  );

  // 5. Determine Current Aircraft GPS Location & Heading
  const currentAircraft = useMemo(() => {
    if (isScheduled) {
      return {
        lat: originCoords.lat,
        lng: originCoords.lng,
        bearing: 90,
      };
    }
    if (isLanded) {
      return {
        lat: destCoords.lat,
        lng: destCoords.lng,
        bearing: 90,
      };
    }

    // If API provided raw numeric GPS coordinates
    const rawLat = parseFloat(statusData.latitude);
    const rawLng = parseFloat(statusData.longitude);
    if (!Number.isNaN(rawLat) && !Number.isNaN(rawLng)) {
      const headingNum = parseFloat(statusData.heading);
      const calculated = getInterpolatedPosition(originCoords, destCoords, liveProgress);
      return {
        lat: rawLat,
        lng: rawLng,
        bearing: !Number.isNaN(headingNum) ? headingNum : (calculated?.bearing || 90),
      };
    }

    // Interpolate along the Great Circle arc based on live progress
    return getInterpolatedPosition(originCoords, destCoords, liveProgress) || {
      lat: (originCoords.lat + destCoords.lat) / 2,
      lng: (originCoords.lng + destCoords.lng) / 2,
      bearing: 90,
    };
  }, [isScheduled, isLanded, statusData.latitude, statusData.longitude, statusData.heading, originCoords, destCoords, liveProgress]);

  // 6. Split Trajectory into Completed Path and Remaining Path
  const { completedPath, remainingPath } = useMemo(() => {
    if (!fullTrajectoryPath || fullTrajectoryPath.length === 0) {
      return { completedPath: [], remainingPath: [] };
    }
    const splitIndex = Math.min(
      Math.max(1, Math.floor((liveProgress / 100) * fullTrajectoryPath.length)),
      fullTrajectoryPath.length - 1,
    );

    const completed = fullTrajectoryPath.slice(0, splitIndex + 1);
    const remaining = fullTrajectoryPath.slice(splitIndex);

    // Join with exact current aircraft coordinate for seamless look
    completed[completed.length - 1] = [currentAircraft.lat, currentAircraft.lng];
    remaining[0] = [currentAircraft.lat, currentAircraft.lng];

    return { completedPath: completed, remainingPath: remaining };
  }, [fullTrajectoryPath, liveProgress, currentAircraft]);

  const flightNumber = statusData.flightNumber || flight?.flightNumber || 'FLIGHT';
  const altitude = statusData.altitude || '38,000 ft';
  const speed = statusData.speed || '860 km/h';
  const routeKey = `${originCode}-${destCode}-${flightNumber}`;

  return (
    <div className={`w-full ${height} rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner relative group ${className}`}>
      <MapContainer
        center={[
          (originCoords.lat + destCoords.lat) / 2,
          (originCoords.lng + destCoords.lng) / 2,
        ]}
        zoom={4}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[220px]"
      >
        {/* Geoapify Map Tiles with Esri Failover */}
        <TileLayer
          attribution='Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> &copy; OpenStreetMap'
          url={GEOAPIFY_TILE_URL}
          errorTileUrl={FALLBACK_TILE_URL}
          maxZoom={12}
        />

        {/* Initial Bounds Auto-fitter: runs once per route and never overrides user manual zoom (+) or pan */}
        <MapAutoFitter
          routeKey={routeKey}
          originCoords={originCoords}
          destCoords={destCoords}
        />

        {/* Completed Flight Route Polyline (Solid Glowing Brand Blue) */}
        {completedPath.length > 0 && (
          <Polyline
            positions={completedPath}
            pathOptions={{
              color: '#0e8ce4',
              weight: 4,
              opacity: 0.9,
            }}
          />
        )}

        {/* Remaining Flight Route Polyline (Dashed Navigation Trail) */}
        {remainingPath.length > 0 && (
          <Polyline
            positions={remainingPath}
            pathOptions={{
              color: '#64748b',
              weight: 2.5,
              dashArray: '6, 8',
              opacity: 0.75,
            }}
          />
        )}

        {/* Origin Airport Departure Marker */}
        <Marker
          position={[originCoords.lat, originCoords.lng]}
          icon={createOriginIcon(originCode)}
        >
          <Popup className="custom-popup">
            <div className="p-1 space-y-1 text-slate-800">
              <span className="font-extrabold text-xs block text-emerald-700">Origin / Departure</span>
              <p className="font-bold text-xs">{originCoords.city} ({originCode})</p>
              <p className="text-[10px] text-slate-500">{originCoords.airport}</p>
              <p className="text-[10px] font-mono font-semibold text-slate-600">
                Sched: {statusData.scheduledDep || flight?.departureTime || 'On Time'}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Airport Final Location Marker */}
        <Marker
          position={[destCoords.lat, destCoords.lng]}
          icon={createDestinationIcon(destCode)}
        >
          <Popup className="custom-popup">
            <div className="p-1 space-y-1 text-slate-800">
              <span className="font-extrabold text-xs block text-rose-700">Destination / Final Location</span>
              <p className="font-bold text-xs">{destCoords.city} ({destCode})</p>
              <p className="text-[10px] text-slate-500">{destCoords.airport}</p>
              <p className="text-[10px] font-mono font-semibold text-slate-600">
                Estimated: {statusData.scheduledArr || flight?.arrivalTime || 'On Time'}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Live Aircraft Marker */}
        <Marker
          position={[currentAircraft.lat, currentAircraft.lng]}
          icon={createAircraftIcon(currentAircraft.bearing, flightNumber, altitude)}
        >
          <Popup className="custom-popup">
            <div className="p-1 space-y-1.5 text-slate-800 min-w-[160px]">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                <span className="font-black text-xs text-brand-600">{flightNumber}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                  {statusData.status || (isLanded ? 'Landed' : 'In Flight')}
                </span>
              </div>
              <div className="text-[11px] space-y-0.5 text-slate-600 font-medium">
                <div>Altitude: <strong className="text-slate-800">{altitude}</strong></div>
                <div>Ground Speed: <strong className="text-slate-800">{speed}</strong></div>
                <div>GPS: <strong className="font-mono text-slate-800">{currentAircraft.lat.toFixed(4)}°, {currentAircraft.lng.toFixed(4)}°</strong></div>
                <div>Track: <strong className="text-slate-800">{Math.round(currentAircraft.bearing)}°</strong></div>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Floating Live Badge Top Right */}
      <div className="absolute top-3 right-3 z-[1000] pointer-events-none hidden sm:flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-sm text-[10px] font-bold text-slate-700">
        <Navigation className="h-3 w-3 text-brand-500" />
        <span>Geoapify Flight Radar</span>
      </div>

      {/* Bottom Route Summary Bar */}
      <div className="absolute bottom-2.5 inset-x-3 z-[1000] pointer-events-none flex items-center justify-between text-[10px] font-bold bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-md">
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>{originCode} ({originCity || 'Departure'})</span>
        </div>
        <div className="flex items-center gap-1 text-brand-600 font-mono">
          <Plane className="h-3 w-3" />
          <span>{isLanded ? 'Arrived at Destination' : `${Math.round(liveProgress)}% Route Traversed`}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <span>{destCode} ({destCity || 'Final Location'})</span>
          <span className="h-2 w-2 rounded-full bg-rose-500" />
        </div>
      </div>
    </div>
  );
};
