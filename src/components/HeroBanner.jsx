import { useState } from 'react';
import { Play, Info, Heart, Star, Sparkles } from 'lucide-react';
import { getBackdropUrl } from '../utils/recommender';

export default function HeroBanner({
  movie,
  isLiked,
  onToggleLike,
  onSelectMovie,
  onPlayMovie,
}) {
  const [backdropError, setBackdropError] = useState(false);

  if (!movie) return null;

  const backdropUrl = !backdropError ? getBackdropUrl(movie) : null;
  const matchPercent = movie.hybrid_score
    ? Math.round(movie.hybrid_score * 100)
    : movie.rating
    ? Math.round(movie.rating * 10)
    : 96;

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] rounded-2xl overflow-hidden mb-10 shadow-2xl border border-gray-800/60 group">
      {/* Background Image / Placeholder */}
      {backdropUrl ? (
        <img
          src={backdropUrl}
          alt={movie.title}
          onError={() => setBackdropError(true)}
          className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-gray-950 via-gray-900 to-black" />
      )}

      {/* Cinematic Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-netflixDark via-netflixDark/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-netflixDark via-netflixDark/40 to-transparent" />

      {/* Content Overlay */}
      <div className="absolute bottom-10 left-6 sm:left-12 max-w-2xl text-white space-y-4 z-10">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="bg-netflixRed text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-netflixRed/30">
            <Sparkles className="w-3.5 h-3.5" /> Featured Pick
          </span>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
            {matchPercent}% Match
          </span>
          {movie.year && (
            <span className="text-gray-300 text-xs font-mono bg-black/50 px-2.5 py-0.5 rounded-full border border-gray-700">
              {movie.year}
            </span>
          )}
          {movie.rating && (
            <span className="text-amber-400 text-xs font-bold flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full border border-gray-700">
              <Star className="w-3 h-3 fill-amber-400" /> {movie.rating}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-lg leading-tight">
          {movie.title}
        </h1>

        {/* Genres */}
        <p className="text-xs sm:text-sm font-semibold text-gray-300 tracking-wide uppercase">
          {movie.genres}
        </p>

        {/* Synopsis / Description Preview */}
        <p className="text-sm text-gray-200 line-clamp-3 sm:line-clamp-4 leading-relaxed max-w-xl drop-shadow">
          {movie.overview || "Explore this cinema masterpiece with full storyline, cast, and custom AI recommendations."}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => onPlayMovie(movie)}
            className="bg-white hover:bg-netflixRed text-black hover:text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-xl shadow-black/60"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" /> Play Movie
          </button>

          <button
            onClick={() => onSelectMovie(movie)}
            className="bg-gray-800/80 hover:bg-gray-750 text-white border border-gray-600/80 hover:border-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 hover:scale-105 backdrop-blur-md"
          >
            <Info className="w-4 h-4 text-netflixRed" /> Full Description
          </button>

          <button
            onClick={() => onToggleLike(movie.title)}
            className={`p-3 rounded-xl border transition-all duration-300 ${
              isLiked
                ? 'bg-netflixRed border-netflixRed text-white shadow-lg shadow-netflixRed/40'
                : 'bg-black/60 border-gray-700 text-gray-300 hover:text-white hover:bg-black/90'
            }`}
            title={isLiked ? 'Liked in Profile' : 'Add to Taste Profile'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
