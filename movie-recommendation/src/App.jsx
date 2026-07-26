import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Film, LogIn, LogOut, Heart, Sparkles, Loader, Mail, Sliders, Play, Lock, UserPlus, AlertCircle } from 'lucide-react';
import OnboardingModal from './components/OnboardingModal';
import VideoPlayerModal from './components/VideoPlayerModal';

const API_BASE_URL = "http://localhost:8000/api";

// Helper: get auth headers from stored JWT token
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function App() {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [likedMovies, setLikedMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userStatus, setUserStatus] = useState('');

  // Auth state
  const [isSignup, setIsSignup] = useState(false);        // Toggle between login/signup
  const [authError, setAuthError] = useState('');          // Auth error message
  const [authLoading, setAuthLoading] = useState(false);   // Auth button loading

  // Streaming state
  const [streamingMovie, setStreamingMovie] = useState(null);
  const [streamingUrl, setStreamingUrl] = useState('');

  // 1. On mount/reload: if we have a stored email+token, load profile from backend
  useEffect(() => {
    if (!userEmail) return;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // No token stored — force re-login
      handleLogout();
      return;
    }

    const initializeUser = async () => {
      setLoading(true);
      try {
        // Re-login to refresh likes from DB (token is still valid)
        // We use a lightweight profile fetch via the like list from the stored token
        const storedLikes = JSON.parse(localStorage.getItem('likedMovies') || '[]');
        setLikedMovies(storedLikes);

        if (storedLikes.length < 3) {
          setShowOnboarding(true);
        } else {
          await fetchRecommendations(userEmail);
        }
      } catch (err) {
        console.error("Initialization Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [userEmail]);

  // 2. Fetch Hybrid Recommendations from FastAPI
  const fetchRecommendations = async (email) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/hybrid-recommendations`, {
        params: { email, top_n: 6 },
        headers: getAuthHeaders()
      });
      setRecommendations(res.data.recommendations);
      setUserStatus(res.data.user_status);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Signup Action
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/signup`, {
        email: emailInput.trim().toLowerCase(),
        password: passwordInput
      });
      const { access_token, email, liked_movies } = res.data;

      // Store auth data
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('likedMovies', JSON.stringify(liked_movies));

      setUserEmail(email);
      setLikedMovies(liked_movies);
      setShowOnboarding(true); // New user → cold-start onboarding
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 4. Login Action
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, {
        email: emailInput.trim().toLowerCase(),
        password: passwordInput
      });
      const { access_token, email, liked_movies } = res.data;

      // Store auth data
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('likedMovies', JSON.stringify(liked_movies));

      setUserEmail(email);
      setLikedMovies(liked_movies);

      if (liked_movies.length < 3) {
        setShowOnboarding(true);
      } else {
        await fetchRecommendations(email);
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 5. Logout Action
  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('likedMovies');
    setUserEmail('');
    setLikedMovies([]);
    setRecommendations([]);
    setShowOnboarding(false);
    setStreamingMovie(null);
    setStreamingUrl('');
    setAuthError('');
    setPasswordInput('');
  };

  // 6. Toggle Like Status
  const toggleLike = async (movieTitle) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/like`, {
        email: userEmail,
        movie_title: movieTitle
      }, { headers: getAuthHeaders() });
      setLikedMovies(res.data.liked_movies);
      localStorage.setItem('likedMovies', JSON.stringify(res.data.liked_movies));
      await fetchRecommendations(userEmail);
    } catch (err) {
      console.error("Like Action Failed:", err);
    }
  };

  // 7. Complete Onboarding
  const handleOnboardingComplete = async (selectedStarterMovies) => {
    setShowOnboarding(false);
    setLoading(true);
    try {
      for (const title of selectedStarterMovies) {
        await axios.post(`${API_BASE_URL}/like`, {
          email: userEmail,
          movie_title: title
        }, { headers: getAuthHeaders() });
      }
      // Fetch the updated like list
      const loginRes = await axios.post(`${API_BASE_URL}/login`, {
        email: userEmail,
        password: passwordInput || '__skip__'  // Re-auth not needed; likes are already persisted
      });
      // If re-login fails (password not stored), use the last like response
      setLikedMovies(loginRes.data.liked_movies);
      localStorage.setItem('likedMovies', JSON.stringify(loginRes.data.liked_movies));
      await fetchRecommendations(userEmail);
    } catch (err) {
      // Fallback: just fetch recommendations with whatever likes we have
      console.error("Onboarding submission note:", err);
      await fetchRecommendations(userEmail);
    } finally {
      setLoading(false);
    }
  };

  // 8. Open Stream for a Movie
  const openStream = async (movie) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/stream/${movie.id}`, {
        headers: getAuthHeaders()
      });
      setStreamingUrl(res.data.video_url);
      setStreamingMovie(movie);
    } catch (err) {
      console.error("Failed to fetch stream URL:", err);
    }
  };

  // 9. Handle Watch Event Callback (implicit feedback from video player)
  const handleWatchEvent = (updatedLikes) => {
    setLikedMovies(updatedLikes);
    localStorage.setItem('likedMovies', JSON.stringify(updatedLikes));
    fetchRecommendations(userEmail);
  };

  // ==========================================
  // RENDER: AUTH VIEW (Login / Signup)
  // ==========================================
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-netflixDark flex items-center justify-center p-4">
        <div className="bg-netflixCard p-8 rounded-xl border border-gray-800 max-w-md w-full shadow-2xl">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Film className="w-8 h-8 text-netflixRed" />
            <h1 className="text-2xl font-bold text-netflixRed tracking-wider">FLIXRECOMMEND</h1>
          </div>
          <h2 className="text-lg font-semibold text-center mb-6">
            {isSignup ? 'Create Your Account' : 'Sign In to Your Account'}
          </h2>

          {/* Auth Error Alert */}
          {authError && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-700/50 text-red-300 text-xs px-4 py-2.5 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">EMAIL ADDRESS</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-netflixRed"
                />
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">PASSWORD</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-netflixRed"
                />
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-netflixRed hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded transition-colors flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : isSignup ? (
                <><UserPlus className="w-4 h-4" /> Create Account</>
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>

          {/* Toggle Login / Signup */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => { setIsSignup(!isSignup); setAuthError(''); }}
                className="text-netflixRed hover:text-red-400 font-semibold ml-1 transition-colors"
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN DASHBOARD VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-netflixDark text-white">
      {/* Cold-Start Modal */}
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      {/* Video Player Modal */}
      {streamingMovie && streamingUrl && (
        <VideoPlayerModal
          movie={streamingMovie}
          videoUrl={streamingUrl}
          userEmail={userEmail}
          onClose={() => { setStreamingMovie(null); setStreamingUrl(''); }}
          onWatchEvent={handleWatchEvent}
        />
      )}

      {/* Navigation Header */}
      <nav className="flex items-center justify-between px-8 py-4 bg-black/80 border-b border-gray-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <Film className="w-8 h-8 text-netflixRed" />
          <span className="text-xl font-bold text-netflixRed uppercase tracking-wider">FLIXRECOMMEND</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">
            Account: <strong className="text-white">{userEmail}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1.5 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="px-8 py-8 max-w-7xl mx-auto">
        {/* User Profile Bar */}
        <div className="mb-8 p-4 bg-netflixCard rounded-lg border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-4 h-4 text-netflixRed" />
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                User Taste Profile ({likedMovies.length} Saved)
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {likedMovies.map((title) => (
                <span
                  key={title}
                  className="bg-netflixRed/20 text-netflixRed border border-netflixRed/40 text-xs px-3 py-1 rounded-full flex items-center gap-1"
                >
                  {title}
                  <button onClick={() => toggleLike(title)} className="ml-1 hover:text-white">✕</button>
                </span>
              ))}
            </div>
          </div>
          <span className="text-xs bg-gray-900 border border-gray-700 px-3 py-1.5 rounded text-gray-300 font-mono">
            Mode: <strong className="text-netflixRed">{userStatus}</strong>
          </span>
        </div>

        {/* Section Title */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="text-netflixRed" /> Hybrid Recommendations for You
        </h2>

        {/* Recommendations Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-netflixRed" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {recommendations.map((movie) => (
              <div
                key={movie.id}
                className="bg-netflixCard rounded-lg overflow-hidden border border-gray-800 p-4 flex flex-col justify-between hover:border-netflixRed/40 transition-all shadow-lg group"
              >
                <div>
                  <div
                    className="h-32 bg-gray-900 rounded mb-3 flex items-center justify-center relative cursor-pointer overflow-hidden"
                    onClick={() => openStream(movie)}
                  >
                    <Film className="w-8 h-8 text-gray-700 group-hover:opacity-30 transition-opacity" />
                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="bg-netflixRed/90 rounded-full p-3 shadow-lg hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>
                    <span className="absolute top-2 right-2 bg-black/80 text-[10px] px-2 py-0.5 rounded text-netflixRed font-mono font-bold border border-netflixRed/30">
                      {Math.round(movie.hybrid_score * 100)}% Match
                    </span>
                  </div>
                  <h3 className="font-bold text-sm line-clamp-1">{movie.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{movie.genres}</p>
                </div>

                {/* Score Breakdown (Approach A vs Approach B) */}
                <div className="mt-4 pt-3 border-t border-gray-800 space-y-1">
                  <div className="text-[10px] text-gray-400 space-y-1 bg-gray-900/60 p-2 rounded">
                    <div className="flex justify-between">
                      <span>Content (A):</span>
                      <span className="text-netflixRed">{Math.round((movie.content_score || 0) * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Collaborative (B):</span>
                      <span className="text-blue-400">{Math.round((movie.collab_score || 0) * 100)}%</span>
                    </div>
                  </div>

                  {/* Action Buttons: Watch + Like */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openStream(movie)}
                      className="flex-1 text-xs py-2 rounded font-medium flex items-center justify-center gap-1 transition-colors bg-netflixRed hover:bg-red-700 text-white"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Watch
                    </button>
                    <button
                      onClick={() => toggleLike(movie.title)}
                      className={`flex-1 text-xs py-2 rounded font-medium flex items-center justify-center gap-1 transition-colors ${
                        likedMovies.includes(movie.title)
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedMovies.includes(movie.title) ? 'fill-current' : ''}`} />
                      {likedMovies.includes(movie.title) ? 'Liked' : 'Like'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}