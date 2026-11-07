import { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';

const SECURITY_QUESTIONS = [
  'What is your favorite travel destination?',
  'What was the name of your first childhood pet?',
  'In what city or town was your first school?',
  'What was the make or model of your first car or bike?',
  'What is your mother\'s maiden name?',
  'What was your childhood nickname?',
];

export const AuthModal = () => {
  const {
    authModalState,
    closeAuthModal,
    openAuthModal,
    login,
    register,
  } = useAuth();

  const isAdminView = true;
  const isLogin = true;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    securityQuestion: 'What is your favorite travel destination?',
    securityAnswer: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password recovery state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [retrievedQuestion, setRetrievedQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleClose = () => {
    setIsForgotPassword(false);
    setForgotStep(1);
    setForgotError('');
    setForgotSuccessMsg('');
    closeAuthModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setFormData({
      name: '',
      email: demoEmail,
      password: demoPassword,
      phone: '',
      securityQuestion: 'What is your favorite travel destination?',
      securityAnswer: '',
    });
    setLoading(true);
    setError('');
    try {
      await login(demoEmail, demoPassword);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Demo login failed. Make sure backend is running and seeded.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLookupSecurityQuestion = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
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
        setForgotError('No security question found for this account.');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Could not find security question.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotAnswer.trim()) {
      setForgotError('Please provide your security answer.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
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
        setForgotSuccessMsg('Password has been reset successfully! You can now sign in.');
        setFormData((prev) => ({ ...prev, email: forgotEmail.trim(), password: '' }));
        setForgotStep(1);
        setForgotAnswer('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  let modalTitle = 'Create Your Travel Account';
  if (isForgotPassword) {
    modalTitle = 'Recover Account Password';
  } else if (isAdminView) {
    modalTitle = 'Administrator Sign In';
  } else if (isLogin) {
    modalTitle = 'Sign In to Travel';
  }

  return (
    <Modal
      isOpen={authModalState.isOpen}
      onClose={handleClose}
      title={modalTitle}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Admin context security notice */}
        {isAdminView && !isForgotPassword && (
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center gap-3 text-xs text-indigo-950">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-indigo-950">Admin Authentication Required</h4>
              <p className="text-[11px] text-indigo-700">
                Sign in with authorized administrator credentials to manage platform operations.
              </p>
            </div>
          </div>
        )}

        {/* Fluent Quick Demo Login Options - Hidden on Admin view and Forgot Password */}
        {!isAdminView && isLogin && !isForgotPassword && (
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('customer@travel.test', 'Password123!')}
              className="w-full p-3 bg-gradient-to-r from-sky-50 to-blue-50/60 hover:from-sky-100 hover:to-blue-100/80 border border-sky-200/80 rounded-2xl text-left transition-all group flex items-center justify-between shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-sm shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 group-hover:text-brand-600 transition-colors">
                    Explore with Demo Account
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Instant 1-click preview of bookings &amp; reservations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-black text-brand-600 shrink-0">
                <span>Continue</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {/* Forgot Password Flow */}
        {isForgotPassword ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotError('');
                  setForgotSuccessMsg('');
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Sign In</span>
              </button>
            </div>

            {forgotSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="space-y-1">
                  <p className="font-bold">{forgotSuccessMsg}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      openAuthModal('login');
                    }}
                    className="font-bold underline text-emerald-900 hover:text-emerald-950 block pt-1"
                  >
                    Click here to Sign In now &rarr;
                  </button>
                </div>
              </div>
            )}

            {forgotError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleLookupSecurityQuestion} className="space-y-3.5">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your registered account email address to retrieve your secret security question.
                </p>
                <Input
                  label="Registered Email Address"
                  type="email"
                  name="forgotEmail"
                  placeholder="e.g. name@example.com"
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
                  className="w-full py-3 rounded-xl font-bold shadow-md shadow-brand-500/20"
                  loading={forgotLoading}
                >
                  Find Security Question
                </Button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div className="p-3.5 bg-sky-50/80 border border-sky-100 rounded-2xl space-y-1 text-xs">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-sky-700 block">
                    Security Question for {forgotEmail}:
                  </span>
                  <p className="font-extrabold text-slate-900 text-xs">
                    &ldquo;{retrievedQuestion}&rdquo;
                  </p>
                </div>

                <Input
                  label="Your Secret Answer"
                  type="text"
                  name="forgotAnswer"
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
                  name="newPassword"
                  placeholder="At least 6 characters"
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
                  name="confirmNewPassword"
                  placeholder="Repeat new password"
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
                  className="w-full py-3 rounded-xl font-bold shadow-md shadow-brand-500/20"
                  loading={forgotLoading}
                >
                  Verify Answer &amp; Reset Password
                </Button>
              </form>
            )}
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Tab switch - Hidden in Admin context so only Login is allowed */}
            {!isAdminView && (
              <div className="flex border-b border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    openAuthModal('login');
                    setError('');
                  }}
                  className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-wider text-center border-b-2 transition-all ${
                    isLogin
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-slate-400 hover:text-slate-800'
                  }`}
                >
                  Or Sign In with Credentials
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openAuthModal('register');
                    setError('');
                  }}
                  className={`flex-1 py-2 text-xs font-extrabold uppercase tracking-wider text-center border-b-2 transition-all ${
                    !isLogin
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-slate-400 hover:text-slate-800'
                  }`}
                >
                  Create New Account
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isAdminView && !isLogin && (
                <Input
                  label="Full Name"
                  name="name"
                  placeholder="e.g. Tanvir Ahmed"
                  value={formData.name}
                  onChange={handleChange}
                  icon={UserIcon}
                  required
                />
              )}

              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="e.g. name@example.com"
                value={formData.email}
                onChange={handleChange}
                icon={Mail}
                required
              />

              <div>
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  icon={Lock}
                  required
                />
                {!isAdminView && isLogin && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotStep(1);
                        setForgotEmail(formData.email || '');
                        setError('');
                        setForgotError('');
                        setForgotSuccessMsg('');
                      }}
                      className="text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {!isAdminView && !isLogin && (
                <>
                  <Input
                    label="Phone Number (Optional)"
                    type="tel"
                    name="phone"
                    placeholder="+880 1700 000000"
                    value={formData.phone}
                    onChange={handleChange}
                    icon={Phone}
                  />

                  <div className="space-y-1">
                    <label htmlFor="regSecurityQuestionSelect" className="font-bold text-slate-700 block text-xs">
                      Security Question (for password recovery) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="regSecurityQuestionSelect"
                      name="securityQuestion"
                      value={formData.securityQuestion}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
                      required
                    >
                      {SECURITY_QUESTIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Secret Answer"
                    name="securityAnswer"
                    placeholder="Your secret answer (case-insensitive)"
                    value={formData.securityAnswer}
                    onChange={handleChange}
                    icon={HelpCircle}
                    required
                  />
                </>
              )}

              <Button
                type="submit"
                variant="primary"
                className={`w-full py-3 rounded-xl font-bold shadow-md ${
                  isAdminView
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 text-white'
                    : 'shadow-brand-500/20'
                }`}
                loading={loading}
              >
                {isAdminView ? 'Sign In to Admin' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-[11px] text-slate-400">
          {isAdminView
            ? 'Unauthorized administrator access attempts are strictly monitored and logged.'
            : 'By signing in, you agree to Travel\'s Terms of Service and Privacy Policy.'}
        </p>
      </div>
    </Modal>
  );
};
