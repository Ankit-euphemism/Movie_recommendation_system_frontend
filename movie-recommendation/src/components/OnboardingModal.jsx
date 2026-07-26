import React, { useState } from 'react';
import { Film, Check, Sparkles } from 'lucide-react';

const STARTER_MOVIES = [
  { id: 19995, title: 'Avatar', genre: 'Action, Sci-Fi' },
  { id: 49026, title: 'The Dark Knight Rises', genre: 'Action, Crime' },
  { id: 157336, title: 'Interstellar', genre: 'Adventure, Drama, Sci-Fi' },
  { id: 597, title: 'Titanic', genre: 'Drama, Romance' },
  { id: 24428, title: 'The Avengers', genre: 'Action, Sci-Fi' },
  { id: 807, title: 'Se7en', genre: 'Crime, Mystery' },
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-netflixCard border border-gray-800 rounded-xl max-w-2xl w-full p-8 shadow-2xl">
        <div className="flex items-center gap-2 text-netflixRed mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Welcome Onboard</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Build Your Initial Taste Profile</h2>
        <p className="text-gray-400 text-sm mb-6">
          Pick at least <strong className="text-white">1 to 3 movies</strong> you enjoy to kickstart your recommendations.
        </p>

        {/* Movie Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {STARTER_MOVIES.map((movie) => {
            const isSelected = selected.includes(movie.title);
            return (
              <div
                key={movie.id}
                onClick={() => toggleSelection(movie.title)}
                className={`p-4 rounded-lg border transition-all cursor-pointer relative flex flex-col justify-between h-32 ${
                  isSelected
                    ? 'border-netflixRed bg-netflixRed/10 scale-105'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                }`}
              >
                <div>
                  <Film className={`w-5 h-5 mb-2 ${isSelected ? 'text-netflixRed' : 'text-gray-600'}`} />
                  <h3 className="font-bold text-sm line-clamp-1">{movie.title}</h3>
                  <p className="text-[10px] text-gray-400 mt-1">{movie.genre}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-netflixRed text-white rounded-full p-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          disabled={selected.length === 0}
          onClick={handleSubmit}
          className="w-full bg-netflixRed hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded transition-colors"
        >
          Generate Feed ({selected.length} Selected)
        </button>
      </div>
    </div>
  );
}