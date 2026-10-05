import { X, Heart, Trash2, Film, Sparkles } from 'lucide-react';

export default function TasteProfileModal({
  likedMovies,
  onToggleLike,
  onClearLikes,
  onClose,
  allMovies,
  onSelectMovie,
}) {
  // Compute top genres from liked titles
  const likedObjects = allMovies.filter((m) =>
    likedMovies.some((title) => title.toLowerCase() === m.title.toLowerCase())
  );

  const genreCounts = {};
  likedObjects.forEach((m) => {
    if (m.genres) {
      m.genres.split(/\s+/).forEach((g) => {
        const clean = g.trim();
        if (clean.length > 2) genreCounts[clean] = (genreCounts[clean] || 0) + 1;
      });
    }
  });

  const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn text-white">
      <div
        className="bg-netflixCard border border-gray-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-netflixRed/20 text-netflixRed rounded-xl border border-netflixRed/30">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Your Taste Profile</h2>
              <p className="text-xs text-gray-400">
                {likedMovies.length} movies shaping your personalized hybrid recommendations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Genre Breakdown Visual */}
        {sortedGenres.length > 0 && (
          <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-netflixRed" /> Dominant Taste Dimensions
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {sortedGenres.slice(0, 6).map(([g, count]) => (
                <span
                  key={g}
                  className="bg-black/60 border border-gray-700 text-xs px-3 py-1 rounded-full text-gray-200 flex items-center gap-1.5"
                >
                  <span className="font-semibold">{g}</span>
                  <span className="text-[10px] text-netflixRed font-mono font-bold">
                    ×{count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Liked Movies List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Liked Movies ({likedMovies.length})
            </h3>
            {likedMovies.length > 0 && (
              <button
                onClick={onClearLikes}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
          </div>

          {likedMovies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {likedMovies.map((title) => {
                const movieObj = allMovies.find(
                  (m) => m.title.toLowerCase() === title.toLowerCase()
                );
                return (
                  <div
                    key={title}
                    className="bg-gray-900/90 border border-gray-800 hover:border-gray-700 p-3 rounded-xl flex items-center justify-between gap-3 group"
                  >
                    <div
                      className="flex-1 truncate cursor-pointer"
                      onClick={() => {
                        if (movieObj && onSelectMovie) {
                          onSelectMovie(movieObj);
                          onClose();
                        }
                      }}
                    >
                      <h4 className="text-xs font-bold text-white group-hover:text-netflixRed transition-colors truncate">
                        {title}
                      </h4>
                      {movieObj?.genres && (
                        <p className="text-[10px] text-gray-500 truncate">{movieObj.genres}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onToggleLike(title)}
                      className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                      title="Remove like"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800 space-y-2">
              <Film className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs text-gray-400">No liked movies yet.</p>
              <p className="text-[11px] text-gray-500">
                Like movies or search across the catalog to build your recommendation profile.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-netflixRed hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-netflixRed/30 transition-all"
          >
            Apply & View Recommendations
          </button>
        </div>
      </div>
    </div>
  );
}
