import { useState } from 'react';
import {
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';

export const AdminLoginForm = () => {
  const { login } = useAuth();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [retrievedQuestion, setRetrievedQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(email.trim(), password);
      const role = (res.user?.role || '').toUpperCase();
      if (role !== 'ADMIN') {
        setError('Access denied. This account does not possess system administrator privileges.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message
          || err.message
          || 'Authentication failed. Please verify your credentials and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setEmail('admin@travel.test');
    setPassword('Admin123!');
    setLoading(true);
    setError('');

    try {
      await login('admin@travel.test', 'Admin123!');
    } catch (err) {
      setError(
        err.response?.data?.message
          || err.message
          || 'Could not sign in with demo admin credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLookupQuestion = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your administrator email address.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await api.post('/auth/forgot-password/question', {
        email: forgotEmail.trim(),
      });
      if (res.data?.success && res.data?.securityQuestion) {
        setRetrievedQuestion(res.data.securityQuestion);
        setForgotStep(2);
      } else {
        setForgotError('No security question is configured for this account.');
      }
    } catch (err) {
      setForgotError(
        err.response?.data?.message || 'Could not find a registered security question for this email.',
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotAnswer.trim()) {
      setForgotError('Please provide your secret security answer.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters in length.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('New password and confirmation do not match.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await api.post('/auth/forgot-password/reset', {
        email: forgotEmail.trim(),
        securityAnswer: forgotAnswer.trim(),
        newPassword,
      });

      if (res.data?.success) {
        setForgotSuccess('Password reset successfully! You can now sign in with your new password.');
        setEmail(forgotEmail.trim());
        setPassword('');
        setIsForgotPassword(false);
        setForgotStep(1);
        setForgotAnswer('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Password reset request failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
            {isForgotPassword ? <Key className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 px-3 py-1 bg-indigo-50 rounded-full">
              System Administration
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isForgotPassword ? 'Reset Admin Password' : 'Administrator Sign In'}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              {isForgotPassword
                ? 'Answer your secret security question to restore administrative access.'
                : 'Sign in with your authorized credentials to manage bookings, inventory, and operations.'}
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {forgotSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{forgotSuccess}</span>
          </div>
        )}

        {/* Forgot Password Flow */}
        {isForgotPassword ? (
          <div className="space-y-4">
            {forgotError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleLookupQuestion} className="space-y-4">
                <Input
                  label="Administrator Email Address"
                  type="email"
                  placeholder="admin@travel.test"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (forgotError) setForgotError('');
                  }}
                  icon={Mail}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-xs text-white shadow-lg shadow-indigo-600/20"
                  loading={forgotLoading}
                >
                  Retrieve Security Question
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-1 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                    Your Registered Question
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    {retrievedQuestion}
                  </p>
                </div>

                <Input
                  label="Secret Security Answer"
                  type="text"
                  placeholder="Enter your security answer"
                  value={forgotAnswer}
                  onChange={(e) => {
                    setForgotAnswer(e.target.value);
                    if (forgotError) setForgotError('');
                  }}
                  icon={HelpCircle}
                  required
                />

                <Input
                  label="New Password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (forgotError) setForgotError('');
                  }}
                  icon={Lock}
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    if (forgotError) setForgotError('');
                  }}
                  icon={Lock}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-xs text-white shadow-lg shadow-indigo-600/20"
                  loading={forgotLoading}
                >
                  Confirm &amp; Reset Password
                </Button>
              </form>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotError('');
                  setForgotStep(1);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Sign In Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Input
              label="Administrator Email"
              type="email"
              placeholder="admin@travel.test"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              icon={Mail}
              required
            />

            <div>
              <div className="flex items-center justify-between pb-1">
                <label
                  htmlFor="admin-password-input"
                  className="block text-xs font-semibold text-slate-700 tracking-wide"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setForgotEmail(email);
                    setForgotError('');
                    setError('');
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-xs text-white shadow-lg shadow-indigo-600/20"
              loading={loading}
            >
              Sign In to Admin Portal
            </Button>

            {/* Quick 1-click Demo Fill */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={handleDemoAdminLogin}
                className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                1-Click Demo Login (<span className="text-indigo-600 font-mono">admin@travel.test</span>)
              </button>
            </div>
          </form>
        )}

        <div className="pt-1 text-center">
          <p className="text-[10px] text-slate-400">
            Protected by 256-bit JWT authentication &amp; role-based access control.
          </p>
        </div>
      </div>
    </div>
  );
};
