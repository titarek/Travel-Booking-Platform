import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Key,
  Mail,
  Phone,
  Smartphone,
  ShieldCheck,
  Send,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  BookmarkCheck,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { WalletTopUpModal } from '../components/wallet/WalletTopUpModal.jsx';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    user,
    openAuthModal,
    updateProfile,
    changePhone,
    sendPhoneOtp,
    changeEmail,
    changePassword,
    walletBalance,
    walletTransactions,
    fetchWallet,
    currency,
    exchangeRates,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'wallet'
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Profile Information form
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    securityQuestion: '',
    securityAnswer: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Change Phone form (Login & Security tab)
  const [phoneForm, setPhoneForm] = useState({
    newPhone: '',
    currentPassword: '',
  });
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [testOtpLoading, setTestOtpLoading] = useState(false);

  // Change Email form
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: '',
  });
  const [emailLoading, setEmailLoading] = useState(false);

  // Change Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync wallet data on mount
  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const userId = user?.id || user?._id;
  const userName = user?.name;
  const userPhone = user?.phone;
  const userSecQ = user?.securityQuestion;

  // Sync personal form state only when personal identity fields change
  useEffect(() => {
    if (userId) {
      setProfileForm((prev) => ({
        ...prev,
        name: userName || '',
        phone: userPhone || '',
        securityQuestion: userSecQ || 'What is your favorite travel destination?',
      }));
    }
  }, [userId, userName, userPhone, userSecQ]);

  const showNotification = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md w-full shadow-sm space-y-4">
          <div className="h-14 w-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
            <User className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Sign in to manage your account</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please log in to update your personal details, change email, configure account passwords, and view your digital wallet.
          </p>
          <Button
            variant="primary"
            onClick={() => openAuthModal('login')}
            className="w-full font-bold"
          >
            Sign In / Register
          </Button>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setStatusMessage(null);
    try {
      await updateProfile(profileForm);
      showNotification('Profile details updated successfully! Mobile contact and preferences saved.');
      setProfileForm((prev) => ({ ...prev, securityAnswer: '' }));
    } catch (err) {
      showNotification(err.message || 'Failed to update profile.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePhone = async (e) => {
    e.preventDefault();
    const candidatePhone = phoneForm.newPhone.trim();
    if (!candidatePhone || candidatePhone.length < 5) {
      showNotification('Please enter a valid phone number (at least 5 digits).', 'error');
      return;
    }
    setPhoneLoading(true);
    setStatusMessage(null);
    try {
      await changePhone(candidatePhone, phoneForm.currentPassword);
      showNotification(`Mobile contact number successfully updated to ${candidatePhone}!`);
      setPhoneForm({ newPhone: '', currentPassword: '' });
    } catch (err) {
      showNotification(err.message || 'Could not update phone number.', 'error');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSendTestOtp = async () => {
    const targetPhone = phoneForm.newPhone.trim() || user.phone;
    if (!targetPhone || targetPhone.length < 5) {
      showNotification('Please enter a phone number in the field above to receive a test SMS OTP.', 'error');
      return;
    }
    setTestOtpLoading(true);
    setStatusMessage(null);
    try {
      const res = await sendPhoneOtp(targetPhone);
      showNotification(`✓ Test OTP SMS sent via OTP.dev to ${res.maskedPhone || targetPhone}! (Test Code: ${res.testOtpCode || 'Dispatched via SMS'})`);
    } catch (err) {
      showNotification(err.message || 'Failed to send test OTP via SMS.', 'error');
    } finally {
      setTestOtpLoading(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.newEmail) {
      showNotification('Please enter a valid new email address.', 'error');
      return;
    }
    if (!emailForm.currentPassword) {
      showNotification('Current password is required to verify email update.', 'error');
      return;
    }

    setEmailLoading(true);
    setStatusMessage(null);
    try {
      await changeEmail(emailForm.newEmail, emailForm.currentPassword);
      showNotification(`Account email successfully changed to ${emailForm.newEmail}!`);
      setEmailForm({ newEmail: '', currentPassword: '' });
    } catch (err) {
      showNotification(err.message || 'Could not update email address.', 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('New password and confirmation do not match.', 'error');
      return;
    }

    setPasswordLoading(true);
    setStatusMessage(null);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showNotification('Your password has been changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showNotification(err.message || 'Could not change password. Please check your current password.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl uppercase shadow-md shadow-brand-500/25">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user.name}</h1>
                <Badge variant="primary" size="sm">Verified Traveler</Badge>
                {user.role?.toUpperCase() === 'ADMIN' && (
                  <Badge variant="accent" size="sm">Admin</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{user.email}</span>
                {user.phone && (
                  <>
                    <span>•</span>
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Wallet Pill */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/90 p-3.5 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-700 block tracking-wider">
                Digital Wallet Balance
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 block">
                {formatCurrency(walletBalance, currency, exchangeRates)}
              </span>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsTopUpOpen(true)}
              className="ml-2 font-bold text-xs gap-1 py-1.5 px-3"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Top Up</span>
            </Button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
            statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
          >
            {statusMessage.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Main Content Layout with Sidebar Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="space-y-2">
            {[
              { id: 'profile', label: 'Personal Information', icon: User, desc: 'Name, contact, security recovery' },
              { id: 'security', label: 'Login & Security', icon: Key, desc: 'Phone, email, and password changes' },
              { id: 'wallet', label: 'Travel Wallet & Ledger', icon: Wallet, desc: 'Balance and deposit records' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-brand-50 border-brand-300 text-brand-800 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{tab.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{tab.desc}</span>
                    </div>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => navigate('/my-bookings')}
              className="w-full text-left p-4 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                  <BookmarkCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">My Bookings</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">View tickets &amp; reservations</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="md:col-span-3 space-y-6">
            {/* TAB 1: Personal Information */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500">
                    Update your primary personal contact details and security recovery preferences.
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Legal Name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />

                    <div className="space-y-1">
                      <Input
                        label="Mobile Contact Number"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+880 1700 000000"
                      />
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 pl-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-600 inline shrink-0" />
                        <span>Used for 2FA Booking SMS OTP verifications via OTP.dev</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-brand-600" />
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        Security Recovery Question
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Used to safely verify your identity if you ever lose your account password.
                    </p>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Security Question</label>
                      <select
                        value={profileForm.securityQuestion}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, securityQuestion: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-semibold bg-white focus:outline-none focus:border-brand-500"
                      >
                        <option value="What is your favorite travel destination?">What is your favorite travel destination?</option>
                        <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                        <option value="What was the name of your first childhood pet?">What was the name of your first childhood pet?</option>
                        <option value="What was the model of your first car?">What was the model of your first car?</option>
                      </select>
                    </div>

                    <Input
                      label="Update Security Answer (Leave blank to keep existing)"
                      type="password"
                      value={profileForm.securityAnswer}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, securityAnswer: e.target.value }))}
                      placeholder="Enter new secret answer..."
                    />
                  </div>

                  <div className="pt-3 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={profileLoading}
                      className="font-bold px-6"
                    >
                      Save Profile Changes
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: Login & Security */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Change Mobile Contact Number Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">Change Mobile Contact Number</h3>
                        <Badge variant="success" className="text-[10px]">2FA Active</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Update your registered mobile phone number used for SMS OTP authorization during flight &amp; hotel purchases.
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Smartphone className="h-4 w-4" />
                    </div>
                  </div>

                  <form onSubmit={handleChangePhone} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-500">Current Registered Number:</span>
                        <strong className="text-slate-900 font-bold">{user.phone || 'Not Configured Yet'}</strong>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> OTP.dev 2FA Connected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="New Mobile Phone Number"
                          type="tel"
                          value={phoneForm.newPhone}
                          onChange={(e) => setPhoneForm((prev) => ({ ...prev, newPhone: e.target.value }))}
                          placeholder="+880 1712 000000"
                          required
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          International format recommended (e.g. +88017... or 017...)
                        </span>
                      </div>

                      <Input
                        label="Current Password (Optional Verification)"
                        type="password"
                        value={phoneForm.currentPassword}
                        onChange={(e) => setPhoneForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password (optional)..."
                      />
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleSendTestOtp}
                        loading={testOtpLoading}
                        className="text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 gap-1.5 w-full sm:w-auto"
                      >
                        <Send className="h-3.5 w-3.5 text-brand-600" />
                        <span>Send Test SMS OTP to this Phone</span>
                      </Button>

                      <Button
                        type="submit"
                        variant="primary"
                        loading={phoneLoading}
                        className="font-bold px-6 w-full sm:w-auto"
                      >
                        Update Phone Number
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Change Email Address Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Change Account Email</h3>
                      <p className="text-xs text-slate-500">
                        Update the email address associated with your travel bookings and e-tickets.
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </div>
                  </div>

                  <form onSubmit={handleChangeEmail} className="space-y-4">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <span className="text-slate-500">Current Registered Email:</span>
                      <strong className="text-slate-900">{user.email}</strong>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="New Email Address"
                        type="email"
                        value={emailForm.newEmail}
                        onChange={(e) => setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))}
                        placeholder="new.email@example.com"
                        required
                      />

                      <Input
                        label="Current Password (Verification)"
                        type="password"
                        value={emailForm.currentPassword}
                        onChange={(e) => setEmailForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password..."
                        required
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={emailLoading}
                        className="font-bold px-6"
                      >
                        Update Email Address
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Change Password Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Change Account Password</h3>
                      <p className="text-xs text-slate-500">
                        Ensure your account stays secure by choosing a strong, unique password.
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Key className="h-4 w-4" />
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter your current password..."
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="New Password (min 6 characters)"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Create new strong password..."
                        required
                      />

                      <Input
                        label="Confirm New Password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Re-type new password..."
                        required
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={passwordLoading}
                        className="font-bold px-6"
                      >
                        Update Password
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 3: Travel Digital Wallet & Ledger */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                {/* Wallet Balance Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-sky-600 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-1 relative z-10">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-white/80 block">
                      Travel Digital Wallet Balance
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-white block">
                      {formatCurrency(walletBalance, currency, exchangeRates)}
                    </span>
                    <p className="text-xs text-white/80 pt-1">
                      1-click instant checkout enabled on all Flights, Hotels, and Holiday Packages.
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setIsTopUpOpen(true)}
                      className="bg-white text-brand-600 hover:bg-slate-100 font-black text-xs gap-1.5 px-5 py-2.5 shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Top Up Wallet</span>
                    </Button>
                    <button
                      type="button"
                      onClick={fetchWallet}
                      className="h-10 w-10 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                      title="Refresh Balance"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Transaction Ledger Table */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Wallet Statement &amp; Transaction History
                      </h4>
                      <p className="text-xs text-slate-500">
                        Complete transparent record of deposits, booking deductions, and cancellation refunds.
                      </p>
                    </div>
                  </div>

                  {walletTransactions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                      <Clock className="h-8 w-8 mx-auto text-slate-300" />
                      <p>No wallet transactions found. Make a deposit or book a trip to see records here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Description / Reference</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                            <th className="py-2.5 px-3 text-right">Balance After</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {walletTransactions.map((tx) => {
                            const isCredit = tx.type === 'TOPUP' || tx.type === 'REFUND_BOOKING';
                            return (
                              <tr key={tx._id || tx.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-3 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                                  {formatDate(tx.createdAt || new Date())}
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                    tx.type === 'TOPUP'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : tx.type === 'REFUND_BOOKING'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-100 text-slate-700'
                                  }`}
                                  >
                                    {tx.type === 'TOPUP'
                                      ? 'Deposit'
                                      : tx.type === 'REFUND_BOOKING'
                                        ? 'Refund'
                                        : 'Payment'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="font-semibold text-slate-900 block">{tx.description}</span>
                                  {tx.referenceId && (
                                    <span className="text-[10px] text-slate-400 font-mono block">Ref: {tx.referenceId}</span>
                                  )}
                                </td>
                                <td className={`py-3 px-3 text-right font-black ${
                                  isCredit ? 'text-emerald-600' : 'text-slate-900'
                                }`}
                                >
                                  {isCredit ? '+' : '-'}{formatCurrency(tx.amount, currency, exchangeRates)}
                                </td>
                                <td className="py-3 px-3 text-right font-extrabold text-slate-700">
                                  {formatCurrency(tx.balanceAfter, currency, exchangeRates)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top-Up Modal */}
      <WalletTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={() => {
          fetchWallet();
          showNotification('Deposit completed successfully!');
        }}
      />
    </div>
  );
};
