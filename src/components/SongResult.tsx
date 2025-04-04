
import React from 'react';
import { Play, Users, ExternalLink } from 'lucide-react';

interface Song {
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  year: string;
}

interface SongResultProps {
  song: Song;
  onPlay: () => void;
  onVibeTogether: () => void;
}

const SongResult: React.FC<SongResultProps> = ({ song, onPlay, onVibeTogether }) => {
  return (
    <div className="w-full max-w-md animate-fade-in px-4 sm:px-0">
      <div className="bg-syncme-dark/70 rounded-xl overflow-hidden shadow-xl backdrop-blur-lg border border-syncme-light-purple/10 card-glow">
        <div className="relative">
          <img 
            src={song.albumArt} 
            alt={`${song.album} cover`}
            className="w-full h-48 sm:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-syncme-darkest via-syncme-darkest/70 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
              <span className="mr-2">🎵</span> {song.title}
            </h2>
            <p className="text-sm sm:text-base text-blue-200/90 flex items-center">
              <span className="mr-2">👨‍🎤</span> {song.artist}
            </p>
          </div>
        </div>
        
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between mb-6 bg-white/5 rounded-lg p-3 backdrop-blur-md gap-2">
            <div className="w-1/2 sm:w-auto">
              <p className="text-xs sm:text-sm text-blue-200/60">Album</p>
              <p className="font-medium text-blue-100 text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">💿 {song.album}</p>
            </div>
            <div className="w-1/2 sm:w-auto">
              <p className="text-xs sm:text-sm text-blue-200/60">Year</p>
              <p className="font-medium text-blue-100 text-sm sm:text-base">📅 {song.year}</p>
            </div>
            <a 
              href="#" 
              className="flex items-center text-syncme-light-purple hover:underline text-sm sm:text-base"
            >
              <span className="mr-1">Info</span>
              <ExternalLink size={14} className="sm:w-4 sm:h-4" />
            </a>
          </div>
          
          <div className="flex flex-col space-y-3">
            <button 
              onClick={onPlay}
              className="flex items-center justify-center py-2.5 sm:py-3 rounded-lg btn-primary text-sm sm:text-base"
            >
              <Play size={18} className="mr-2 sm:w-5 sm:h-5" />
              Play Now
            </button>
            
            <button 
              onClick={onVibeTogether}
              className="flex items-center justify-center py-2.5 sm:py-3 rounded-lg btn-secondary text-sm sm:text-base"
            >
              <Users size={18} className="mr-2 sm:w-5 sm:h-5" />
              Vibe Together
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongResult;
