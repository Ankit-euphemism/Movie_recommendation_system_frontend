import { useState } from 'react';
import { Film, Check, Sparkles } from 'lucide-react';
import { getPosterUrl } from '../utils/recommender';

const STARTER_MOVIES = [
  { id: 19995, title: 'Avatar', genres: 'Action Adventure Sci-Fi', poster_path: '/gKY6q7SjCkAU6FqvqWybDYgUKIF.jpg' },
  { id: 49026, title: 'The Dark Knight Rises', genres: 'Action Crime Drama', poster_path: '/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg' },
  { id: 157336, title: 'Interstellar', genres: 'Adventure Drama Sci-Fi', poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { id: 597, title: 'Titanic', genres: 'Drama Romance', poster_path: '/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg' },
  { id: 24428, title: 'The Avengers', genres: 'Action Sci-Fi', poster_path: '/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg' },
  { id: 807, title: 'Se7en', genres: 'Crime Mystery Thriller', poster_path: '/6yoghtyTpznpBik8EngEmJsk9UO.jpg' },
  { id: 27205, title: 'Inception', genres: 'Action Sci-Fi Thriller', poster_path: '/8IB2e4r4oVhHn97LHgv3j97HNVv.jpg' },
  { id: 98, title: 'Gladiator', genres: 'Action Drama Adventure', poster_path: '/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg' },
];

export default function OnboardingModal({ onComplete }) {
  const [selected, setSelected] = useState([]);

  const toggleSelection = (title) => {
    if (selected.includes(title)) {
      setSelected(selected.filter((t) => t !== title));
    } else {
      setSelected([...selected, title]);
    }
  };

  const handleSubmit = () => {
    if (selected.length >= 1) {
      onComplete(selected);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn text-white">
      <div className="bg-netflixCard border border-gray-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-netflixRed mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Welcome to FlixRecommend</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Build Your Initial Taste Profile</h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Select at least <strong className="text-white">1 to 3 movies</strong> you love. Our Hybrid Recommender (TF-IDF Content Similarity + SVD Collaborative Filtering) will calibrate to your unique taste.
          </p>
        </div>

        {/* Movie Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-h-[50vh] overflow-y-auto p-1">
          {STARTER_MOVIES.map((movie) => {
            const isSelected = selected.includes(movie.title);
            const poster = getPosterUrl(movie);
            return (
              <div
                key={movie.id}
                onClick={() => toggleSelection(movie.title)}
                className={`rounded-xl border p-2 transition-all cursor-pointer relative flex flex-col justify-between group overflow-hidden ${
                  isSelected
                    ? 'border-netflixRed bg-netflixRed/15 scale-[1.03] shadow-lg shadow-netflixRed/20'
                    : 'border-gray-800 bg-gray-900/80 hover:border-gray-600'
                }`}
              >
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2 relative">
                  {poster ? (
                    <img src={poster} alt={movie.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-8 h-8 text-gray-600" />
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-netflixRed text-white rounded-full p-1 shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-xs line-clamp-1 group-hover:text-netflixRed transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{movie.genres}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          disabled={selected.length === 0}
          onClick={handleSubmit}
          className="w-full bg-netflixRed hover:bg-red-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-netflixRed/30 hover:scale-[1.01]"
        >
          Generate Personalized Feed ({selected.length} Selected)
        </button>
      </div>
    </div>
  );
}