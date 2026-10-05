import { useState, useMemo } from 'react';
import {
  Film,
  Plus,
  Trash2,
  Edit3,
  Search,
  Sliders,
  Users,
  Database,
  Activity,
  ShieldCheck,
  RefreshCw,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';
import { getPosterUrl } from '../utils/recommender';

export default function AdminDashboard({
  allMovies,
  onUpdateMovies,
  hybridWeight,
  onUpdateHybridWeight,
  usersList = [],
  auditLogs = [],
  onAddAuditLog,
  onSwitchToUser,
}) {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'users' | 'algorithm' | 'logs'
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedMovieForEdit, setSelectedMovieForEdit] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  // Form State for Add / Edit Movie
  const [movieForm, setMovieForm] = useState({
    title: '',
    genres: '',
    overview: '',
    director: '',
    cast: '',
    year: '2024',
    rating: '7.5',
    poster_path: '',
  });

  // Filter catalog movies for admin table
  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return allMovies.slice(0, 50);
    const q = catalogSearch.toLowerCase().trim();
    return allMovies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.genres && m.genres.toLowerCase().includes(q)) ||
        (m.director && m.director.toLowerCase().includes(q))
    ).slice(0, 50);
  }, [allMovies, catalogSearch]);

  // Open Edit Modal
  const handleEditClick = (movie) => {
    setSelectedMovieForEdit(movie);
    setMovieForm({
      title: movie.title || '',
      genres: movie.genres || '',
      overview: movie.overview || '',
      director: movie.director || '',
      cast: Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast || '',
      year: movie.year || '2024',
      rating: movie.rating ? String(movie.rating) : '7.5',
      poster_path: movie.poster_path || '',
    });
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setMovieForm({
      title: '',
      genres: '',
      overview: '',
      director: '',
      cast: '',
      year: '2025',
      rating: '8.0',
      poster_path: '',
    });
    setShowAddModal(true);
  };

  // Save New Movie
  const handleSaveNewMovie = (e) => {
    e.preventDefault();
    if (!movieForm.title.trim()) return;

    const newMovie = {
      id: Date.now(),
      title: movieForm.title.trim(),
      genres: movieForm.genres.trim(),
      overview: movieForm.overview.trim(),
      director: movieForm.director.trim(),
      cast: movieForm.cast.split(',').map((c) => c.trim()).filter(Boolean),
      year: movieForm.year.trim(),
      rating: parseFloat(movieForm.rating) || 7.0,
      poster_path: movieForm.poster_path.trim() || null,
    };

    const updated = [newMovie, ...allMovies];
    onUpdateMovies(updated);
    if (onAddAuditLog) onAddAuditLog(`Admin added movie "${newMovie.title}" (ID: ${newMovie.id})`);
    setShowAddModal(false);
  };

  // Save Edited Movie
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!selectedMovieForEdit) return;

    const updated = allMovies.map((m) => {
      if (m.id === selectedMovieForEdit.id) {
        return {
          ...m,
          title: movieForm.title.trim(),
          genres: movieForm.genres.trim(),
          overview: movieForm.overview.trim(),
          director: movieForm.director.trim(),
          cast: movieForm.cast.split(',').map((c) => c.trim()).filter(Boolean),
          year: movieForm.year.trim(),
          rating: parseFloat(movieForm.rating) || m.rating,
          poster_path: movieForm.poster_path.trim() || m.poster_path,
        };
      }
      return m;
    });

    onUpdateMovies(updated);
    if (onAddAuditLog) onAddAuditLog(`Admin updated metadata for "${movieForm.title}"`);
    setSelectedMovieForEdit(null);
  };

  // Delete Movie from Catalog
  const handleDeleteMovie = (id, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from the catalog?`)) {
      const updated = allMovies.filter((m) => m.id !== id);
      onUpdateMovies(updated);
      if (onAddAuditLog) onAddAuditLog(`Admin deleted movie "${title}" (ID: ${id})`);
    }
  };

  // Reset to default
  const handleResetCatalog = () => {
    if (window.confirm('Reset catalog back to initial 4,803 TMDB movies?')) {
      localStorage.removeItem('customMoviesCatalog');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-white">
      {/* Top Banner / Metrics Header */}
      <div className="bg-gradient-to-r from-gray-900 via-netflixCard to-gray-900 p-6 rounded-2xl border border-gray-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-netflixRed p-3 rounded-xl shadow-lg shadow-netflixRed/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                FlixRecommend Admin Console
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                SYSTEM HEALTHY
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage catalog, analyze user taste profiles, and tune the hybrid ML algorithm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToUser}
            className="bg-gray-800 hover:bg-gray-750 text-gray-200 hover:text-white px-4 py-2 rounded-xl text-xs font-bold border border-gray-700 transition-all flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-netflixRed" /> Preview User Feed
          </button>
          <button
            onClick={handleResetCatalog}
            className="bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-gray-200 px-3 py-2 rounded-xl text-xs border border-gray-700 transition-colors"
            title="Reset Catalog to Defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-netflixCard p-5 rounded-xl border border-gray-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Total Movies
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {allMovies.length.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg text-netflixRed">
            <Film className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-netflixCard p-5 rounded-xl border border-gray-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Active Users
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {Math.max(usersList.length, 1)}
            </span>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-netflixCard p-5 rounded-xl border border-gray-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Hybrid Balance (wA)
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block font-mono">
              {Math.round(hybridWeight * 100)}%
            </span>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg text-emerald-400">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-netflixCard p-5 rounded-xl border border-gray-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Engine Status
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              Hybrid A+B
            </span>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Admin Tabs Bar */}
      <div className="flex border-b border-gray-800 space-x-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'catalog'
              ? 'text-netflixRed border-netflixRed'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" /> Movie Catalog ({allMovies.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'users'
              ? 'text-netflixRed border-netflixRed'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> User Taste Profiles
        </button>
        <button
          onClick={() => setActiveTab('algorithm')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'algorithm'
              ? 'text-netflixRed border-netflixRed'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" /> Hybrid Algorithm Tuner
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'logs'
              ? 'text-netflixRed border-netflixRed'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" /> Audit Activity Logs
        </button>
      </div>

      {/* TAB 1: CATALOG MANAGEMENT */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search catalog by title, genre, or director..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-netflixRed focus:outline-none"
              />
            </div>

            <button
              onClick={handleOpenAddModal}
              className="bg-netflixRed hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-md shadow-netflixRed/30"
            >
              <Plus className="w-4 h-4" /> Add New Movie
            </button>
          </div>

          {/* Table */}
          <div className="bg-netflixCard rounded-xl border border-gray-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Poster</th>
                    <th className="py-3 px-4">Movie Title</th>
                    <th className="py-3 px-4">Genres</th>
                    <th className="py-3 px-4">Director</th>
                    <th className="py-3 px-4">Year / Rating</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredCatalog.map((movie) => {
                    const poster = getPosterUrl(movie);
                    return (
                      <tr key={movie.id} className="hover:bg-gray-900/40 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="w-10 h-14 rounded bg-gray-800 overflow-hidden flex items-center justify-center border border-gray-700/60">
                            {poster ? (
                              <img src={poster} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Film className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-white max-w-xs truncate">
                          {movie.title}
                          <span className="block text-[10px] text-gray-500 font-mono font-normal">
                            ID: {movie.id}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-400 max-w-xs truncate">
                          {movie.genres}
                        </td>
                        <td className="py-2.5 px-4 text-gray-300">
                          {movie.director || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-gray-400">
                          {movie.year || '2015'} • <span className="text-amber-400 font-bold">{movie.rating || 7.2}★</span>
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEditClick(movie)}
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                            title="Edit Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMovie(movie.id, movie.title)}
                            className="p-1.5 bg-gray-800 hover:bg-red-900/60 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gray-900/40 text-[11px] text-gray-400 text-center border-t border-gray-800">
              Showing top {filteredCatalog.length} records. Search to view any of {allMovies.length} movies.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER TASTE PROFILES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-netflixCard rounded-xl border border-gray-800 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-netflixRed" /> Registered User Taste Profiles
            </h3>
            <p className="text-xs text-gray-400">
              Inspect user taste preferences, liked movie counts, and cold-start state.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {usersList.map((usr) => (
                <div
                  key={usr.email}
                  onClick={() => setSelectedUserDetail(usr)}
                  className="bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-700 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white truncate max-w-[200px]">
                        {usr.email}
                      </span>
                      <span className="text-[10px] bg-netflixRed/20 text-netflixRed px-2 py-0.5 rounded-full border border-netflixRed/30 font-bold">
                        {usr.role || 'User'}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mb-2">
                      Liked: <strong className="text-emerald-400">{usr.liked_movies?.length || 0}</strong> titles
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(usr.liked_movies || []).slice(0, 3).map((title, i) => (
                        <span key={i} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded truncate max-w-[150px]">
                          {title}
                        </span>
                      ))}
                      {(usr.liked_movies?.length || 0) > 3 && (
                        <span className="text-[10px] text-gray-500">
                          +{(usr.liked_movies?.length || 0) - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <button className="mt-4 text-[10px] text-gray-400 hover:text-white flex items-center gap-1 font-semibold pt-2 border-t border-gray-800">
                    <Eye className="w-3 h-3 text-netflixRed" /> View Profile Breakdown
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HYBRID ALGORITHM TUNER */}
      {activeTab === 'algorithm' && (
        <div className="bg-netflixCard rounded-2xl border border-gray-800 p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-netflixRed" /> Hybrid Recommendation Balancing
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Tune the relative importance of Content Similarity (Approach A) vs Collaborative SVD (Approach B).
            </p>
          </div>

          <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  Approach A: Content-Based TF-IDF Weight (wA)
                </span>
                <span className="text-3xl font-black text-netflixRed font-mono">
                  {Math.round(hybridWeight * 100)}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  Approach B: Collaborative SVD Weight (1 - wA)
                </span>
                <span className="text-3xl font-black text-blue-400 font-mono">
                  {Math.round((1 - hybridWeight) * 100)}%
                </span>
              </div>
            </div>

            {/* Slider */}
            <div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={hybridWeight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateHybridWeight(val);
                  if (onAddAuditLog) onAddAuditLog(`Admin adjusted Hybrid Weight (wA) to ${Math.round(val * 100)}%`);
                }}
                className="w-full accent-netflixRed h-2 bg-gray-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-500 mt-2 font-mono">
                <span>0% Content (100% SVD Collab)</span>
                <span>50/50 Balanced</span>
                <span>100% Content (0% SVD Collab)</span>
              </div>
            </div>

            {/* Formula Breakdown Card */}
            <div className="bg-black/60 p-4 rounded-xl border border-gray-800 text-xs text-gray-300 space-y-2 font-mono">
              <div className="text-emerald-400 font-bold">Mathematical Formulation:</div>
              <div className="bg-gray-900 p-2 rounded text-white text-xs">
                Hybrid_Score = ({hybridWeight.toFixed(2)} × Content_Vector_Similarity) + ({(1 - hybridWeight).toFixed(2)} × SVD_Prediction_Score)
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                Changes apply in real time across the recommendation feed for all active sessions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-netflixCard rounded-xl border border-gray-800 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-netflixRed" /> Live Event Audit Trail
          </h3>

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 max-h-96 overflow-y-auto space-y-2 font-mono text-xs">
            {auditLogs.length > 0 ? (
              auditLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 py-1.5 border-b border-gray-800/60 last:border-0">
                  <span className="text-gray-500 text-[10px] whitespace-nowrap">{log.time}</span>
                  <span className="text-gray-200">{log.message}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-500">No events logged yet.</span>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD MOVIE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-netflixCard border border-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-netflixRed" /> Add New Movie to Catalog
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMovie} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Movie Title *</label>
                <input
                  type="text"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  placeholder="e.g. Oppenheimer"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Genres (space-separated)</label>
                  <input
                    type="text"
                    value={movieForm.genres}
                    onChange={(e) => setMovieForm({ ...movieForm, genres: e.target.value })}
                    placeholder="Drama History Biography"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Release Year</label>
                  <input
                    type="text"
                    value={movieForm.year}
                    onChange={(e) => setMovieForm({ ...movieForm, year: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Director</label>
                  <input
                    type="text"
                    value={movieForm.director}
                    onChange={(e) => setMovieForm({ ...movieForm, director: e.target.value })}
                    placeholder="Christopher Nolan"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Rating (1 to 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={movieForm.rating}
                    onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Starring Cast (comma-separated)</label>
                <input
                  type="text"
                  value={movieForm.cast}
                  onChange={(e) => setMovieForm({ ...movieForm, cast: e.target.value })}
                  placeholder="Cillian Murphy, Emily Blunt, Matt Damon"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Storyline Synopsis / Description *</label>
                <textarea
                  rows="3"
                  required
                  value={movieForm.overview}
                  onChange={(e) => setMovieForm({ ...movieForm, overview: e.target.value })}
                  placeholder="Detailed synopsis of the movie..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Poster URL / TMDB Path (Optional)</label>
                <input
                  type="text"
                  value={movieForm.poster_path}
                  onChange={(e) => setMovieForm({ ...movieForm, poster_path: e.target.value })}
                  placeholder="https://... or /poster_path.jpg"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-netflixRed hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-netflixRed/30"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MOVIE */}
      {selectedMovieForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-netflixCard border border-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-netflixRed" /> Edit Movie: {selectedMovieForEdit.title}
              </h3>
              <button onClick={() => setSelectedMovieForEdit(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Genres</label>
                  <input
                    type="text"
                    value={movieForm.genres}
                    onChange={(e) => setMovieForm({ ...movieForm, genres: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Release Year</label>
                  <input
                    type="text"
                    value={movieForm.year}
                    onChange={(e) => setMovieForm({ ...movieForm, year: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Director</label>
                  <input
                    type="text"
                    value={movieForm.director}
                    onChange={(e) => setMovieForm({ ...movieForm, director: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={movieForm.rating}
                    onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Starring Cast</label>
                <input
                  type="text"
                  value={movieForm.cast}
                  onChange={(e) => setMovieForm({ ...movieForm, cast: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Synopsis / Storyline Description</label>
                <textarea
                  rows="4"
                  required
                  value={movieForm.overview}
                  onChange={(e) => setMovieForm({ ...movieForm, overview: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setSelectedMovieForEdit(null)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-netflixRed hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-netflixRed/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DETAIL MODAL */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-netflixCard border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> Taste Profile: {selectedUserDetail.email}
              </h3>
              <button onClick={() => setSelectedUserDetail(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 block mb-2">
                Saved / Liked Movies ({selectedUserDetail.liked_movies?.length || 0}):
              </span>
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 max-h-60 overflow-y-auto space-y-1.5">
                {selectedUserDetail.liked_movies?.length > 0 ? (
                  selectedUserDetail.liked_movies.map((title, i) => (
                    <div key={i} className="text-xs text-gray-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-netflixRed" /> {title}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">No liked movies yet.</span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
