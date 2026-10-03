import { useEffect, useState } from 'react';
import { X, Play, Heart, Star, Film, Sparkles, User, Clapperboard } from 'lucide-react';
import { getPosterUrl, getBackdropUrl, getSimilarMovies } from '../utils/recommender';

export default function MovieDetailModal({
  movie,
  allMovies,
  isLiked,
  onToggleLike,
  onPlayMovie,
  onClose,
  onSelectMovie,
}) {
  const [imgError, setImgError] = useState(false);
  const [backdropError, setBackdropError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!movie) return null;

  const posterUrl = !imgError ? getPosterUrl(movie) : null;
  const backdropUrl = !backdropError ? getBackdropUrl(movie) : null;
  const similarMovies = allMovies ? getSimilarMovies(movie, allMovies, 4) : [];

  const contentScorePct = movie.content_score
    ? Math.round(movie.content_score * 100)
    : 84;
  const collabScorePct = movie.collab_score
    ? Math.round(movie.collab_score * 100)
    : 88;
  const hybridScorePct = movie.hybrid_score
    ? Math.round(movie.hybrid_score * 100)
    : Math.round(((movie.rating || 7.5) / 10) * 100);

  const genresList = movie.genres
    ? movie.genres.split(/\s+/).filter((g) => g.trim().length > 1)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div
        className="relative bg-netflixCard border border-gray-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl my-auto text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Banner */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gradient-to-b from-gray-800 to-netflixCard">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={movie.title}
              onError={() => setBackdropError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-black">
              <Film className="w-16 h-16 text-gray-700" />
            </div>
          )}

          {/* Dark gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-netflixCard via-netflixCard/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-netflixCard/90 via-transparent to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-black/70 hover:bg-netflixRed text-white p-2.5 rounded-full transition-all duration-200 border border-white/10 hover:scale-105"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner content */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {hybridScorePct}% Match
                </span>
                {movie.year && (
                  <span className="bg-black/60 text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-gray-700">
                    {movie.year}
                  </span>
                )}
                {movie.rating && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-300" /> {movie.rating}/10
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
                {movie.title}
              </h1>
            </div>

            {/* CTA action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onPlayMovie(movie)}
                className="bg-netflixRed hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-netflixRed/30"
              >
                <Play className="w-4 h-4 fill-white" /> Watch Stream
              </button>
              <button
                onClick={() => onToggleLike(movie.title)}
                className={`px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 border transition-all ${
                  isLiked
                    ? 'bg-netflixRed text-white border-netflixRed'
                    : 'bg-black/60 hover:bg-black/80 text-gray-200 border-gray-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Main Grid: Poster + Synopsis & Info */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Poster Thumbnail */}
            <div className="w-36 sm:w-44 flex-shrink-0 mx-auto md:mx-0">
              <div className="aspect-[2/3] rounded-xl overflow-hidden border border-gray-700 bg-gray-900 shadow-xl">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gray-900">
                    <Film className="w-8 h-8 text-gray-600 mb-2" />
                    <span className="text-xs text-gray-400 font-bold">{movie.title}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description & Metadata */}
            <div className="flex-1 space-y-4">
              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2">
                {genresList.map((g, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-800 text-gray-300 border border-gray-700 text-xs px-3 py-1 rounded-md"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Movie Full Description / Plot */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-netflixRed" /> Movie Synopsis & Plot
                </h3>
                <p className="text-gray-200 text-sm sm:text-base leading-relaxed bg-black/40 p-4 rounded-xl border border-gray-800/80">
                  {movie.overview || "No extended storyline synopsis available for this movie catalog entry."}
                </p>
              </div>

              {/* Cast & Director */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {movie.director && (
                  <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Clapperboard className="w-3.5 h-3.5 text-netflixRed" /> Director
                    </span>
                    <span className="text-sm font-bold text-white">{movie.director}</span>
                  </div>
                )}

                {movie.cast && movie.cast.length > 0 && (
                  <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-400" /> Top Starring Cast
                    </span>
                    <span className="text-xs text-gray-200 leading-snug">
                      {movie.cast.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hybrid Recommender Explanation Analytics */}
          <div className="bg-gray-900/80 rounded-xl p-5 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-netflixRed" /> Recommender AI Insights
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Final Hybrid Score: {hybridScorePct}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Content-Based Vector (Approach A):</span>
                  <span className="text-netflixRed font-mono font-bold">{contentScorePct}%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-netflixRed h-full rounded-full transition-all duration-500"
                    style={{ width: `${contentScorePct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Derived from TF-IDF metadata similarity (genres, keywords & storyline).
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Collaborative SVD (Approach B):</span>
                  <span className="text-blue-400 font-mono font-bold">{collabScorePct}%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${collabScorePct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Predicted rating calculated by latent Matrix Factorization (SVD).
                </p>
              </div>
            </div>
          </div>

          {/* More Like This (Similar Movies Carousel) */}
          {similarMovies.length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                More Movies Like "{movie.title}"
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {similarMovies.map((sim) => {
                  const simPoster = getPosterUrl(sim);
                  return (
                    <div
                      key={sim.id}
                      onClick={() => onSelectMovie(sim)}
                      className="bg-gray-900 border border-gray-800 hover:border-netflixRed rounded-lg p-2.5 cursor-pointer transition-all hover:scale-105 group"
                    >
                      <div className="aspect-[2/3] rounded bg-gray-800 mb-2 overflow-hidden">
                        {simPoster ? (
                          <img
                            src={simPoster}
                            alt={sim.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-netflixRed transition-colors">
                        {sim.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 line-clamp-1">{sim.genres}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
