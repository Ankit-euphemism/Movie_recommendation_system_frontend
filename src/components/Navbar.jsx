import { Film, LogOut, Search, Heart } from 'lucide-react';

export default function Navbar({
  userEmail,
  activeView,
  onSelectView,
  likedCount,
  onLogout,
  onOpenTasteProfile,
  onFocusSearch,
}) {
  return (
    <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b border-gray-800/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Links */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => onSelectView('home')}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <div className="bg-netflixRed p-1.5 rounded-lg shadow-md shadow-netflixRed/40 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-wider text-white uppercase flex items-center">
              FLIX<span className="text-netflixRed">RECOMMEND</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-bold">
            <button
              onClick={() => onSelectView('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeView === 'home'
                  ? 'text-white bg-gray-800'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Home Feed
            </button>
            <button
              onClick={() => {
                onSelectView('search');
                if (onFocusSearch) onFocusSearch();
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeView === 'search'
                  ? 'text-white bg-gray-800'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Search & Explore
            </button>
            <button
              onClick={onOpenTasteProfile}
              className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 text-netflixRed" />
              Taste Profile ({likedCount})
            </button>
          </nav>
        </div>

        {/* Right: Search, Role Switcher & Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Search Button (Mobile/Desktop shortcut) */}
          <button
            onClick={() => {
              onSelectView('search');
              if (onFocusSearch) onFocusSearch();
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Search Movies"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* User Email Pill */}
          <div className="hidden lg:flex items-center gap-2 bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-300 font-medium truncate max-w-[140px]">
              {userEmail}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-red-950/50 hover:text-red-400 text-gray-300 text-xs px-3 py-1.5 rounded-lg border border-gray-700/80 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
