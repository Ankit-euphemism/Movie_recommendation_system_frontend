import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Sparkles, Loader, Film, Heart, Sliders, Search, ArrowRight } from 'lucide-react';

import initialMoviesCatalog from './data/movies.json';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import MovieCard from './components/MovieCard';
import MovieDetailModal from './components/MovieDetailModal';
import SearchDiscovery from './components/SearchDiscovery';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import TasteProfileModal from './components/TasteProfileModal';
import OnboardingModal from './components/OnboardingModal';
import VideoPlayerModal from './components/VideoPlayerModal';

import {
  generateClientRecommendations,
  DEMO_STREAMS,
} from './utils/recommender';

const API_BASE_URL = "http://localhost:8000/api";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`
});

export default function App() {
  // Master Catalog (supports admin additions/modifications)
  const [allMovies, setAllMovies] = useState(() => {
    try {
      const saved = localStorage.getItem('customMoviesCatalog');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not load custom catalog:", e);
    }
    return initialMoviesCatalog;
  });

  // User & Auth State
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
  const [likedMovies, setLikedMovies] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('likedMovies') || '[]');
    } catch (err) {
      void err;
      return [];
    }
  });

  // Users Directory (for Admin Inspection)
  const [usersList, setUsersList] = useState(() => {
    try {
      const saved = localStorage.getItem('usersDirectory');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      void err;
    }
    return [
      { email: 'admin@flixrecommend.com', role: 'admin', liked_movies: ['Avatar', 'Inception', 'Interstellar'] },
      { email: 'demo.user@flixrecommend.com', role: 'user', liked_movies: ['The Dark Knight Rises', 'Gladiator'] },
    ];
  });

  // Active View State: 'home' | 'search' | 'admin'
  const [activeView, setActiveView] = useState(() => {
    const role = localStorage.getItem('userRole') || 'user';
    return role === 'admin' ? 'admin' : 'home';
  });

  // Search Query for quick jump
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Recommender State
  const [recommendations, setRecommendations] = useState([]);
  const [hybridWeight, setHybridWeight] = useState(0.5); // Approach A vs Approach B
  const [loading, setLoading] = useState(false);
  const [userStatus, setUserStatus] = useState('Hybrid Active');

  // Modals & Overlays
  const [selectedMovieForDetail, setSelectedMovieForDetail] = useState(null);
  const [streamingMovie, setStreamingMovie] = useState(null);
  const [streamingUrl, setStreamingUrl] = useState('');
  const [showTasteProfile, setShowTasteProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // System Audit Logs
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('systemAuditLogs');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      void err;
    }
    return [
      { time: '14:00', message: 'Recommender engine initialized with TF-IDF similarity & SVD model.' },
      { time: '14:05', message: 'Catalog loaded with 4,803 TMDB movies.' },
    ];
  });

  const addAuditLog = useCallback((message) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setAuditLogs((prev) => {
      const next = [{ time: timeStr, message }, ...prev.slice(0, 49)];
      try {
        localStorage.setItem('systemAuditLogs', JSON.stringify(next));
      } catch (err) {
        void err;
      }
      return next;
    });
  }, []);

  // Update Catalog Handler (Admin)
  const handleUpdateMovies = useCallback((newCatalog) => {
    setAllMovies(newCatalog);
    try {
      localStorage.setItem('customMoviesCatalog', JSON.stringify(newCatalog));
    } catch (e) {
      console.warn("Storage quota exceeded:", e);
    }
  }, []);

  // Recommender Fetcher (Combines FastAPI ML response with rich frontend metadata)
  const fetchRecommendations = useCallback(async (email, currentLikes = likedMovies) => {
    setLoading(true);
    let backendSuccess = false;

    try {
      const res = await axios.get(`${API_BASE_URL}/hybrid-recommendations`, {
        params: { email, top_n: 12, weight_a: hybridWeight },
        headers: getAuthHeaders(),
        timeout: 4000,
      });

      if (res.data && res.data.recommendations && res.data.recommendations.length > 0) {
        backendSuccess = true;
        // Merge backend scoring with our rich movie records (posters, cast, descriptions)
        const enriched = res.data.recommendations.map((rec) => {
          const match = allMovies.find((m) => m.id === rec.id || m.title.toLowerCase() === rec.title.toLowerCase());
          return {
            ...(match || {}),
            ...rec,
          };
        });
        setRecommendations(enriched);
        setUserStatus('Backend ML Active (Postgres + SVD)');
        addAuditLog(`Generated hybrid recommendations via FastAPI backend for ${email}`);
      }
    } catch (err) {
      console.warn("FastAPI backend not reached or empty profile. Using resilient client hybrid engine:", err.message);
    }

    // Resilient Fallback: If backend is offline or returned empty, compute client-side
    if (!backendSuccess) {
      const clientRecs = generateClientRecommendations(currentLikes, allMovies, 12, hybridWeight);
      setRecommendations(clientRecs);
      setUserStatus('Hybrid Resilient Engine (Content + Collaborative)');
    }

    setLoading(false);
  }, [allMovies, hybridWeight, likedMovies, addAuditLog]);

  // Initial user setup
  useEffect(() => {
    if (!userEmail) return;

    if (likedMovies.length === 0 && userRole !== 'admin') {
      const timer = setTimeout(() => setShowOnboarding(true), 10);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        fetchRecommendations(userEmail, likedMovies);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [userEmail, likedMovies, userRole, fetchRecommendations]);

  // Toggle Like Handler
  const toggleLike = async (movieTitle) => {
    const isCurrentlyLiked = likedMovies.includes(movieTitle);
    const newLikes = isCurrentlyLiked
      ? likedMovies.filter((t) => t !== movieTitle)
      : [...likedMovies, movieTitle];

    setLikedMovies(newLikes);
    localStorage.setItem('likedMovies', JSON.stringify(newLikes));

    // Update users directory for admin view
    setUsersList((prev) => {
      const updated = prev.map((u) => (u.email === userEmail ? { ...u, liked_movies: newLikes } : u));
      try {
        localStorage.setItem('usersDirectory', JSON.stringify(updated));
      } catch (err) {
        void err;
      }
      return updated;
    });

    addAuditLog(`User ${userEmail} ${isCurrentlyLiked ? 'unliked' : 'liked'} "${movieTitle}"`);

    // Call backend API if online
    try {
      await axios.post(
        `${API_BASE_URL}/like`,
        { email: userEmail, movie_title: movieTitle },
        { headers: getAuthHeaders(), timeout: 2500 }
      );
    } catch (err) {
      void err;
      console.warn("Backend like sync bypassed (running in local mode)");
    }

    // Refresh recommendations
    fetchRecommendations(userEmail, newLikes);
  };

  // Clear Likes
  const handleClearLikes = () => {
    setLikedMovies([]);
    localStorage.removeItem('likedMovies');
    addAuditLog(`User ${userEmail} cleared all liked movies`);
    fetchRecommendations(userEmail, []);
  };

  // Complete Onboarding
  const handleOnboardingComplete = async (selectedStarterMovies) => {
    setShowOnboarding(false);
    const updated = [...new Set([...likedMovies, ...selectedStarterMovies])];
    setLikedMovies(updated);
    localStorage.setItem('likedMovies', JSON.stringify(updated));

    // Update users directory
    setUsersList((prev) => {
      const exists = prev.find((u) => u.email === userEmail);
      let next;
      if (exists) {
        next = prev.map((u) => (u.email === userEmail ? { ...u, liked_movies: updated } : u));
      } else {
        next = [...prev, { email: userEmail, role: userRole, liked_movies: updated }];
      }
      try {
        localStorage.setItem('usersDirectory', JSON.stringify(next));
      } catch (err) {
        void err;
      }
      return next;
    });

    addAuditLog(`User ${userEmail} completed onboarding with ${selectedStarterMovies.length} starter picks`);

    // Attempt backend sync
    for (const title of selectedStarterMovies) {
      try {
        await axios.post(`${API_BASE_URL}/like`, { email: userEmail, movie_title: title }, { headers: getAuthHeaders(), timeout: 1500 });
      } catch (err) {
        void err;
      }
    }

    fetchRecommendations(userEmail, updated);
  };

  // Login / Signup Action
  const handleLoginSuccess = async ({ email, password, role, isSignup }) => {
    let token = `demo_jwt_token_${Date.now()}`;
    let fetchedLikes = likedMovies;

    try {
      const endpoint = isSignup ? `${API_BASE_URL}/signup` : `${API_BASE_URL}/login`;
      const res = await axios.post(endpoint, { email, password }, { timeout: 3500 });
      if (res.data) {
        token = res.data.access_token || token;
        fetchedLikes = res.data.liked_movies || [];
      }
    } catch (err) {
      console.warn("Backend authentication unreachable or skipped, proceeding with authenticated session:", err.message);
    }

    // Store session
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', role);
    localStorage.setItem('likedMovies', JSON.stringify(fetchedLikes));

    setUserEmail(email);
    setUserRole(role);
    setLikedMovies(fetchedLikes);
    setActiveView(role === 'admin' ? 'admin' : 'home');

    // Register user in directory
    setUsersList((prev) => {
      if (!prev.find((u) => u.email === email)) {
        const next = [...prev, { email, role, liked_movies: fetchedLikes }];
        try {
          localStorage.setItem('usersDirectory', JSON.stringify(next));
        } catch (err) {
          void err;
        }
        return next;
      }
      return prev;
    });

    addAuditLog(`User logged in as ${role.toUpperCase()} (${email})`);

    if (role !== 'admin' && fetchedLikes.length < 3) {
      setShowOnboarding(true);
    } else {
      fetchRecommendations(email, fetchedLikes);
    }
  };

  // Logout
  const handleLogout = () => {
    addAuditLog(`User ${userEmail} logged out`);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('likedMovies');
    setUserEmail('');
    setUserRole('user');
    setLikedMovies([]);
    setRecommendations([]);
    setActiveView('home');
    setShowOnboarding(false);
    setSelectedMovieForDetail(null);
    setStreamingMovie(null);
  };

  // Switch Role Toggle (Convenience demo feature)
  const handleToggleRole = () => {
    const nextRole = userRole === 'admin' ? 'user' : 'admin';
    setUserRole(nextRole);
    localStorage.setItem('userRole', nextRole);
    setActiveView(nextRole === 'admin' ? 'admin' : 'home');
    addAuditLog(`Switched view mode to ${nextRole.toUpperCase()}`);
  };

  // Play Movie / Stream Handler
  const handlePlayMovie = async (movie) => {
    setSelectedMovieForDetail(null);
    setStreamingMovie(movie);

    let stream = DEMO_STREAMS[movie.id] || DEMO_STREAMS.default;
    try {
      const res = await axios.get(`${API_BASE_URL}/stream/${movie.id}`, { timeout: 2000 });
      if (res.data?.video_url) {
        stream = res.data.video_url;
      }
    } catch (err) {
      void err;
    }
    setStreamingUrl(stream);
    addAuditLog(`Viewer launched stream for "${movie.title}"`);
  };

  // Watch event feedback from player
  const handleWatchEvent = (updatedLikes) => {
    if (updatedLikes && Array.isArray(updatedLikes)) {
      setLikedMovies(updatedLikes);
      localStorage.setItem('likedMovies', JSON.stringify(updatedLikes));
      fetchRecommendations(userEmail, updatedLikes);
    }
  };

  // Featured Blockbuster Movie for Hero Banner
  const featuredMovie = useMemo(() => {
    if (recommendations.length > 0) return recommendations[0];
    return allMovies.find((m) => m.id === 157336) || allMovies[0]; // Interstellar default
  }, [recommendations, allMovies]);

  // Curated category rows
  const sciFiMovies = useMemo(() => {
    return allMovies.filter((m) => m.genres && m.genres.toLowerCase().includes('science fiction')).slice(0, 12);
  }, [allMovies]);

  const actionMovies = useMemo(() => {
    return allMovies.filter((m) => m.genres && m.genres.toLowerCase().includes('action')).slice(0, 12);
  }, [allMovies]);

  const topRatedMovies = useMemo(() => {
    return [...allMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12);
  }, [allMovies]);

  const userSavedMovieObjects = useMemo(() => {
    const set = new Set(likedMovies.map((t) => t.toLowerCase()));
    return allMovies.filter((m) => set.has(m.title.toLowerCase()));
  }, [allMovies, likedMovies]);

  // If not logged in: Render Auth Portal
  if (!userEmail) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-netflixDark text-white selection:bg-netflixRed selection:text-white">
      {/* Sticky Header */}
      <Navbar
        userEmail={userEmail}
        userRole={userRole}
        activeView={activeView}
        onSelectView={setActiveView}
        likedCount={likedMovies.length}
        onLogout={handleLogout}
        onToggleRole={handleToggleRole}
        onOpenTasteProfile={() => setShowTasteProfile(true)}
        onFocusSearch={() => setGlobalSearchQuery('')}
      />

      {/* Main Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {/* VIEW 1: ADMIN CONSOLE */}
        {activeView === 'admin' ? (
          <AdminDashboard
            allMovies={allMovies}
            onUpdateMovies={handleUpdateMovies}
            hybridWeight={hybridWeight}
            onUpdateHybridWeight={(w) => {
              setHybridWeight(w);
              fetchRecommendations(userEmail, likedMovies);
            }}
            usersList={usersList}
            auditLogs={auditLogs}
            onAddAuditLog={addAuditLog}
            onSwitchToUser={() => setActiveView('home')}
          />
        ) : activeView === 'search' ? (
          /* VIEW 2: SEARCH & DISCOVERY */
          <SearchDiscovery
            allMovies={allMovies}
            likedMovies={likedMovies}
            onToggleLike={toggleLike}
            onSelectMovie={setSelectedMovieForDetail}
            onPlayMovie={handlePlayMovie}
            searchQuery={globalSearchQuery}
            setSearchQuery={setGlobalSearchQuery}
          />
        ) : (
          /* VIEW 3: HOME FEED WITH RECOMMENDATIONS */
          <div className="space-y-12">
            {/* Hero Blockbuster */}
            <HeroBanner
              movie={featuredMovie}
              isLiked={likedMovies.includes(featuredMovie?.title)}
              onToggleLike={toggleLike}
              onSelectMovie={setSelectedMovieForDetail}
              onPlayMovie={handlePlayMovie}
            />

            {/* User Taste Profile Status Bar */}
            <div className="bg-netflixCard p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-netflixRed/15 text-netflixRed rounded-xl border border-netflixRed/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                      Active Viewer Taste Profile
                    </h3>
                    <span className="text-[10px] bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-gray-400 font-mono">
                      {likedMovies.length} Saved
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Engine Status: <strong className="text-emerald-400">{userStatus}</strong> • Weight:{' '}
                    <span className="text-netflixRed font-mono font-bold">
                      {Math.round(hybridWeight * 100)}% Content
                    </span>{' '}
                    +{' '}
                    <span className="text-blue-400 font-mono font-bold">
                      {Math.round((1 - hybridWeight) * 100)}% SVD Collab
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <button
                  onClick={() => setShowTasteProfile(true)}
                  className="bg-gray-800 hover:bg-gray-700 text-xs px-4 py-2 rounded-xl text-gray-200 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-netflixRed fill-current" />
                  Manage Saved ({likedMovies.length})
                </button>
                <button
                  onClick={() => setActiveView('search')}
                  className="bg-netflixRed/20 hover:bg-netflixRed/30 text-netflixRed border border-netflixRed/40 text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" /> Search Catalog
                </button>
              </div>
            </div>

            {/* RECOMMENDATIONS SECTION */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-netflixRed" />
                    Top Hybrid Recommendations for You
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ranked by combining TF-IDF similarity vectors with collaborative SVD ratings
                  </p>
                </div>
                <button
                  onClick={() => fetchRecommendations(userEmail, likedMovies)}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  Refresh Feed
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24 bg-netflixCard/50 rounded-2xl border border-gray-800">
                  <Loader className="w-8 h-8 animate-spin text-netflixRed" />
                </div>
              ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                  {recommendations.slice(0, 12).map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      isLiked={likedMovies.includes(movie.title)}
                      onToggleLike={toggleLike}
                      onSelectMovie={setSelectedMovieForDetail}
                      onPlayMovie={handlePlayMovie}
                      showScore={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-netflixCard rounded-2xl border border-gray-800 space-y-3">
                  <Film className="w-10 h-10 text-gray-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">Build Your Recommendations</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Select a few movies you like to initialize your personalized AI suggestions.
                  </p>
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="bg-netflixRed hover:bg-red-700 text-white text-xs px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-netflixRed/30"
                  >
                    Open Starter Selection
                  </button>
                </div>
              )}
            </section>

            {/* CATEGORY ROW 1: Sci-Fi & Adventure */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">🚀 Sci-Fi & Adventure Universe</h3>
                <button
                  onClick={() => {
                    setActiveView('search');
                    setGlobalSearchQuery('Science Fiction');
                  }}
                  className="text-xs text-netflixRed hover:underline flex items-center gap-1"
                >
                  Explore All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {sciFiMovies.slice(0, 6).map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isLiked={likedMovies.includes(movie.title)}
                    onToggleLike={toggleLike}
                    onSelectMovie={setSelectedMovieForDetail}
                    onPlayMovie={handlePlayMovie}
                  />
                ))}
              </div>
            </section>

            {/* CATEGORY ROW 2: High-Octane Action */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">⚡ High-Octane Action & Thrillers</h3>
                <button
                  onClick={() => {
                    setActiveView('search');
                    setGlobalSearchQuery('Action');
                  }}
                  className="text-xs text-netflixRed hover:underline flex items-center gap-1"
                >
                  Explore All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {actionMovies.slice(0, 6).map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isLiked={likedMovies.includes(movie.title)}
                    onToggleLike={toggleLike}
                    onSelectMovie={setSelectedMovieForDetail}
                    onPlayMovie={handlePlayMovie}
                  />
                ))}
              </div>
            </section>

            {/* CATEGORY ROW 3: Top Rated Masterpieces */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">⭐ Critically Acclaimed Masterpieces</h3>
                <button
                  onClick={() => setActiveView('search')}
                  className="text-xs text-netflixRed hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {topRatedMovies.slice(0, 6).map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isLiked={likedMovies.includes(movie.title)}
                    onToggleLike={toggleLike}
                    onSelectMovie={setSelectedMovieForDetail}
                    onPlayMovie={handlePlayMovie}
                  />
                ))}
              </div>
            </section>

            {/* CATEGORY ROW 4: User's Saved Collection */}
            {userSavedMovieObjects.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-netflixRed fill-current" />
                    Your Saved & Liked Collection ({userSavedMovieObjects.length})
                  </h3>
                  <button
                    onClick={() => setShowTasteProfile(true)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Manage List
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                  {userSavedMovieObjects.slice(0, 6).map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      isLiked={true}
                      onToggleLike={toggleLike}
                      onSelectMovie={setSelectedMovieForDetail}
                      onPlayMovie={handlePlayMovie}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: MOVIE DESCRIPTION & DETAILS MODAL */}
      {selectedMovieForDetail && (
        <MovieDetailModal
          movie={selectedMovieForDetail}
          allMovies={allMovies}
          isLiked={likedMovies.includes(selectedMovieForDetail.title)}
          onToggleLike={toggleLike}
          onPlayMovie={handlePlayMovie}
          onClose={() => setSelectedMovieForDetail(null)}
          onSelectMovie={setSelectedMovieForDetail}
        />
      )}

      {/* MODAL 2: VIDEO STREAMING PLAYER */}
      {streamingMovie && (
        <VideoPlayerModal
          movie={streamingMovie}
          videoUrl={streamingUrl}
          userEmail={userEmail}
          onClose={() => {
            setStreamingMovie(null);
            setStreamingUrl('');
          }}
          onWatchEvent={handleWatchEvent}
        />
      )}

      {/* MODAL 3: TASTE PROFILE DRAWER */}
      {showTasteProfile && (
        <TasteProfileModal
          likedMovies={likedMovies}
          onToggleLike={toggleLike}
          onClearLikes={handleClearLikes}
          onClose={() => setShowTasteProfile(false)}
          allMovies={allMovies}
          onSelectMovie={setSelectedMovieForDetail}
        />
      )}

      {/* MODAL 4: COLD START ONBOARDING */}
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}