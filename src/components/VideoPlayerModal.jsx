import { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import axios from 'axios';
import Hls from 'hls.js';
import { DEFAULT_STREAM_URL, DEMO_STREAMS } from '../utils/recommender';

const API_BASE_URL = "http://localhost:8000/api";

export default function VideoPlayerModal({ movie, videoUrl, userEmail, onClose, onWatchEvent }) {
  const activeVideoUrl = videoUrl || DEMO_STREAMS[movie?.id] || DEFAULT_STREAM_URL;
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [watchEventSent, setWatchEventSent] = useState(false);
  const controlsTimerRef = useRef(null);

// Auto-play on mount & HLS stream setup
useEffect(() => {
  const video = videoRef.current;
  if (!video || !activeVideoUrl) return;

  let hls = null;

  // Helper to attempt play safely
  const attemptPlay = () => {
    video.play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        // Autoplay was likely blocked by browser policies
        console.warn('Autoplay blocked:', err);
        setIsPlaying(false);
      });
  };

  // Handler for native Safari metadata loaded
  const handleLoadedMetadata = () => {
    attemptPlay();
  };

  if (Hls.isSupported() && activeVideoUrl.includes('.m3u8')) {
    hls = new Hls({
      autoStartLoad: true,
    });
    hls.loadSource(activeVideoUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      attemptPlay();
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari / iOS Native HLS
    video.src = activeVideoUrl;
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
  } else {
    // Fallback for MP4 / WebM
    video.src = activeVideoUrl;
    attemptPlay();
  }

  // Prevent body scroll while modal is open
  document.body.style.overflow = 'hidden';

  return () => {
    // Restore body scroll
    document.body.style.overflow = '';

    // Stop playback and remove listeners
    if (video) {
      video.pause();
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeAttribute('src'); // Free memory
      video.load();
    }

    if (hls) {
      hls.destroy();
    }
  };
}, [activeVideoUrl]);

  // Hide controls after 3 seconds of inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying]);

  // Log watch event when user watches > 50%
  const sendWatchEvent = useCallback(async (percentage) => {
    if (watchEventSent || !userEmail || !movie) return;
    if (percentage >= 0.50) {
      setWatchEventSent(true);
      try {
        const res = await axios.post(`${API_BASE_URL}/watch-event`, {
          email: userEmail,
          movie_title: movie.title,
          watched_percentage: percentage
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`
          }
        });
        if (onWatchEvent) onWatchEvent(res.data.updated_likes);
      } catch (err) {
        console.error("Watch event error:", err);
      }
    }
  }, [watchEventSent, userEmail, movie, onWatchEvent]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const pct = video.duration ? video.currentTime / video.duration : 0;
    setProgress(pct);
    setCurrentTime(video.currentTime);
    sendWatchEvent(pct);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    video.currentTime = pct * video.duration;
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleClose = useCallback(() => {
    const video = videoRef.current;
    if (video) video.pause();
    // Send final watch event on close
    if (!watchEventSent && progress > 0) {
      sendWatchEvent(progress);
    }
    onClose();
  }, [watchEventSent, progress, sendWatchEvent, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
      if (e.key === 'm') toggleMute();
      if (e.key === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fadeIn">
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl mx-4 rounded-xl overflow-hidden shadow-2xl bg-black"
        onMouseMove={resetControlsTimer}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 z-30 bg-black/70 hover:bg-netflixRed text-white rounded-full p-2 transition-all duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Movie Title Overlay */}
        <div
          className={`absolute top-4 left-4 z-20 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h3 className="text-white text-lg font-bold drop-shadow-lg">{movie?.title}</h3>
          <p className="text-gray-300 text-xs mt-0.5">{movie?.genres}</p>
        </div>

        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          playsInline
        />

        {/* Center Play/Pause Overlay */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            <div className="bg-netflixRed/90 rounded-full p-5 shadow-xl hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Bottom Controls Bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div
            className="w-full h-1.5 bg-gray-700 rounded-full cursor-pointer mb-3 group hover:h-2.5 transition-all"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-netflixRed rounded-full relative transition-all"
              style={{ width: `${progress * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-netflixRed rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-netflixRed transition-colors">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>
              <button onClick={toggleMute} className="text-white hover:text-netflixRed transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-xs text-gray-300 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 font-mono bg-gray-900/60 px-2 py-0.5 rounded">
                {Math.round(progress * 100)}% watched
              </span>
              <button onClick={toggleFullscreen} className="text-white hover:text-netflixRed transition-colors">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
