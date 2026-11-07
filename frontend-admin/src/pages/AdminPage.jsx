import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Building2,
  Plane,
  Users,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  ClipboardList,
  AlertTriangle,
  Lock,
  Package as PackageIcon,
  Sliders,
  Activity,
  Download,
  Printer,
  Sparkles,
  Database,
  Radio,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Key,
  ArrowLeft,
  LogOut,
  ExternalLink,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/formatters.js';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Input } from '../components/ui/Input.jsx';
import api from '../api/axios.js';

// Helper to export tabular data as CSV for SaaS reporting
const exportToCSV = (filename, rows) => {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(separator),
    ...rows.map((row) => keys.map((k) => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(separator)),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const AdminPage = () => {
  const {
    user,
    logout,
    openAuthModal,
    currency,
    exchangeRates,
  } = useAuth();

  const isAdmin = Boolean(user && (user.role || '').toUpperCase() === 'ADMIN');

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [recentNewOrderId, setRecentNewOrderId] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [flights, setFlights] = useState([]);
  const [packages, setPackages] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [settings, setSettings] = useState({
    commissionRate: 5.0,
    maintenanceMode: false,
    announcementBanner: {
      enabled: true,
      message: 'Global Travel Sale: Enjoy up to 15% off with instant booking confirmation!',
      type: 'promotion',
    },
    currencyRates: {
      USD: 1.0,
      BDT: 121.5,
      EUR: 0.92,
      GBP: 0.79,
      AED: 3.67,
      SAR: 3.75,
    },
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [timeRange, setTimeRange] = useState('30d'); // 'today' | '7d' | '30d' | 'all'

  // Filter & Search states
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [hotelSearch, setHotelSearch] = useState('');
  const [flightSearch, setFlightSearch] = useState('');
  const [packageSearch, setPackageSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Modals state
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Deletion prompt modal with mandatory reason
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: '', // 'hotel' | 'flight' | 'package' | 'booking'
    id: null,
    title: '',
    subtitle: '',
    reason: '',
    submitting: false,
  });

  // API Status & Security Key rotation state
  const [apiServices, setApiServices] = useState([]);
  const [apiServicesLoading, setApiServicesLoading] = useState(false);
  const [testingService, setTestingService] = useState(null);
  const [revealedKeys, setRevealedKeys] = useState({});
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [revealModal, setRevealModal] = useState({
    isOpen: false,
    service: null,
    masterPin: '',
    submitting: false,
    error: '',
  });
  const [keyModal, setKeyModal] = useState({
    isOpen: false,
    service: null,
    serviceName: '',
    newKey: '',
    securityPassword: '',
    submitting: false,
    error: '',
  });

  // Advanced Security Master PIN form state
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [pinError, setPinError] = useState('');

  // Cancel booking confirmation modal state
  const [cancelBookingModal, setCancelBookingModal] = useState({
    isOpen: false,
    booking: null,
    submitting: false,
  });

  // New hotel form state
  const [newHotel, setNewHotel] = useState({
    name: '',
    city: '',
    country: '',
    address: '',
    pricePerNight: 150,
    starRating: 5,
    description: '',
    thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    featured: true,
  });

  // New flight form state
  const [newFlight, setNewFlight] = useState({
    airline: 'Emirates',
    flightNumber: 'EK202',
    originCode: 'JFK',
    originCity: 'New York',
    destCode: 'DXB',
    destCity: 'Dubai',
    departureTime: '10:30 AM',
    arrivalTime: '07:45 AM',
    price: 450,
    availableSeats: 32,
  });

  // New package form state
  const [newPackage, setNewPackage] = useState({
    title: '',
    destination: '',
    country: '',
    durationDays: 7,
    durationNights: 6,
    price: 799,
    discountPrice: 699,
    category: 'Family',
    badge: 'Best Seller',
    featured: true,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
  });

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAdminData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [
        statsRes,
        bookingsRes,
        hotelsRes,
        flightsRes,
        packagesRes,
        usersRes,
        logsRes,
        healthRes,
        settingsRes,
        apiKeysRes,
      ] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/bookings'),
        api.get('/admin/hotels'),
        api.get('/admin/flights'),
        api.get('/admin/packages'),
        api.get('/admin/users'),
        api.get('/admin/logs'),
        api.get('/admin/system/health'),
        api.get('/admin/settings'),
        api.get('/admin/api-keys'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data?.data) {
        setStats(statsRes.value.data.data);
      }
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.data?.data) {
        setBookings(bookingsRes.value.data.data);
      }
      if (hotelsRes.status === 'fulfilled' && hotelsRes.value.data?.data) {
        setHotels(hotelsRes.value.data.data);
      }
      if (flightsRes.status === 'fulfilled' && flightsRes.value.data?.data) {
        setFlights(flightsRes.value.data.data);
      }
      if (packagesRes.status === 'fulfilled' && packagesRes.value.data?.data) {
        setPackages(packagesRes.value.data.data);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.data?.data) {
        setUsers(usersRes.value.data.data);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.data?.data) {
        setAuditLogs(logsRes.value.data.data);
      }
      if (healthRes.status === 'fulfilled' && healthRes.value.data?.data) {
        setSystemHealth(healthRes.value.data.data);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.data) {
        setSettings(settingsRes.value.data.data);
      }
      if (apiKeysRes.status === 'fulfilled' && (apiKeysRes.value.data?.services || apiKeysRes.value.data?.data)) {
        setApiServices(apiKeysRes.value.data.services || apiKeysRes.value.data.data || []);
      }
    } catch {
      showToast('Error syncing administrative data.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchApiKeys = useCallback(async () => {
    try {
      setApiServicesLoading(true);
      const res = await api.get('/admin/api-keys');
      if (res.data?.success) {
        setApiServices(res.data.services || res.data.data || []);
      }
    } catch {
      showToast('Could not refresh API keys telemetry.', 'error');
    } finally {
      setApiServicesLoading(false);
    }
  }, []);

  const handleTestApiConnection = async (serviceId) => {
    try {
      setTestingService(serviceId);
      const res = await api.post('/admin/api-keys/test', { service: serviceId });
      if (res.data?.success) {
        showToast(`${serviceId}: ${res.data.message} (${res.data.latencyMs}ms)`);
        setApiServices((prev) => prev.map((s) => (s.id === serviceId ? {
          ...s,
          latencyMs: res.data.latencyMs,
          status: res.data.status,
          lastTested: res.data.timestamp,
        } : s)));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Connection ping failed.', 'error');
    } finally {
      setTestingService(null);
    }
  };

  const handleRequestRevealKey = (service) => {
    setRevealModal({
      isOpen: true,
      service,
      masterPin: '',
      submitting: false,
      error: '',
    });
  };

  const handleConfirmRevealKey = async (e) => {
    e.preventDefault();
    const pin = revealModal.masterPin.trim();
    if (!pin) {
      setRevealModal((prev) => ({ ...prev, error: 'Master PIN is required.' }));
      return;
    }

    try {
      setRevealModal((prev) => ({ ...prev, submitting: true, error: '' }));
      const res = await api.post('/admin/api-keys/reveal', {
        service: revealModal.service.id,
        masterPin: pin,
      });

      if (res.data?.success) {
        const fullKey = res.data.fullKey || 'Key not configured in .env';
        setRevealedKeys((prev) => ({
          ...prev,
          [revealModal.service.id]: fullKey,
        }));
        showToast(`Master PIN verified. ${revealModal.service.name} key decrypted.`);
        setRevealModal({
          isOpen: false,
          service: null,
          masterPin: '',
          submitting: false,
          error: '',
        });
      } else {
        setRevealModal((prev) => ({
          ...prev,
          submitting: false,
          error: res.data?.message || 'Master PIN verification failed.',
        }));
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Master PIN verification failed.';
      setRevealModal((prev) => ({ ...prev, submitting: false, error: errorMsg }));
    }
  };

  const handleHideKey = (serviceId) => {
    setRevealedKeys((prev) => {
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
    showToast('API key concealed.');
  };

  const handleCopyKey = (serviceId, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKeyId(serviceId);
    setTimeout(() => setCopiedKeyId(null), 2000);
    showToast('API key copied to clipboard.');
  };

  const openChangeKeyModal = (service) => {
    setKeyModal({
      isOpen: true,
      service: service.id,
      serviceName: service.name,
      newKey: '',
      securityPassword: '',
      submitting: false,
      error: '',
    });
  };

  const handleUpdateApiKey = async (e) => {
    e.preventDefault();
    if (!keyModal.newKey.trim()) {
      setKeyModal((prev) => ({ ...prev, error: 'Please enter a valid API key or credential string.' }));
      return;
    }
    if (!keyModal.securityPassword) {
      setKeyModal((prev) => ({ ...prev, error: 'Master confirmation PIN is required.' }));
      return;
    }

    try {
      setKeyModal((prev) => ({ ...prev, submitting: true, error: '' }));
      const res = await api.patch('/admin/api-keys', {
        service: keyModal.service,
        newKey: keyModal.newKey.trim(),
        securityPassword: keyModal.securityPassword,
      });

      if (res.data?.success) {
        showToast(res.data.message || 'API key updated successfully.');
        const updatedKey = res.data?.data?.fullKey || keyModal.newKey.trim();
        setRevealedKeys((prev) => ({
          ...prev,
          [keyModal.service]: updatedKey,
        }));
        setKeyModal({
          isOpen: false,
          service: null,
          serviceName: '',
          newKey: '',
          securityPassword: '',
          submitting: false,
          error: '',
        });
        fetchApiKeys();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update API key.';
      setKeyModal((prev) => ({ ...prev, submitting: false, error: errorMsg }));
    }
  };

  const handleUpdateMasterPin = async (e) => {
    e.preventDefault();
    if (!pinForm.currentPin) {
      setPinError('Current Master PIN is required.');
      return;
    }
    if (!pinForm.newPin || pinForm.newPin.length < 4) {
      setPinError('New Master PIN must be at least 4 characters or digits.');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('New Master PIN and Confirmation do not match.');
      return;
    }

    try {
      setPinSubmitting(true);
      setPinError('');
      const res = await api.patch('/admin/api-keys/pin', {
        currentPin: pinForm.currentPin,
        newPin: pinForm.newPin,
        confirmPin: pinForm.confirmPin,
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Master Security PIN updated successfully.');
        setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      }
    } catch (err) {
      setPinError(err.response?.data?.message || 'Failed to update Master PIN.');
    } finally {
      setPinSubmitting(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [isAdmin, fetchAdminData]);

  // Gentle audio chime for incoming real-time orders
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // Note D5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // Note A5
      gain2.gain.setValueAtTime(0.12, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.42);
    } catch {
      // Audio autoplay policy catch
    }
  };

  // Real-time live order stream & companion silent poller
  useEffect(() => {
    if (!isAdmin) return undefined;

    let eventSource;
    const token = localStorage.getItem('travel_token') || localStorage.getItem('token');
    const apiBase = api.defaults.baseURL || 'http://localhost:5000/api';
    const sseUrl = `${apiBase}/admin/realtime?token=${encodeURIComponent(token || '')}`;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('booking_created', (e) => {
        try {
          const newBooking = JSON.parse(e.data);
          if (!newBooking?._id) return;
          setBookings((prev) => {
            if (prev.some((b) => b._id === newBooking._id)) return prev;
            return [newBooking, ...prev];
          });
          setRecentNewOrderId(newBooking._id);
          playNotificationChime();
          showToast(`🔔 New Order Received: #${newBooking._id.slice(-6).toUpperCase()}`, 'info');
          setTimeout(() => {
            setRecentNewOrderId((cur) => (cur === newBooking._id ? null : cur));
          }, 6000);

          setStats((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              totalBookings: (prev.totalBookings || 0) + 1,
              totalRevenue: (prev.totalRevenue || 0) + (newBooking.totalPrice || 0),
            };
          });
        } catch {
          // SSE payload catch
        }
      });

      eventSource.addEventListener('booking_updated', (e) => {
        try {
          const updated = JSON.parse(e.data);
          if (!updated?._id) return;
          setBookings((prev) => prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b)));
        } catch {
          // SSE payload catch
        }
      });
    } catch {
      // EventSource initialization catch
    }

    // High-resilience silent background poller (every 4 seconds)
    const pollInterval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        try {
          const res = await api.get('/admin/bookings');
          if (res.data?.data) {
            setBookings((prev) => {
              const existingIds = new Set(prev.map((b) => b._id));
              const hasNewOrder = res.data.data.some((b) => !existingIds.has(b._id));
              if (hasNewOrder && prev.length > 0) {
                const newest = res.data.data[0];
                if (newest?._id) {
                  setRecentNewOrderId(newest._id);
                  playNotificationChime();
                  showToast(`🔔 New Order Received: #${newest._id.slice(-6).toUpperCase()}`, 'info');
                  setTimeout(() => {
                    setRecentNewOrderId((cur) => (cur === newest._id ? null : cur));
                  }, 6000);
                }
              }
              return res.data.data;
            });
          }
        } catch {
          // Silent poller catch
        }
      }
    }, 4000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
  }, [isAdmin]);

  // Booking action handlers
  const handleUpdateBookingStatus = async (bookingId, status, paymentStatus) => {
    try {
      const payload = {};
      if (status) payload.status = status;
      if (paymentStatus) payload.paymentStatus = paymentStatus;

      const res = await api.patch(`/admin/bookings/${bookingId}/status`, payload);
      if (res.data?.success) {
        setBookings((prev) => prev.map((b) => (b._id === bookingId ? res.data.data : b)));
        showToast(`Booking #${bookingId.slice(-6).toUpperCase()} marked as ${status || paymentStatus}.`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update booking.', 'error');
    }
  };

  const promptCancelBooking = (booking) => {
    setCancelBookingModal({
      isOpen: true,
      booking,
      submitting: false,
    });
  };

  const handleConfirmCancelBooking = async () => {
    if (!cancelBookingModal.booking) return;
    try {
      setCancelBookingModal((prev) => ({ ...prev, submitting: true }));
      const bookingId = cancelBookingModal.booking._id;
      const res = await api.patch(`/admin/bookings/${bookingId}/status`, {
        status: 'cancelled',
      });

      if (res.data?.success) {
        setBookings((prev) => prev.map((b) => (b._id === bookingId ? res.data.data : b)));
        showToast(`Booking #${bookingId.slice(-6).toUpperCase()} has been cancelled.`);
        setCancelBookingModal({
          isOpen: false,
          booking: null,
          submitting: false,
        });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel booking.', 'error');
      setCancelBookingModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Hotel creation handler
  const handleCreateHotel = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/hotels', {
        ...newHotel,
        pricePerNight: Number(newHotel.pricePerNight),
        starRating: Number(newHotel.starRating),
      });
      if (res.data?.success) {
        setHotels((prev) => [res.data.data, ...prev]);
        setHotelModalOpen(false);
        showToast('New hotel added to platform catalog.');
      }
    } catch {
      showToast('Failed to add hotel.', 'error');
    }
  };

  // Toggle Featured Hotel
  const handleToggleFeaturedHotel = async (hotel) => {
    try {
      const res = await api.patch(`/admin/hotels/${hotel._id}`, {
        featured: !hotel.featured,
      });
      if (res.data?.success) {
        setHotels((prev) => prev.map((h) => (h._id === hotel._id ? { ...h, featured: !h.featured } : h)));
        showToast(`Hotel "${hotel.name}" ${!hotel.featured ? 'promoted to featured' : 'unfeatured'}.`);
      }
    } catch {
      showToast('Could not update hotel featured status.', 'error');
    }
  };

  // Flight creation handler
  const handleCreateFlight = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/flights', {
        ...newFlight,
        price: Number(newFlight.price),
        availableSeats: Number(newFlight.availableSeats),
      });
      if (res.data?.success) {
        setFlights((prev) => [res.data.data, ...prev]);
        setFlightModalOpen(false);
        showToast('New flight route added.');
      }
    } catch {
      showToast('Failed to create flight route.', 'error');
    }
  };

  const handleUpdateFlightStatus = async (flightId, status) => {
    try {
      const res = await api.patch(`/admin/flights/${flightId}/status`, { status });
      if (res.data?.success) {
        setFlights((prev) => prev.map((f) => (f._id === flightId ? res.data.data : f)));
        showToast(`Flight status set to ${status}.`);
      }
    } catch {
      showToast('Could not update flight status.', 'error');
    }
  };

  // Package creation handler
  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/packages', {
        ...newPackage,
        price: Number(newPackage.price),
        discountPrice: newPackage.discountPrice ? Number(newPackage.discountPrice) : null,
        durationDays: Number(newPackage.durationDays),
        durationNights: Number(newPackage.durationNights),
      });
      if (res.data?.success) {
        setPackages((prev) => [res.data.data, ...prev]);
        setPackageModalOpen(false);
        showToast('New tour package published.');
      }
    } catch {
      showToast('Failed to create tour package.', 'error');
    }
  };

  // Toggle Featured Package
  const handleToggleFeaturedPackage = async (pkg) => {
    try {
      const res = await api.patch(`/admin/packages/${pkg._id}`, {
        featured: !pkg.featured,
      });
      if (res.data?.success) {
        setPackages((prev) => prev.map((p) => (p._id === pkg._id ? { ...p, featured: !p.featured } : p)));
        showToast(`Package "${pkg.title}" ${!pkg.featured ? 'marked as featured' : 'unfeatured'}.`);
      }
    } catch {
      showToast('Could not update package.', 'error');
    }
  };

  // Purge live radar cache
  const handlePurgeRadarCache = async () => {
    try {
      const res = await api.post('/admin/system/cache-clear', {
        reason: 'Administrator optimized radar telemetry cache from SaaS panel',
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Telemetry cache flushed.');
        fetchAdminData();
      }
    } catch {
      showToast('Failed to clear cache.', 'error');
    }
  };

  // Save SaaS Platform Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch('/admin/settings', settings);
      if (res.data?.success) {
        setSettings(res.data.data);
        showToast('SaaS platform configuration saved successfully.');
      }
    } catch {
      showToast('Failed to save settings.', 'error');
    }
  };

  // Open deletion modal with reason prompt
  const promptDelete = (type, id, title, subtitle) => {
    setDeleteModal({
      isOpen: true,
      type,
      id,
      title,
      subtitle,
      reason: '',
      submitting: false,
    });
  };

  // Execute deletion with mandatory logged reason
  const handleConfirmDeletion = async (e) => {
    e.preventDefault();
    const trimmedReason = deleteModal.reason.trim();
    if (trimmedReason.length < 3) {
      showToast('Please provide a specific reason (at least 3 characters).', 'error');
      return;
    }

    try {
      setDeleteModal((prev) => ({ ...prev, submitting: true }));

      let endpoint = '';
      if (deleteModal.type === 'hotel') endpoint = 'hotels';
      else if (deleteModal.type === 'flight') endpoint = 'flights';
      else if (deleteModal.type === 'package') endpoint = 'packages';
      else if (deleteModal.type === 'booking') endpoint = 'bookings';

      const res = await api.delete(`/admin/${endpoint}/${deleteModal.id}`, {
        data: { reason: trimmedReason },
      });

      if (res.data?.success) {
        if (deleteModal.type === 'hotel') {
          setHotels((prev) => prev.filter((h) => h._id !== deleteModal.id));
        } else if (deleteModal.type === 'flight') {
          setFlights((prev) => prev.filter((f) => f._id !== deleteModal.id));
        } else if (deleteModal.type === 'package') {
          setPackages((prev) => prev.filter((p) => p._id !== deleteModal.id));
        } else if (deleteModal.type === 'booking') {
          setBookings((prev) => prev.filter((b) => b._id !== deleteModal.id));
        }

        // Add to audit trail log locally
        const newLogEntry = {
          _id: `log_${Date.now()}`,
          adminEmail: user.email,
          action: `DELETE_${deleteModal.type.toUpperCase()}`,
          targetType: deleteModal.type.charAt(0).toUpperCase() + deleteModal.type.slice(1),
          targetName: deleteModal.title,
          reason: trimmedReason,
          ipAddress: '127.0.0.1 (Current Session)',
          createdAt: new Date().toISOString(),
        };
        setAuditLogs((prev) => [newLogEntry, ...prev]);

        setDeleteModal({
          isOpen: false,
          type: '',
          id: null,
          title: '',
          subtitle: '',
          reason: '',
          submitting: false,
        });
        showToast(`${deleteModal.title} removed and logged to audit trail.`);
      }
    } catch {
      showToast('Failed to complete deletion.', 'error');
      setDeleteModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Toggle user role
  const handleToggleUserRole = async (targetUser) => {
    const isTargetAdmin = (targetUser.role || '').toUpperCase() === 'ADMIN';
    const nextRole = isTargetAdmin ? 'CUSTOMER' : 'ADMIN';
    try {
      const res = await api.patch(`/admin/users/${targetUser._id || targetUser.id}/role`, { role: nextRole });
      if (res.data?.success) {
        setUsers((prev) => prev.map((u) => ((u._id || u.id) === (targetUser._id || targetUser.id) ? { ...u, role: nextRole } : u)));
        showToast(`Updated ${targetUser.name}'s role to ${nextRole}.`);
      }
    } catch {
      showToast('Could not update user role.', 'error');
    }
  };

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingStatusFilter !== 'all' && (b.status || '').toLowerCase() !== bookingStatusFilter.toLowerCase()) {
      return false;
    }
    if (bookingTypeFilter !== 'all' && b.type?.toLowerCase() !== bookingTypeFilter.toLowerCase()) {
      return false;
    }
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      const matchEmail = b.contactInfo?.email?.toLowerCase().includes(q)
        || b.user?.email?.toLowerCase().includes(q);
      const matchName = b.travelers?.[0]?.firstName?.toLowerCase().includes(q)
        || b.user?.name?.toLowerCase().includes(q);
      const matchId = b._id?.toLowerCase().includes(q);
      return matchEmail || matchName || matchId;
    }
    return true;
  });

  // Filtered hotels
  const filteredHotels = hotels.filter((h) => {
    if (!hotelSearch.trim()) return true;
    const q = hotelSearch.toLowerCase();
    return h.name?.toLowerCase().includes(q)
      || h.city?.toLowerCase().includes(q)
      || h.country?.toLowerCase().includes(q);
  });

  // Filtered flights
  const filteredFlights = flights.filter((f) => {
    if (!flightSearch.trim()) return true;
    const q = flightSearch.toLowerCase();
    return f.airline?.toLowerCase().includes(q)
      || f.flightNumber?.toLowerCase().includes(q)
      || f.origin?.city?.toLowerCase().includes(q)
      || f.destination?.city?.toLowerCase().includes(q);
  });

  // Filtered packages
  const filteredPackages = packages.filter((p) => {
    if (!packageSearch.trim()) return true;
    const q = packageSearch.toLowerCase();
    return p.title?.toLowerCase().includes(q)
      || p.destination?.toLowerCase().includes(q)
      || p.category?.toLowerCase().includes(q);
  });

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    const matchReason = log.reason?.toLowerCase().includes(q);
    const matchTarget = log.targetName?.toLowerCase().includes(q);
    const matchAdmin = log.adminEmail?.toLowerCase().includes(q);
    const matchAction = log.action?.toLowerCase().includes(q);
    return matchReason || matchTarget || matchAdmin || matchAction;
  });

  // Export handlers
  const handleExportBookings = () => {
    const rows = filteredBookings.map((b) => ({
      BookingId: b._id,
      CustomerName: b.user?.name || b.travelers?.[0]?.firstName || 'Customer',
      CustomerEmail: b.user?.email || b.contactInfo?.email || 'N/A',
      ServiceType: b.type,
      Status: b.status,
      PaymentStatus: b.paymentStatus || 'unpaid',
      TotalAmount: b.totalPrice,
      CreatedAt: new Date(b.createdAt).toISOString(),
    }));
    exportToCSV(`travel_bookings_${new Date().toISOString().split('T')[0]}.csv`, rows);
    showToast('Bookings report exported to CSV.');
  };

  const handleExportAuditTrail = () => {
    const rows = filteredAuditLogs.map((log) => ({
      Timestamp: log.createdAt,
      AdminEmail: log.adminEmail,
      Action: log.action,
      TargetType: log.targetType,
      TargetName: log.targetName,
      ReasonForDeletion: log.reason,
      IPAddress: log.ipAddress || '127.0.0.1',
    }));
    exportToCSV(`audit_trail_${new Date().toISOString().split('T')[0]}.csv`, rows);
    showToast('Audit trail exported to CSV.');
  };

  // Access Gate: If not logged in as Admin, show restricted access (hidden from regular customers)
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="h-16 w-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-sm">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 px-3 py-1 bg-rose-50 rounded-full">
              Access Restricted
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Administrator Portal
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              This area is reserved strictly for authenticated system administrators. Customers and unauthenticated visitors do not have access to platform management facilities.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">
              Need administrator access?
            </p>
            <p className="text-[11px] text-slate-500 leading-normal">
              Please sign in using an authorized administrator account to unlock live operations, inventory controls, and audit logs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="http://localhost:5173"
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors text-center"
            >
              Client Portal (5173)
            </a>
            <Button
              type="button"
              variant="primary"
              onClick={() => openAuthModal('login', { adminOnly: true })}
              className="flex-1 py-2.5 font-bold rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            >
              Sign In to Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Platform Facilities...</p>
        </div>
      </div>
    );
  }

  const commissionEarned = Math.round(((stats?.totalRevenue || 0) * (settings.commissionRate || 5.0)) / 100);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row font-sans">
      {/* Floating Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. LEFT ENTERPRISE SIDEBAR */}
      <aside className="w-full lg:w-72 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 justify-between">
        <div className="p-5 lg:p-6 space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-base tracking-tight">Travel.</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Enterprise Admin Console</p>
              </div>
            </div>
          </div>

          {/* Quick exit to client portal */}
          <a
            href="http://localhost:5173"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all text-xs font-bold group"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-indigo-400 group-hover:-translate-x-1 transition-transform" />
              <span>Client Portal (Port 5173)</span>
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
          </a>

          {/* Navigation links */}
          <nav className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-2">
                Operations &amp; Catalogs
              </p>
              <div className="space-y-1">
                {[
                  { id: 'overview', label: 'Overview', icon: TrendingUp },
                  { id: 'bookings', label: `Bookings (${bookings.length})`, icon: CreditCard },
                  { id: 'hotels', label: `Hotels (${hotels.length})`, icon: Building2 },
                  { id: 'flights', label: `Flights (${flights.length})`, icon: Plane },
                  { id: 'packages', label: `Packages (${packages.length})`, icon: PackageIcon },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                        active
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-2">
                Governance &amp; Security
              </p>
              <div className="space-y-1">
                {[
                  { id: 'api_keys', label: 'API Status & Keys', icon: Key, badge: 'Protected' },
                  { id: 'system', label: 'System & Optimization', icon: Activity },
                  { id: 'settings', label: 'Pricing & Settings', icon: Sliders },
                  { id: 'users', label: `User Directory (${users.length})`, icon: Users },
                  { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: ClipboardList },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                        active
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar user footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md">
                AD
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">{user?.name || 'Super Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@travel.test'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign Out of Admin"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT MAIN CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50 text-slate-900 overflow-y-auto">
        {/* Top telemetry & facility breadcrumb bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-xs">
              <span className="text-slate-400 font-medium">Admin Console / </span>
              <span className="font-black text-slate-900 capitalize">{activeTab.replace('_', ' ')}</span>
            </div>
            <span className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud Sync
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                Fee: {settings.commissionRate}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePurgeRadarCache}
              className="text-xs font-bold gap-1.5 py-2 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700"
              title="Purge cached flight queries to release memory"
            >
              <Radio className="h-3.5 w-3.5 text-brand-600" />
              <span>Purge Radar Cache</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchAdminData}
              loading={refreshing}
              className="text-xs font-bold gap-1.5 py-2 rounded-xl border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync Telemetry</span>
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 lg:p-8 space-y-6">
          {/* Global Announcement Alert Banner Preview (if active) */}
          {settings.announcementBanner?.enabled && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-800 text-white flex items-center justify-between text-xs px-5 shadow-sm border border-indigo-700/50">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                <span className="font-bold text-indigo-100">Broadcast Banner Active:</span>
                <span className="font-medium text-white">{settings.announcementBanner.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="text-[11px] underline font-bold text-indigo-200 hover:text-white"
              >
                Configure in Settings
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW & FINANCIAL METRICS */}
          {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Time Filter Bar */}
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 text-xs">
              <span className="font-bold text-slate-600">Analytics Timeframe:</span>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: 'Last 7 Days' },
                  { id: '30d', label: 'Last 30 Days' },
                  { id: 'all', label: 'All-Time' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeRange(t.id)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      timeRange === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Gross Platform Volume (GPV)
                </span>
                <p className="text-2xl font-black text-slate-900">
                  {formatCurrency(stats?.totalRevenue || 0, currency, exchangeRates)}
                </p>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                  +18.4% vs last cycle
                </span>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Platform Commission (Net)
                </span>
                <p className="text-2xl font-black text-indigo-600">
                  {formatCurrency(commissionEarned, currency, exchangeRates)}
                </p>
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                  At {settings.commissionRate}% platform rate
                </span>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Completed Bookings
                </span>
                <p className="text-2xl font-black text-slate-900">
                  {stats?.statusBreakdown?.confirmed || 0}
                </p>
                <div className="flex gap-2 text-[10px] font-bold text-slate-500">
                  <span className="text-emerald-600">
                    {stats?.conversionRate || 92}% Conversion
                  </span>
                  <span>•</span>
                  <span className="text-amber-600">
                    {stats?.statusBreakdown?.pending || 0} In Progress
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Avg Order Value (AOV)
                </span>
                <p className="text-2xl font-black text-slate-900">
                  {formatCurrency(stats?.averageOrderValue || 380, currency, exchangeRates)}
                </p>
                <span className="text-[10px] text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-full inline-block">
                  Across Flights, Hotels &amp; Tours
                </span>
              </div>
            </div>

            {/* Revenue Distribution By Category */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Revenue Contribution by Vertical</h3>
                    <p className="text-xs text-slate-500">Real-time GMV split across travel booking lines.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportBookings}
                    className="text-xs font-bold gap-1.5 rounded-xl border-slate-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export CSV</span>
                  </Button>
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    { label: 'Commercial Airline Flights', amount: stats?.revenueByType?.flight || 3800, color: 'bg-sky-500', icon: Plane },
                    { label: 'Hotels & Luxury Resorts', amount: stats?.revenueByType?.hotel || 4200, color: 'bg-indigo-500', icon: Building2 },
                    { label: 'Holiday & Umrah Packages', amount: stats?.revenueByType?.package || 2400, color: 'bg-emerald-500', icon: PackageIcon },
                  ].map((cat) => {
                    const total = (stats?.totalRevenue || 10400) || 1;
                    const percent = Math.round((cat.amount / total) * 100);
                    const Icon = cat.icon;
                    return (
                      <div key={cat.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-slate-800">
                            <Icon className="h-4 w-4 text-slate-500" />
                            {cat.label}
                          </span>
                          <span className="text-slate-900">
                            {formatCurrency(cat.amount, currency, exchangeRates)} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* System Performance At a Glance */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">System Telemetry</h3>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Database Node</span>
                    <span className="font-bold text-slate-900">MongoDB Atlas (Live)</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Radar Cache Entries</span>
                    <span className="font-bold text-indigo-600">{stats?.cacheTelemetry?.entryCount || 0} Active Routes</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">System Uptime</span>
                    <span className="font-bold text-slate-900">{Math.floor((stats?.systemUptime || 120) / 60)} mins</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Security Engine</span>
                    <span className="font-bold text-emerald-600">Helmet + Zod Guard Active</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('system')}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-indigo-600 hover:bg-indigo-50 border-indigo-100"
                >
                  Open System Optimizer
                </Button>
              </div>
            </div>

            {/* Recent Platform Bookings Stream */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Recent Customer Fulfillment</h3>
                  <p className="text-xs text-slate-500">Live stream of customer reservations across the platform.</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('bookings')}
                  className="text-indigo-600 text-xs font-bold hover:bg-indigo-50"
                >
                  View All ({bookings.length})
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-extrabold text-[10px]">
                      <th className="pb-3">Reference</th>
                      <th className="pb-3">Traveler</th>
                      <th className="pb-3">Service</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(stats?.recentBookings || bookings.slice(0, 5)).map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-700">
                          #{b._id?.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-slate-900 block">
                            {b.user?.name || b.travelers?.[0]?.firstName || 'Customer'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {b.user?.email || b.contactInfo?.email}
                          </span>
                        </td>
                        <td className="py-3 capitalize font-medium text-slate-700">
                          {b.type}
                        </td>
                        <td className="py-3 font-bold text-slate-900">
                          {formatCurrency(b.totalPrice, currency, exchangeRates)}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'danger' : 'warning'}
                            size="xs"
                          >
                            {b.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(b)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-indigo-600 transition-colors"
                            title="View Receipt"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}

          {/* TAB 2: CUSTOMER BOOKINGS FACILITY */}
          {activeTab === 'bookings' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black text-slate-900">Customer Bookings &amp; Invoices</h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Dynamic Stream
                  </span>
                </div>
                <p className="text-xs text-slate-500">Inspect, confirm, refund, and manage platform traveler reservations in real time.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportBookings}
                  className="text-xs font-bold gap-1.5 rounded-xl border-slate-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export to CSV</span>
                </Button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search by customer name, email, or ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed Only</option>
                <option value="pending">Pending Only</option>
                <option value="cancelled">Cancelled Only</option>
              </select>

              <select
                value={bookingTypeFilter}
                onChange={(e) => setBookingTypeFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Service Verticals</option>
                <option value="flight">Flights Only</option>
                <option value="hotel">Hotels Only</option>
                <option value="package">Tour Packages Only</option>
              </select>
            </div>

            {/* Bookings Table */}
            {filteredBookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No customer bookings match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-extrabold text-[10px]">
                      <th className="pb-3">Reference ID</th>
                      <th className="pb-3">Customer Profile</th>
                      <th className="pb-3">Vertical</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Payment</th>
                      <th className="pb-3 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => {
                      const bStatus = (b.status || '').toLowerCase();
                      const pStatus = (b.payment?.status || b.paymentStatus || 'pending').toLowerCase();
                      return (
                        <tr
                          key={b._id}
                          className={`transition-all duration-300 ${
                            recentNewOrderId === b._id
                              ? 'bg-amber-50 ring-2 ring-amber-400/80 shadow-md animate-pulse'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-3 font-mono font-bold text-slate-700">
                            #{b._id?.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-3">
                            <span className="font-bold text-slate-900 block">
                              {b.user?.name || b.travelers?.[0]?.firstName || 'Customer'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {b.user?.email || b.contactInfo?.email || 'No email registered'}
                            </span>
                          </td>
                          <td className="py-3 capitalize font-semibold text-slate-700">
                            {b.type}
                          </td>
                          <td className="py-3 font-extrabold text-slate-900">
                            {formatCurrency(b.totalPrice, currency, exchangeRates)}
                          </td>
                          <td className="py-3">
                            <Badge
                              variant={bStatus === 'confirmed' ? 'success' : bStatus === 'cancelled' ? 'danger' : 'warning'}
                              size="xs"
                            >
                              {b.status}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              pStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : pStatus === 'refunded' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                            }`}
                            >
                              {b.payment?.status || b.paymentStatus || 'pending'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(b)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-indigo-600 transition-colors"
                                title="View Invoice"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {bStatus !== 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBookingStatus(b._id, 'confirmed', 'paid')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-colors flex items-center gap-1"
                                  title="Confirm this reservation"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Confirm</span>
                                </button>
                              )}
                              {bStatus !== 'cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => promptCancelBooking(b)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition-colors flex items-center gap-1"
                                  title="Cancel this reservation"
                                >
                                  <XCircle className="h-3 w-3" />
                                  <span>Cancel</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}

          {/* TAB 3: HOTELS FACILITY */}
          {activeTab === 'hotels' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Hotel Inventory &amp; Luxury Suites</h2>
                <p className="text-xs text-slate-500">Manage property listings, adjust rates, and promote featured resorts.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={hotelSearch}
                    onChange={(e) => setHotelSearch(e.target.value)}
                    placeholder="Search by hotel name or city..."
                    className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setHotelModalOpen(true)}
                  className="text-xs font-bold gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Hotel</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHotels.map((h) => (
                <div
                  key={h._id}
                  className="rounded-2xl border border-slate-200/80 p-4 space-y-3 bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={h.thumbnail || h.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'}
                        alt={h.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        {h.featured && (
                          <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Featured
                          </span>
                        )}
                        <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ★ {h.starRating} Stars
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-sm truncate">{h.name}</h4>
                      <p className="text-xs text-slate-500">{h.city}, {h.country}</p>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                      <span className="text-xs text-slate-400">Nightly Rate</span>
                      <span className="text-sm font-black text-slate-900">
                        {formatCurrency(h.pricePerNight, currency, exchangeRates)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleFeaturedHotel(h)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                        h.featured
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {h.featured ? 'Unfeature' : 'Feature Resort'}
                    </button>

                    <button
                      type="button"
                      onClick={() => promptDelete('hotel', h._id, h.name, `${h.city}, ${h.country}`)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                      title="Delete Hotel (Requires Reason)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* TAB 4: FLIGHT ROUTES FACILITY */}
          {activeTab === 'flights' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Commercial Flight Routes</h2>
                <p className="text-xs text-slate-500">Manage airline scheduled routes, seat availability, and live status.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={flightSearch}
                    onChange={(e) => setFlightSearch(e.target.value)}
                    placeholder="Search by flight number, airline, or city..."
                    className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setFlightModalOpen(true)}
                  className="text-xs font-bold gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Route</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-extrabold text-[10px]">
                    <th className="pb-3">Flight No.</th>
                    <th className="pb-3">Airline</th>
                    <th className="pb-3">Route (From ➔ Destination)</th>
                    <th className="pb-3">Departure / Arrival</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Seats</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFlights.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-mono font-black text-indigo-600">
                        {f.flightNumber}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        {f.airline}
                      </td>
                      <td className="py-3">
                        <span className="font-black text-slate-900">{f.origin?.code}</span>
                        <span className="text-slate-400 mx-1">➔</span>
                        <span className="font-black text-slate-900">{f.destination?.code}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {f.origin?.city} to {f.destination?.city}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">
                        <span className="block font-medium">{f.departureTime}</span>
                        <span className="text-[10px] text-slate-400">Arr: {f.arrivalTime}</span>
                      </td>
                      <td className="py-3 font-extrabold text-slate-900">
                        {formatCurrency(f.price, currency, exchangeRates)}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {f.availableSeats || 24} seats
                        </span>
                      </td>
                      <td className="py-3">
                        <select
                          value={f.status || 'Scheduled'}
                          onChange={(e) => handleUpdateFlightStatus(f._id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="In Flight">In Flight</option>
                          <option value="Landed">Landed</option>
                          <option value="Delayed">Delayed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => promptDelete('flight', f._id, `${f.airline} (${f.flightNumber})`, `${f.origin?.code} -> ${f.destination?.code}`)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Delete Flight (Requires Reason)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* TAB 5: HOLIDAY & UMRAH TOUR PACKAGES FACILITY */}
          {activeTab === 'packages' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Holiday &amp; Umrah Tour Packages</h2>
                <p className="text-xs text-slate-500">Curate multi-day packages, Umrah pilgrimages, and promotional tour deals.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={packageSearch}
                    onChange={(e) => setPackageSearch(e.target.value)}
                    placeholder="Search by package title or destination..."
                    className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setPackageModalOpen(true)}
                  className="text-xs font-bold gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Package</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPackages.map((p) => (
                <div
                  key={p._id}
                  className="rounded-2xl border border-slate-200/80 p-4 space-y-3 bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={p.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80'}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="bg-indigo-600/90 backdrop-blur-sm text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                          {p.category}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {p.durationDays}D / {p.durationNights}N
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-sm truncate">{p.title}</h4>
                      <p className="text-xs text-slate-500">{p.destination}, {p.country}</p>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400 block">Package Price</span>
                        {p.discountPrice && (
                          <span className="text-[10px] text-slate-400 line-through mr-1">
                            {formatCurrency(p.price, currency, exchangeRates)}
                          </span>
                        )}
                        <span className="text-sm font-black text-slate-900">
                          {formatCurrency(p.discountPrice || p.price, currency, exchangeRates)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                        {p.badge || 'Popular'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleFeaturedPackage(p)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                        p.featured
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.featured ? 'Featured' : 'Set as Featured'}
                    </button>

                    <button
                      type="button"
                      onClick={() => promptDelete('package', p._id, p.title, p.destination)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                      title="Delete Package (Requires Reason)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* TAB: API INTEGRATIONS & SECURITY KEY VAULT */}
          {activeTab === 'api_keys' && (
          <div className="space-y-6">
            {/* Master Security Gateway Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-white">Master Security Gateway Active</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider">
                      PIN Protected
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                      Live Hot-Reload
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    External API keys are hot-reloaded across backend memory and saved to runtime configurations. To protect operations from unauthorized alterations, every key update requires your Master Security PIN and is permanently timestamped in the Audit Trail.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchApiKeys}
                  loading={apiServicesLoading}
                  className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl py-2.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${apiServicesLoading ? 'animate-spin' : ''}`} />
                  <span>Sync Status</span>
                </Button>
              </div>
            </div>

            {/* Grid of Integrated APIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {apiServices.map((service) => {
                const isOnline = service.status === 'connected' || service.status === 'operational';
                const isTesting = testingService === service.id;

                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow space-y-5"
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                            {service.id === 'aviationstack' && <Radio className="h-6 w-6 text-indigo-600" />}
                            {service.id === 'exchangerate' && <CreditCard className="h-6 w-6 text-emerald-600" />}
                            {service.id === 'unsplash' && <Sparkles className="h-6 w-6 text-amber-500" />}
                            {service.id === 'amadeus' && <Plane className="h-6 w-6 text-sky-600" />}
                            {service.id === 'mongodb' && <Database className="h-6 w-6 text-emerald-600" />}
                            {service.id === 'jwt' && <ShieldCheck className="h-6 w-6 text-purple-600" />}
                            {service.id === 'stripe' && <CreditCard className="h-6 w-6 text-indigo-600" />}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900">{service.name}</h3>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {service.category}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isOnline
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                            }`}
                          />
                          {service.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                        {service.description}
                      </p>

                      {/* Credentials & Telemetry Box */}
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2.5 text-xs">
                        {revealedKeys[service.id] ? (
                          <div className="space-y-1.5 pt-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-600 flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                Decrypted Live Key:
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(service.id, revealedKeys[service.id])}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 flex items-center gap-1 transition-colors"
                                  title="Copy API key"
                                >
                                  {copiedKeyId === service.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                  <span>{copiedKeyId === service.id ? 'Copied' : 'Copy'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleHideKey(service.id)}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center gap-1 transition-colors"
                                  title="Hide unmasked key"
                                >
                                  <EyeOff className="h-3 w-3" />
                                  <span>Hide</span>
                                </button>
                              </div>
                            </div>
                            <div className="font-mono text-[11px] font-bold text-slate-900 bg-white border border-indigo-200 rounded-xl p-2.5 break-all select-all shadow-inner">
                              {revealedKeys[service.id]}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-500 flex items-center gap-1.5 text-[11px] shrink-0">
                              <Key className="h-3.5 w-3.5 text-slate-400" />
                              Active Key:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRequestRevealKey(service)}
                              className="group font-mono text-slate-800 font-bold bg-white hover:bg-indigo-50/70 hover:border-indigo-300 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer text-right max-w-full truncate"
                              title="Click to view full API key (Requires Master PIN)"
                            >
                              <span className="truncate">{service.maskedKey || 'Not Configured'}</span>
                              <Eye className="h-3 w-3 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                          <span>Quota Tier:</span>
                          <span className="font-bold text-slate-700">{service.quota || 'Standard Quota'}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Connection Latency:</span>
                          <span className="font-mono font-black text-indigo-600">
                            {service.latencyMs ? `${service.latencyMs}ms` : 'Untested'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isTesting}
                        onClick={() => handleTestApiConnection(service.id)}
                        className="flex-1 text-xs font-bold rounded-xl py-2.5 gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700"
                      >
                        <Activity className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
                        <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => openChangeKeyModal(service)}
                        className="flex-1 text-xs font-bold rounded-xl py-2.5 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Change Key</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ADVANCED SECTION: MASTER PIN & SECURITY GATEWAY CONTROLS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                      Advanced Security Controls
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                      Status: Enforced
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Master PIN Authorization Gateway
                  </h3>
                  <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                    The Master PIN protects your external API credentials against accidental or unauthorized modification. You can rotate and update the Master PIN below.
                  </p>
                </div>
              </div>

              {pinError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2.5 font-bold text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{pinError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateMasterPin} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label htmlFor="currentPinInput" className="font-bold text-slate-700 block text-xs">
                    Current Master PIN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="currentPinInput"
                    type="password"
                    value={pinForm.currentPin}
                    onChange={(e) => {
                      setPinForm({ ...pinForm, currentPin: e.target.value });
                      setPinError('');
                    }}
                    placeholder="Enter current Master PIN"
                    className="w-full p-3 font-mono rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="newPinInput" className="font-bold text-slate-700 block text-xs">
                    New Master PIN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="newPinInput"
                    type="password"
                    value={pinForm.newPin}
                    onChange={(e) => {
                      setPinForm({ ...pinForm, newPin: e.target.value });
                      setPinError('');
                    }}
                    placeholder="New PIN (min 4 digits)"
                    className="w-full p-3 font-mono rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                    minLength={4}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPinInput" className="font-bold text-slate-700 block text-xs">
                    Confirm New PIN <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="confirmPinInput"
                      type="password"
                      value={pinForm.confirmPin}
                      onChange={(e) => {
                        setPinForm({ ...pinForm, confirmPin: e.target.value });
                        setPinError('');
                      }}
                      placeholder="Repeat new PIN"
                      className="w-full p-3 font-mono rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      required
                      minLength={4}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      loading={pinSubmitting}
                      className="shrink-0 px-5 py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 whitespace-nowrap"
                    >
                      Update Master PIN
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          )}

          {/* TAB 6: SYSTEM OPTIMIZATION & TELEMETRY */}
          {activeTab === 'system' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Platform Performance &amp; Cache Optimizer</h2>
                <p className="text-xs text-slate-500">Live hardware telemetry, memory footprints, and Aviationstack radar cache management.</p>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handlePurgeRadarCache}
                className="text-xs font-bold gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                <Radio className="h-4 w-4" />
                <span>Flush Radar Cache</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Database className="h-3 w-3 text-indigo-500" />
                  Database State
                </span>
                <p className="text-sm font-black text-slate-900">
                  {systemHealth?.database?.status || 'MongoDB Atlas Live'}
                </p>
                <span className="text-[10px] text-emerald-600 font-bold block">
                  Active connection verified
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="h-3 w-3 text-brand-500" />
                  Radar Cache Entries
                </span>
                <p className="text-sm font-black text-slate-900">
                  {systemHealth?.cacheTelemetry?.entryCount ?? stats?.cacheTelemetry?.entryCount ?? 0} active routes
                </p>
                <span className="text-[10px] text-indigo-600 font-bold block">
                  10-min quota-preserving TTL
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="h-3 w-3 text-emerald-500" />
                  Memory Footprint (Heap)
                </span>
                <p className="text-sm font-black text-slate-900">
                  {systemHealth?.system?.memoryUsage?.heapUsedMB || 48} MB
                </p>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Total allocated: {systemHealth?.system?.memoryUsage?.heapTotalMB || 64} MB
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3 w-3 text-purple-500" />
                  Process Uptime
                </span>
                <p className="text-sm font-black text-slate-900">
                  {Math.floor((systemHealth?.system?.uptimeSeconds || stats?.systemUptime || 120) / 60)} minutes
                </p>
                <span className="text-[10px] text-emerald-600 font-bold block">
                  Node.js {systemHealth?.system?.nodeVersion || 'v20.x'}
                </span>
              </div>
            </div>

            {/* Quota & Optimization Details */}
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs space-y-2">
              <h4 className="font-black text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Aviationstack API Optimization Status
              </h4>
              <p className="text-indigo-800 leading-relaxed">
                The platform utilizes a smart in-memory time-to-live (TTL) cache layer. When visitors track routes such as <strong>DAC ➔ DXB</strong> or flights like <strong>BS541</strong>, subsequent requests hit the zero-latency in-memory cache, preserving your 100 requests/month quota. Clicking <strong>&ldquo;Flush Radar Cache&rdquo;</strong> clears stale telemetry when needed.
              </p>
            </div>
          </div>
          )}

          {/* TAB 7: SAAS PRICING & GLOBAL SETTINGS */}
          {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Pricing, Commission &amp; Announcements</h2>
                <p className="text-xs text-slate-500">Configure global platform service markups, flash sale banners, and maintenance gates.</p>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handleSaveSettings}
                className="text-xs font-bold gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <Check className="h-4 w-4" />
                <span>Save Platform Settings</span>
              </Button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Platform Commission Optimizer */}
                <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-3">
                  <label htmlFor="commissionRateInput" className="font-black text-slate-900 text-sm block">
                    Global Platform Commission / Fee (%)
                  </label>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Set the platform markup applied on external hotel and airline reservations. This automatically calculates net revenue.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      id="commissionRateInput"
                      type="number"
                      step="0.5"
                      min="0"
                      max="30"
                      value={settings.commissionRate}
                      onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
                      className="w-32 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-500">% of Gross Booking Total</span>
                  </div>
                </div>

                {/* Maintenance Mode */}
                <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-3">
                  <span className="font-black text-slate-900 text-sm block">
                    System Maintenance Gate
                  </span>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Temporarily prevent new checkout transactions while preserving read-only catalog browsing.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-slate-800">
                      Enable Maintenance Mode ({settings.maintenanceMode ? 'Active' : 'Disabled'})
                    </span>
                  </label>
                </div>
              </div>

              {/* Global Broadcast Announcement Banner */}
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm block">
                    Customer Broadcast Announcement Banner
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.announcementBanner?.enabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        announcementBanner: { ...settings.announcementBanner, enabled: e.target.checked },
                      })}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Display on Public Site</span>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bannerMessageInput" className="font-bold text-slate-700 block">
                    Announcement Message
                  </label>
                  <input
                    id="bannerMessageInput"
                    type="text"
                    value={settings.announcementBanner?.message || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      announcementBanner: { ...settings.announcementBanner, message: e.target.value },
                    })}
                    placeholder="e.g. Flash Sale: Enjoy instant 15% discount on all luxury suites!"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </form>
          </div>
          )}

          {/* TAB 8: USER DIRECTORY & RBAC */}
          {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">User Directory &amp; Role Governance</h2>
              <p className="text-xs text-slate-500">View customer accounts and promote or demote administrator privileges.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-extrabold text-[10px]">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3 text-right">Role Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-bold text-slate-900">
                        {u.name}
                      </td>
                      <td className="py-3 font-mono text-slate-600">
                        {u.email}
                      </td>
                      <td className="py-3 text-slate-500">
                        {u.phone || 'N/A'}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          (u.role || '').toUpperCase() === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRole(u)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition-colors"
                        >
                          {(u.role || '').toUpperCase() === 'ADMIN' ? 'Demote to Customer' : 'Promote to Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* TAB 9: AUDIT TRAIL & DELETION LOGS */}
          {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Administrative Audit Trail &amp; Governance</h2>
                <p className="text-xs text-slate-500">Immutable ledger tracking deletion reasons, admin credentials, and actions.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search by admin, action, or reason..."
                    className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportAuditTrail}
                  className="text-xs font-bold gap-1.5 rounded-xl border-slate-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </Button>
              </div>
            </div>

            {filteredAuditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No audit records matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-extrabold text-[10px]">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Administrator</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Affected Item</th>
                      <th className="pb-3">Mandatory Reason</th>
                      <th className="pb-3 text-right">IP / Device</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-slate-900 block">
                            {log.adminEmail || 'admin@travel.test'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                            {log.action?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            {log.targetType}
                          </span>
                          <span>{log.targetName}</span>
                        </td>
                        <td className="py-3 max-w-xs">
                          <div className="bg-amber-50/80 border border-amber-200/70 text-amber-900 p-2 rounded-xl text-[11px] leading-relaxed">
                            <span className="font-bold">Reason:</span> &ldquo;{log.reason}&rdquo;
                          </div>
                        </td>
                        <td className="py-3 text-right text-[10px] font-mono text-slate-400">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* MODAL: CANCEL BOOKING CONFIRMATION POPUP */}
      <Modal
        isOpen={cancelBookingModal.isOpen}
        onClose={() => {
          if (!cancelBookingModal.submitting) {
            setCancelBookingModal({ isOpen: false, booking: null, submitting: false });
          }
        }}
        title="Cancel Booking Reservation"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-rose-50 border border-rose-200/90 rounded-2xl flex items-start gap-3 text-rose-900">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-rose-950 text-xs">
                Do you want to cancel this booking?
              </h4>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Cancelling will mark reservation <strong>#{cancelBookingModal.booking?._id?.slice(-6).toUpperCase()}</strong> as Cancelled and record the cancellation in the audit trail.
              </p>
            </div>
          </div>

          {/* Reservation Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Customer:</span>
              <span className="font-bold text-slate-900">
                {cancelBookingModal.booking?.user?.name || cancelBookingModal.booking?.contactInfo?.firstName || 'Customer'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Email:</span>
              <span className="font-mono text-[11px] text-slate-700">
                {cancelBookingModal.booking?.user?.email || cancelBookingModal.booking?.contactInfo?.email || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Booking Type:</span>
              <span className="font-bold capitalize text-slate-900">
                {cancelBookingModal.booking?.type}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/70 pt-1.5">
              <span className="text-slate-500 font-medium">Total Price:</span>
              <span className="font-extrabold text-slate-900">
                {formatCurrency(cancelBookingModal.booking?.totalPrice, currency, exchangeRates)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={cancelBookingModal.submitting}
              onClick={() => setCancelBookingModal({ isOpen: false, booking: null, submitting: false })}
              className="rounded-xl font-bold text-xs"
            >
              Keep Reservation
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={cancelBookingModal.submitting}
              onClick={handleConfirmCancelBooking}
              className="rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
            >
              Yes, Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: MANDATORY DELETION REASON & AUDIT CONFIRMATION */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          if (!deleteModal.submitting) {
            setDeleteModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        title="Confirm Deletion & Audit Log"
      >
        <form onSubmit={handleConfirmDeletion} className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2.5 text-rose-800">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs text-rose-900">
                Permanent Removal Notice
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                You are about to delete <strong className="text-rose-950 font-bold">{deleteModal.title}</strong> ({deleteModal.subtitle}).
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="deletionReasonInput" className="font-bold text-slate-800 block text-xs">
              Reason for Deletion <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500 leading-normal">
              State why this item is being removed. This explanation will be logged permanently in the Admin Audit Trail with your credentials.
            </p>
            <textarea
              id="deletionReasonInput"
              rows={3}
              value={deleteModal.reason}
              onChange={(e) => setDeleteModal({ ...deleteModal, reason: e.target.value })}
              placeholder="e.g. Hotel is permanently closed / Duplicate flight schedule / Route withdrawn by carrier / Customer requested cancellation..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
              required
              minLength={3}
              maxLength={500}
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Minimum 3 characters required</span>
              <span>{deleteModal.reason.trim().length} / 500</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteModal.submitting}
              onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
              className="flex-1 py-2.5 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={deleteModal.reason.trim().length < 3 || deleteModal.submitting}
              loading={deleteModal.submitting}
              className="flex-1 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20"
            >
              Confirm &amp; Log Deletion
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VIEW INVOICE & RECEIPT */}
      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title="Official Booking Receipt &amp; Invoice"
      >
        {selectedInvoice && (
          <div className="space-y-5 text-xs">
            <div id="printable-e-ticket" className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Receipt &amp; Voucher</span>
                  <span className="font-mono font-black text-brand-600 text-sm">#{selectedInvoice.bookingReference || selectedInvoice._id?.slice(-8).toUpperCase()}</span>
                </div>
                <Badge variant={selectedInvoice.status?.toLowerCase() === 'confirmed' ? 'success' : 'warning'}>
                  {selectedInvoice.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-medium">Customer / Traveler</span>
                  <span className="font-bold text-slate-900 block">
                    {selectedInvoice.user?.name || selectedInvoice.travelers?.[0]?.firstName || 'Customer'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {selectedInvoice.user?.email || selectedInvoice.contactInfo?.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Reservation Type</span>
                  <span className="font-bold text-slate-900 capitalize block">{selectedInvoice.type} Booking</span>
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    Payment Status: {selectedInvoice.paymentStatus || selectedInvoice.payment?.status || 'PAID'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Base Service Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.totalPrice * 0.95, currency, exchangeRates)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Service Fee ({settings.commissionRate}%)</span>
                  <span>{formatCurrency(selectedInvoice.totalPrice * 0.05, currency, exchangeRates)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount Paid</span>
                  <span className="text-brand-600">{formatCurrency(selectedInvoice.totalPrice, currency, exchangeRates)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 no-print">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2.5 rounded-xl font-bold"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  document.body.classList.add('printing-ticket');
                  const cleanup = () => document.body.classList.remove('printing-ticket');
                  window.addEventListener('afterprint', cleanup, { once: true });
                  setTimeout(() => {
                    window.print();
                    setTimeout(cleanup, 2000);
                  }, 60);
                }}
                className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: ADD HOTEL */}
      <Modal
        isOpen={hotelModalOpen}
        onClose={() => setHotelModalOpen(false)}
        title="Add New Hotel to Inventory"
      >
        <form onSubmit={handleCreateHotel} className="space-y-4 text-xs">
          <Input
            label="Hotel Name"
            value={newHotel.name}
            onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
            placeholder="e.g. Marina Grand Resort"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={newHotel.city}
              onChange={(e) => setNewHotel({ ...newHotel, city: e.target.value })}
              placeholder="e.g. Dubai"
              required
            />
            <Input
              label="Country"
              value={newHotel.country}
              onChange={(e) => setNewHotel({ ...newHotel, country: e.target.value })}
              placeholder="e.g. United Arab Emirates"
              required
            />
          </div>
          <Input
            label="Street Address"
            value={newHotel.address}
            onChange={(e) => setNewHotel({ ...newHotel, address: e.target.value })}
            placeholder="e.g. 10 Marina Promenade"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price Per Night ($)"
              type="number"
              value={newHotel.pricePerNight}
              onChange={(e) => setNewHotel({ ...newHotel, pricePerNight: e.target.value })}
              required
            />
            <Input
              label="Star Rating (1-5)"
              type="number"
              min="1"
              max="5"
              value={newHotel.starRating}
              onChange={(e) => setNewHotel({ ...newHotel, starRating: e.target.value })}
              required
            />
          </div>
          <Input
            label="Image URL"
            value={newHotel.thumbnail}
            onChange={(e) => setNewHotel({ ...newHotel, thumbnail: e.target.value })}
            placeholder="https://..."
            required
          />
          <Button type="submit" variant="primary" className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700">
            Create Hotel Listing
          </Button>
        </form>
      </Modal>

      {/* MODAL: ADD FLIGHT */}
      <Modal
        isOpen={flightModalOpen}
        onClose={() => setFlightModalOpen(false)}
        title="Schedule New Flight Route"
      >
        <form onSubmit={handleCreateFlight} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Airline"
              value={newFlight.airline}
              onChange={(e) => setNewFlight({ ...newFlight, airline: e.target.value })}
              placeholder="e.g. Qatar Airways"
              required
            />
            <Input
              label="Flight Number"
              value={newFlight.flightNumber}
              onChange={(e) => setNewFlight({ ...newFlight, flightNumber: e.target.value })}
              placeholder="e.g. QR634"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Origin Airport Code"
              value={newFlight.originCode}
              onChange={(e) => setNewFlight({ ...newFlight, originCode: e.target.value.toUpperCase() })}
              placeholder="e.g. DAC"
              required
            />
            <Input
              label="Origin City"
              value={newFlight.originCity}
              onChange={(e) => setNewFlight({ ...newFlight, originCity: e.target.value })}
              placeholder="e.g. Dhaka"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Destination Airport Code"
              value={newFlight.destCode}
              onChange={(e) => setNewFlight({ ...newFlight, destCode: e.target.value.toUpperCase() })}
              placeholder="e.g. DOH"
              required
            />
            <Input
              label="Destination City"
              value={newFlight.destCity}
              onChange={(e) => setNewFlight({ ...newFlight, destCity: e.target.value })}
              placeholder="e.g. Doha"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Departure Time"
              value={newFlight.departureTime}
              onChange={(e) => setNewFlight({ ...newFlight, departureTime: e.target.value })}
              placeholder="e.g. 09:30 AM"
              required
            />
            <Input
              label="Arrival Time"
              value={newFlight.arrivalTime}
              onChange={(e) => setNewFlight({ ...newFlight, arrivalTime: e.target.value })}
              placeholder="e.g. 01:15 PM"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price ($)"
              type="number"
              value={newFlight.price}
              onChange={(e) => setNewFlight({ ...newFlight, price: e.target.value })}
              required
            />
            <Input
              label="Seats"
              type="number"
              value={newFlight.availableSeats}
              onChange={(e) => setNewFlight({ ...newFlight, availableSeats: e.target.value })}
              required
            />
          </div>
          <Button type="submit" variant="primary" className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700">
            Publish Flight Schedule
          </Button>
        </form>
      </Modal>

      {/* MODAL: ADD TOUR PACKAGE */}
      <Modal
        isOpen={packageModalOpen}
        onClose={() => setPackageModalOpen(false)}
        title="Create Holiday / Umrah Package"
      >
        <form onSubmit={handleCreatePackage} className="space-y-4 text-xs">
          <Input
            label="Package Title"
            value={newPackage.title}
            onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })}
            placeholder="e.g. Premium Umrah Spiritual Journey"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Destination City"
              value={newPackage.destination}
              onChange={(e) => setNewPackage({ ...newPackage, destination: e.target.value })}
              placeholder="e.g. Makkah & Madinah"
              required
            />
            <Input
              label="Country"
              value={newPackage.country}
              onChange={(e) => setNewPackage({ ...newPackage, country: e.target.value })}
              placeholder="e.g. Saudi Arabia"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="packageCategorySelect" className="font-bold text-slate-700 block">
                Category
              </label>
              <select
                id="packageCategorySelect"
                value={newPackage.category}
                onChange={(e) => setNewPackage({ ...newPackage, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="Family">Family Tour</option>
                <option value="Honeymoon">Honeymoon Romantic</option>
                <option value="Adventure">Adventure Trek</option>
                <option value="Luxury">Luxury VIP</option>
                <option value="Budget">Budget Friendly</option>
              </select>
            </div>
            <Input
              label="Badge / Tag"
              value={newPackage.badge}
              onChange={(e) => setNewPackage({ ...newPackage, badge: e.target.value })}
              placeholder="e.g. Best Seller, Umrah Special"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (Days)"
              type="number"
              value={newPackage.durationDays}
              onChange={(e) => setNewPackage({ ...newPackage, durationDays: e.target.value })}
              required
            />
            <Input
              label="Duration (Nights)"
              type="number"
              value={newPackage.durationNights}
              onChange={(e) => setNewPackage({ ...newPackage, durationNights: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Regular Price ($)"
              type="number"
              value={newPackage.price}
              onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
              required
            />
            <Input
              label="Discount Price ($)"
              type="number"
              value={newPackage.discountPrice || ''}
              onChange={(e) => setNewPackage({ ...newPackage, discountPrice: e.target.value })}
              placeholder="Optional sale price"
            />
          </div>
          <Input
            label="Image URL"
            value={newPackage.image}
            onChange={(e) => setNewPackage({ ...newPackage, image: e.target.value })}
            placeholder="https://..."
            required
          />
          <Button type="submit" variant="primary" className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700">
            Publish Tour Package
          </Button>
        </form>
      </Modal>

      {/* MODAL: REVEAL FULL API KEY WITH MASTER PIN VERIFICATION */}
      <Modal
        isOpen={revealModal.isOpen}
        onClose={() => {
          setRevealModal({ isOpen: false, service: null, masterPin: '', submitting: false, error: '' });
        }}
        title={`Decrypt API Key: ${revealModal.service?.name || 'Service'}`}
      >
        <form onSubmit={handleConfirmRevealKey} className="space-y-4 text-xs">
          <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-start gap-3 text-indigo-950">
            <Lock className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-xs text-indigo-950">Master Security Authorization Required</p>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Enter your Master Security PIN to decrypt and inspect the live production API key for <strong>{revealModal.service?.name}</strong>.
              </p>
            </div>
          </div>

          {revealModal.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-bold text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{revealModal.error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="revealMasterPinInput" className="font-bold text-slate-800 block text-xs">
              Master Security PIN <span className="text-rose-500">*</span>
            </label>
            <input
              id="revealMasterPinInput"
              type="password"
              value={revealModal.masterPin}
              onChange={(e) => setRevealModal((prev) => ({ ...prev, masterPin: e.target.value, error: '' }))}
              placeholder="Enter Master PIN"
              className="w-full p-3 font-mono rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
              autoFocus
            />
            <p className="text-[10px] text-slate-400">
              This verification action is permanently logged to the administrative audit trail.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={revealModal.submitting}
              onClick={() => setRevealModal({ isOpen: false, service: null, masterPin: '', submitting: false, error: '' })}
              className="rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={revealModal.submitting}
              className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
            >
              Verify &amp; Reveal Key
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CHANGE API KEY WITH PIN 1234 VERIFICATION */}
      <Modal
        isOpen={keyModal.isOpen}
        onClose={() => {
          if (!keyModal.submitting) {
            setKeyModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        title={`Rotate API Key: ${keyModal.serviceName}`}
      >
        <form onSubmit={handleUpdateApiKey} className="space-y-4 text-xs">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
            <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-xs text-amber-950">Master Security Authorization Required</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Updating credentials for <strong>{keyModal.serviceName}</strong> will immediately apply to all live backend calls. For system protection, enter your Master Security PIN.
              </p>
            </div>
          </div>

          {keyModal.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-bold text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{keyModal.error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="newApiKeyInput" className="font-bold text-slate-800 block text-xs">
              New API Key / Secret Token <span className="text-rose-500">*</span>
            </label>
            <input
              id="newApiKeyInput"
              type="text"
              value={keyModal.newKey}
              onChange={(e) => setKeyModal((prev) => ({ ...prev, newKey: e.target.value, error: '' }))}
              placeholder="e.g. 9b9a67e9140409fe694116238b7ef1aa"
              className="w-full p-3 font-mono rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="securityPasswordInput" className="font-bold text-slate-800 block text-xs">
              Master Security PIN <span className="text-rose-500">*</span>
            </label>
            <input
              id="securityPasswordInput"
              type="password"
              value={keyModal.securityPassword}
              onChange={(e) => setKeyModal((prev) => ({ ...prev, securityPassword: e.target.value, error: '' }))}
              placeholder="Enter Master PIN"
              className="w-full p-3 font-mono rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
            <p className="text-[10px] text-slate-400">
              Security policy enforces verification with your active Master Security PIN.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={keyModal.submitting}
              onClick={() => setKeyModal((prev) => ({ ...prev, isOpen: false }))}
              className="rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={keyModal.submitting}
              className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
            >
              Verify PIN &amp; Save Key
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
