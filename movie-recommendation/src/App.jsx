import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Film, LogIn, LogOut, Heart, Sparkles, Loader, Mail, Sliders } from 'lucide-react';
import OnboardingModal from './components/OnboardingModal';

const API_BASE_URL = "http://localhost:8000/api";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`
});

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
  const [popupError, setPopupError] = useState('');        // Popup validation error

  // Streaming state
  const [streamingMovie, setStreamingMovie] = useState(null);
  const [streamingUrl, setStreamingUrl] = useState('');

  // Fetch Hybrid Recommendations from FastAPI
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

  // Logout Action
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

  // 1. On mount/reload: if we have a stored email+token, load profile from backend
  useEffect(() => {
    if (!userEmail) return;

    const initializeUser = async () => {
      setLoading(true);
      try {
        const likes = JSON.parse(localStorage.getItem('likedMovies') || '[]');
        setLikedMovies(likes);

        // Check for Cold-Start (fewer than 3 movies liked)
        if (likes.length < 3) {
          setShowOnboarding(true);
        } else {
          await fetchRecommendations(userEmail);
        }
      } catch (err) {
        console.error("Authentication Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [userEmail]);

  // Client-side input validation
   const validateInputs = () =>{
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailRegex.test(emailInput.trim())){
    return "Invalid email format. Please enter a valid email address.";
  }
  return null;
} 

  // 3. Signup Action
  const handleSignup = async (e) => {
    e.preventDefault();
    const validationMsg = validateInputs();
    if(validationMsg){
      setPopupError(validationMsg);
      setTimeout(() => 
        setPopupError(''), 4000);
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/signup`, {
        email: emailInput.trim().toLowerCase(),
        password: passwordInput
      });
      localStorage.setItem('accessToken', res.data.access_token);
      localStorage.setItem('userEmail', res.data.email);
      localStorage.setItem('likedMovies', JSON.stringify(res.data.liked_movies));
      setUserEmail(res.data.email);
      setLikedMovies(res.data.liked_movies);
      setShowOnboarding(true);
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Signup failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 4. Login Action
  const handleLogin = async (e) => {
    e.preventDefault();
    const validationMsg = validateInputs();
    if (validationMsg) {
      setPopupError(validationMsg);
      setTimeout(() => setPopupError(''), 4000);
      return;
    }

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
      await fetchRecommendations(email); 
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
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

  // 6. Complete Onboarding
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
      const updatedLikes = [...new Set([...likedMovies, ...selectedStarterMovies])];
      setLikedMovies(updatedLikes);
      localStorage.setItem('likedMovies', JSON.stringify(updatedLikes));
      await fetchRecommendations(userEmail);
    } catch (err) {
      console.error("Onboarding submission failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // RENDER: LOGIN VIEW
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-netflixDark flex items-center justify-center p-4 relative">
        
        {/* Popup Validation Error Toast */}
        {popupError && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 border border-red-500 text-white px-6 py-3 rounded shadow-2xl flex items-center gap-4 transition-opacity duration-300">
            <span className="text-sm font-medium">{popupError}</span>
            <button onClick={() => setPopupError('')} className="text-xl font-bold hover:text-gray-300 leading-none">×</button>
          </div>
        )}

        <div className="bg-netflixCard p-8 rounded-xl border border-gray-800 max-w-md w-full shadow-2xl mt-4">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Film className="w-8 h-8 text-netflixRed" />
            <h1 className="text-2xl font-bold text-netflixRed tracking-wider">FLIXRECOMMEND</h1>
          </div>
          <h2 className="text-lg font-semibold text-center mb-6">
            {isSignup ? 'Create Your Account' : 'Sign In for Personalized Feeds'}
          </h2>
          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
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
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">PASSWORD</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-netflixRed"
              />
            </div>
            {authError && <p className="text-sm text-red-400">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-netflixRed hover:bg-red-700 text-white font-bold py-2.5 rounded transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> {isSignup ? 'Create Account' : 'Enter Streaming Portal'}
            </button>
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setAuthError(''); }}
              className="w-full text-sm text-gray-400 hover:text-white"
            >
              {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RENDER: MAIN DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-netflixDark text-white">
      {/* Cold-Start Modal */}
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

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
                className="bg-netflixCard rounded-lg overflow-hidden border border-gray-800 p-4 flex flex-col justify-between hover:border-netflixRed/40 transition-all shadow-lg"
              >
                <div>
                  <div className="h-32 bg-gray-900 rounded mb-3 flex items-center justify-center relative">
                    <Film className="w-8 h-8 text-gray-700" />
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

                  <button
                    onClick={() => toggleLike(movie.title)}
                    className={`w-full text-xs py-2 rounded font-medium flex items-center justify-center gap-1 transition-colors mt-2 ${
                      likedMovies.includes(movie.title)
                        ? 'bg-netflixRed text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${likedMovies.includes(movie.title) ? 'fill-current' : ''}`} />
                    {likedMovies.includes(movie.title) ? 'Liked' : 'Like'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}