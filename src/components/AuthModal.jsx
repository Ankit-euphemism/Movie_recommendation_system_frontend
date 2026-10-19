import { useState } from 'react';
import { Film, LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export default function AuthModal({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Client-side regex validation
  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (!emailRegex.test(emailInput.trim())) {
      return 'Please enter a valid email address (e.g. name@example.com).';
    }
    if (isSignup && !passwordRegex.test(passwordInput)) {
      return 'Password must be at least 8 characters long and contain both letters and numbers.';
    }
    if (!passwordInput || passwordInput.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationMsg = validateInputs();
    if (validationMsg) {
      setAuthError(validationMsg);
      return;
    }

    setAuthError('');
    setLoading(true);

    try {
      await onLoginSuccess({
        email: emailInput.trim().toLowerCase(),
        password: passwordInput,
        isSignup,
      });
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-netflixDark flex items-center justify-center p-4 relative overflow-hidden text-white">
      {/* Background Cinematic Atmosphere */}
      <div className="absolute inset-0 bg-radial-gradient from-netflixRed/10 via-transparent to-black pointer-events-none" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-netflixRed/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Auth Card */}
      <div className="bg-netflixCard p-8 sm:p-10 rounded-2xl border border-gray-800 max-w-md w-full shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-netflixRed p-2 rounded-xl shadow-lg shadow-netflixRed/30">
              <Film className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wider">
              FLIX<span className="text-netflixRed">RECOMMEND</span>
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Next-Generation Hybrid Movie Intelligence Platform
          </p>
        </div>

        {/* Portal Title */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">
            {isSignup
              ? 'Create New Viewer Profile'
              : 'Sign In for Personalized Feed'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Experience TF-IDF & SVD collaborative hybrid suggestions
          </p>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="bg-red-950/60 border border-red-500/50 text-red-200 text-xs p-3 rounded-xl flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="viewer@example.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-netflixRed"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-netflixRed"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
            {isSignup && (
              <span className="text-[10px] text-gray-500 mt-1 block">
                At least 8 characters with at least one letter and one number.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02] bg-netflixRed hover:bg-red-700 text-white shadow-netflixRed/30"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setAuthError('');
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
