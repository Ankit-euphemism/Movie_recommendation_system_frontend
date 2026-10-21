import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Sparkles,
  Loader,
  Film,
  Heart,
  Sliders,
  Search,
  ArrowRight,
} from "lucide-react";

import initialMoviesCatalog from "./data/movies.json";
import Navbar from "./components/Navbar";
import HeroBanner from "./components/HeroBanner";
import MovieCard from "./components/MovieCard";
import MovieDetailModal from "./components/MovieDetailModal";
import SearchDiscovery from "./components/SearchDiscovery";
import AuthModal from "./components/AuthModal";
import TasteProfileModal from "./components/TasteProfileModal";
import OnboardingModal from "./components/OnboardingModal";
import VideoPlayerModal from "./components/VideoPlayerModal";

import {
  DEMO_STREAMS,
} from "./utils/recommender";
import { API_BASE_URL, getAuthHeaders } from "./utils/api";

export default function App() {
  const allMovies = initialMoviesCatalog;
  const [userEmail, setUserEmail] = useState(
    localStorage.getItem("userEmail") || "",
  );
  const [likedMovies, setLikedMovies] = useState([]);

  // Active View State: 'home' | 'search'
  const [activeView, setActiveView] = useState("home");

  // Search Query for quick jump
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Recommender State
  const [recommendations, setRecommendations] = useState([]);
  const hybridWeight = 0.5;
  const [loading, setLoading] = useState(false);
  const [userStatus, setUserStatus] = useState('Hybrid Active');
  const [recommendationError, setRecommendationError] = useState('');

  // Modals & Overlays
  const [selectedMovieForDetail, setSelectedMovieForDetail] = useState(null);
  const [streamingMovie, setStreamingMovie] = useState(null);
  const [streamingUrl, setStreamingUrl] = useState("");
  const [showTasteProfile, setShowTasteProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Recommendations are ranked exclusively by the FastAPI ML service.
  const fetchRecommendations = useCallback(async (email) => {
    setLoading(true);
    setRecommendationError('');
    setRecommendations([]);

    try {
      const res = await axios.get(`${API_BASE_URL}/hybrid-recommendations`, {
        params: { email, top_n: 12, weight_a: hybridWeight },
        headers: getAuthHeaders(),
        timeout: 4000,
      });

      if (Array.isArray(res.data?.recommendations)) {
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
      } else {
        throw new Error('The backend returned an invalid recommendation response.');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Recommendation service unavailable.';
      setRecommendationError(`Backend recommendations unavailable: ${detail}`);
      setUserStatus('Backend ML Unavailable');
      console.error('Backend recommendation request failed:', err);
    }

    setLoading(false);
  }, [allMovies, hybridWeight]);

  // Initial user setup
  useEffect(() => {
    if (!userEmail) return;

    if (likedMovies.length === 0) {
      const timer = setTimeout(() => setShowOnboarding(true), 10);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        fetchRecommendations(userEmail);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [userEmail, likedMovies, fetchRecommendations]);

  // Toggle Like Handler
  const toggleLike = async (movieTitle) => {
    const isCurrentlyLiked = likedMovies.includes(movieTitle);
    const newLikes = isCurrentlyLiked
      ? likedMovies.filter((t) => t !== movieTitle)
      : [...likedMovies, movieTitle];

    setLikedMovies(newLikes);
    localStorage.setItem("likedMovies", JSON.stringify(newLikes));

    // Call backend API if online
    try {
      await axios.post(
        `${API_BASE_URL}/like`,
        { email: userEmail, movie_title: movieTitle },
        { headers: getAuthHeaders(), timeout: 2500 },
      );
    } catch (err) {
      void err;
      console.warn("Backend like sync bypassed (running in local mode)");
    }

    // Refresh recommendations
    fetchRecommendations(userEmail);
  };

  // Clear Likes
  const handleClearLikes = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/likes`, {
        headers: getAuthHeaders(),
        timeout: 2500,
      });
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Unable to clear the backend taste profile.';
      setRecommendationError(`Backend profile update failed: ${detail}`);
      console.error('Backend clear likes request failed:', err);
      return;
    }

    setLikedMovies([]);
    localStorage.removeItem('likedMovies');
    setRecommendations([]);
    setRecommendationError('');
  };

  // Complete Onboarding
  const handleOnboardingComplete = async (selectedStarterMovies) => {
    setShowOnboarding(false);
    const updated = [...new Set([...likedMovies, ...selectedStarterMovies])];
    setLikedMovies(updated);
    localStorage.setItem("likedMovies", JSON.stringify(updated));

    // Attempt backend sync
    for (const title of selectedStarterMovies) {
      try {
        await axios.post(
          `${API_BASE_URL}/like`,
          { email: userEmail, movie_title: title },
          { headers: getAuthHeaders(), timeout: 1500 },
        );
      } catch (err) {
        void err;
      }
    }

    fetchRecommendations(userEmail);
  };

  // Login / Signup Action
  const handleLoginSuccess = async ({ email, password, isSignup }) => {
    const endpoint = isSignup
      ? `${API_BASE_URL}/signup`
      : `${API_BASE_URL}/login`;
    const res = await axios.post(
      endpoint,
      { email, password },
      { timeout: 3500 },
    );
    const token = res.data?.access_token;

    if (!token) {
      throw new Error(
        "Authentication failed: the backend did not return an access token.",
      );
    }

    const fetchedLikes = Array.isArray(res.data.liked_movies)
      ? res.data.liked_movies
      : [];

    // Store session
    localStorage.setItem("accessToken", token);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("likedMovies", JSON.stringify(fetchedLikes));

    setUserEmail(email);
    setLikedMovies(fetchedLikes);
    setActiveView("home");

    if (fetchedLikes.length < 3) {
      setShowOnboarding(true);
    } else {
      fetchRecommendations(email);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("likedMovies");
    setUserEmail("");
    setLikedMovies([]);
    setRecommendations([]);
    setActiveView("home");
    setShowOnboarding(false);
    setSelectedMovieForDetail(null);
    setStreamingMovie(null);
  };

  // Play Movie / Stream Handler
  const handlePlayMovie = async (movie) => {
    setSelectedMovieForDetail(null);
    setStreamingUrl("");
    setStreamingMovie(movie);

    let stream = DEMO_STREAMS[movie.id] || DEMO_STREAMS.default;
    try {
      const res = await axios.get(`${API_BASE_URL}/stream/${movie.id}`, {
        timeout: 2000,
      });
      if (res.data?.video_url) {
        stream = res.data.video_url;
      }
    } catch (err) {
      void err;
    }
    setStreamingUrl(stream);
  };

  // Watch event feedback from player
  const handleWatchEvent = (updatedLikes) => {
    if (updatedLikes && Array.isArray(updatedLikes)) {
      setLikedMovies(updatedLikes);
      localStorage.setItem('likedMovies', JSON.stringify(updatedLikes));
      fetchRecommendations(userEmail);
    }
  };

  // Featured Blockbuster Movie for Hero Banner
  const featuredMovie = useMemo(() => {
    if (recommendations.length > 0) return recommendations[0];
    return allMovies.find((m) => m.id === 157336) || allMovies[0]; // Interstellar default
  }, [recommendations, allMovies]);

  // Curated category rows
  const sciFiMovies = useMemo(() => {
    return allMovies
      .filter(
        (m) => m.genres && m.genres.toLowerCase().includes("science fiction"),
      )
      .slice(0, 12);
  }, [allMovies]);

  const actionMovies = useMemo(() => {
    return allMovies
      .filter((m) => m.genres && m.genres.toLowerCase().includes("action"))
      .slice(0, 12);
  }, [allMovies]);

  const topRatedMovies = useMemo(() => {
    return [...allMovies]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 12);
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
        activeView={activeView}
        onSelectView={setActiveView}
        likedCount={likedMovies.length}
        onLogout={handleLogout}
        onOpenTasteProfile={() => setShowTasteProfile(true)}
        onFocusSearch={() => setGlobalSearchQuery("")}
      />

      {/* Main Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {activeView === "search" ? (
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
                    Engine Status:{" "}
                    <strong className="text-emerald-400">{userStatus}</strong> •
                    Weight:{" "}
                    <span className="text-netflixRed font-mono font-bold">
                      {Math.round(hybridWeight * 100)}% Content
                    </span>{" "}
                    +{" "}
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
                  onClick={() => setActiveView("search")}
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
                    Ranked by combining TF-IDF similarity vectors with
                    collaborative SVD ratings
                  </p>
                </div>
                <button
                  onClick={() => fetchRecommendations(userEmail)}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  Refresh Feed
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24 bg-netflixCard/50 rounded-2xl border border-gray-800">
                  <Loader className="w-8 h-8 animate-spin text-netflixRed" />
                </div>
              ) : recommendationError ? (
                <div className="text-center py-16 bg-netflixCard rounded-2xl border border-red-900/50 space-y-3">
                  <Film className="w-10 h-10 text-red-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">Backend Recommendations Unavailable</h3>
                  <p className="text-xs text-red-300 max-w-md mx-auto">{recommendationError}</p>
                  <button
                    onClick={() => fetchRecommendations(userEmail)}
                    className="bg-netflixRed hover:bg-red-700 text-white text-xs px-5 py-2.5 rounded-xl font-bold"
                  >
                    Retry Backend
                  </button>
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
                  <h3 className="text-base font-bold text-white">
                    Build Your Recommendations
                  </h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Select a few movies you like to initialize your personalized
                    AI suggestions.
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
                <h3 className="text-lg font-bold text-white">
                  🚀 Sci-Fi & Adventure Universe
                </h3>
                <button
                  onClick={() => {
                    setActiveView("search");
                    setGlobalSearchQuery("Science Fiction");
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
                <h3 className="text-lg font-bold text-white">
                  ⚡ High-Octane Action & Thrillers
                </h3>
                <button
                  onClick={() => {
                    setActiveView("search");
                    setGlobalSearchQuery("Action");
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
                <h3 className="text-lg font-bold text-white">
                  ⭐ Critically Acclaimed Masterpieces
                </h3>
                <button
                  onClick={() => setActiveView("search")}
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
                    Your Saved & Liked Collection (
                    {userSavedMovieObjects.length})
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
            setStreamingUrl("");
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
