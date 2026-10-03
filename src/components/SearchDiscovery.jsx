import { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, Film, ArrowUpDown, ChevronDown } from 'lucide-react';
import MovieCard from './MovieCard';
import { searchAndFilterMovies } from '../utils/recommender';

export default function SearchDiscovery({
  allMovies,
  likedMovies,
  onToggleLike,
  onSelectMovie,
  onPlayMovie,
  searchQuery,
  setSearchQuery,
}) {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('match');
  const [visibleCount, setVisibleCount] = useState(24);

  // Available genre categories
  const genres = useMemo(() => {
    return ['All', 'Action', 'Adventure', 'Science Fiction', 'Drama', 'Thriller', 'Crime', 'Comedy', 'Fantasy', 'Romance', 'Animation', 'Mystery'];
  }, []);

  // Filtered movies
  const filteredMovies = useMemo(() => {
    return searchAndFilterMovies(allMovies, searchQuery, selectedGenre, sortBy);
  }, [allMovies, searchQuery, selectedGenre, sortBy]);

  const displayedMovies = useMemo(() => {
    return filteredMovies.slice(0, visibleCount);
  }, [filteredMovies, visibleCount]);

  const handleClear = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setVisibleCount(24);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar & Controls Header */}
      <div className="bg-netflixCard p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(24);
              }}
              placeholder="Search by movie title, actor, director, genre, or storyline keyword..."
              className="w-full bg-gray-900 border border-gray-700/80 rounded-xl py-3 pl-12 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-netflixRed focus:border-transparent transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-900 text-sm text-gray-200 border border-gray-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-netflixRed cursor-pointer"
            >
              <option value="match">Sort: Best Match</option>
              <option value="rating">Sort: Highest Rating</option>
              <option value="year">Sort: Release Year (Newest)</option>
              <option value="title">Sort: Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Genre Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          <SlidersHorizontal className="w-4 h-4 text-gray-500 flex-shrink-0 mr-1" />
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => {
                setSelectedGenre(g);
                setVisibleCount(24);
              }}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedGenre === g
                  ? 'bg-netflixRed text-white shadow-md shadow-netflixRed/30'
                  : 'bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Status Counter */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800/80">
          <span>
            Found <strong className="text-white">{filteredMovies.length}</strong> movies
            {searchQuery && (
              <> matching "<span className="text-netflixRed">{searchQuery}</span>"</>
            )}
            {selectedGenre !== 'All' && (
              <> in <span className="text-blue-400">{selectedGenre}</span></>
            )}
          </span>
          <span>Showing {displayedMovies.length} of {filteredMovies.length}</span>
        </div>
      </div>

      {/* Movie Results Grid */}
      {displayedMovies.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {displayedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isLiked={likedMovies.includes(movie.title)}
                onToggleLike={onToggleLike}
                onSelectMovie={onSelectMovie}
                onPlayMovie={onPlayMovie}
              />
            ))}
          </div>

          {/* Load More Button */}
          {visibleCount < filteredMovies.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount((prev) => prev + 24)}
                className="bg-gray-800 hover:bg-gray-750 text-white font-bold text-sm px-8 py-3 rounded-xl border border-gray-700 hover:border-gray-500 transition-all hover:scale-105 flex items-center gap-2"
              >
                <ChevronDown className="w-4 h-4" /> Load More Movies ({filteredMovies.length - visibleCount} Remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-netflixCard rounded-2xl border border-gray-800 space-y-4">
          <Film className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Movies Found</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            We couldn't find any title matching "{searchQuery}". Try different keywords, director, or actor names.
          </p>
          <button
            onClick={handleClear}
            className="bg-netflixRed hover:bg-red-700 text-white text-xs px-5 py-2.5 rounded-lg font-semibold transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
