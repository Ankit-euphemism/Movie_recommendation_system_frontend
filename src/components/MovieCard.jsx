import { useState } from 'react';
import { Film, Heart, Play, Info, Star } from 'lucide-react';
import { getPosterUrl } from '../utils/recommender';

export default function MovieCard({
  movie,
  isLiked,
  onToggleLike,
  onSelectMovie,
  onPlayMovie,
  showScore = true,
}) {
  const [imgError, setImgError] = useState(false);
  const posterUrl = !imgError ? getPosterUrl(movie) : null;

  const matchPercent = movie.hybrid_score
    ? Math.round(movie.hybrid_score * 100)
    : movie.rating
    ? Math.round(movie.rating * 10)
    : 85;

  return (
    <div className="group relative bg-netflixCard rounded-xl overflow-hidden border border-gray-800/80 hover:border-netflixRed/60 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-netflixRed/10 flex flex-col justify-between">
      {/* Poster Image / Placeholder */}
      <div
        className="relative aspect-[2/3] w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden cursor-pointer"
        onClick={() => onSelectMovie(movie)}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-gray-800 to-gray-950">
            <Film className="w-10 h-10 text-gray-600 mb-2 group-hover:text-netflixRed transition-colors" />
            <span className="text-xs font-bold text-gray-300 line-clamp-2">{movie.title}</span>
            <span className="text-[10px] text-gray-500 mt-1 line-clamp-1">{movie.genres}</span>
          </div>
        )}

        {/* Gradient dark overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onPlayMovie) onPlayMovie(movie);
              }}
              className="bg-white hover:bg-netflixRed text-black hover:text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
              title="Play Video"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectMovie(movie);
              }}
              className="bg-gray-800/90 hover:bg-gray-700 text-white p-2 rounded-full border border-gray-600 transition-transform hover:scale-110"
              title="View Full Description"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-gray-200 line-clamp-2 leading-tight">
            {movie.overview || "Click to view full movie description, cast, and details."}
          </p>
        </div>

        {/* Match / Rating Badge */}
        {showScore && (
          <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-md">
            <span>{matchPercent}% Match</span>
          </div>
        )}

        {/* Like Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(movie.title);
          }}
          className={`absolute top-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
            isLiked
              ? 'bg-netflixRed text-white shadow-lg shadow-netflixRed/50'
              : 'bg-black/60 text-gray-300 hover:text-white hover:bg-black/80'
          }`}
          title={isLiked ? 'Remove from Taste Profile' : 'Add to Taste Profile'}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Info Footer */}
      <div className="p-3 bg-netflixCard border-t border-gray-800/60 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3
              onClick={() => onSelectMovie(movie)}
              className="text-xs font-bold text-white hover:text-netflixRed transition-colors line-clamp-1 cursor-pointer"
              title={movie.title}
            >
              {movie.title}
            </h3>
            {movie.year && (
              <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">{movie.year}</span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 line-clamp-1 mb-2">{movie.genres}</p>
        </div>

        {/* Action button: View Description */}
        <div className="pt-2 border-t border-gray-800/40 flex items-center justify-between">
          <button
            onClick={() => onSelectMovie(movie)}
            className="text-[11px] text-gray-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            <Info className="w-3 h-3 text-netflixRed" /> Description
          </button>
          {movie.rating && (
            <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-bold">
              <Star className="w-3 h-3 fill-amber-400" /> {movie.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
