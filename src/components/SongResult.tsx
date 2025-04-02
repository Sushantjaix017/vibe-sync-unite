
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
    <div className="w-full max-w-md animate-fade-in">
      <div className="bg-syncme-dark/70 rounded-xl overflow-hidden shadow-xl backdrop-blur-lg border border-syncme-light-purple/10 card-glow">
        <div className="relative">
          <img 
            src={song.albumArt} 
            alt={`${song.album} cover`}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-syncme-darkest via-syncme-darkest/70 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-2">🎵</span> {song.title}
            </h2>
            <p className="text-blue-200/90 flex items-center">
              <span className="mr-2">👨‍🎤</span> {song.artist}
            </p>
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex items-center justify-between mb-6 bg-white/5 rounded-lg p-3 backdrop-blur-md">
            <div>
              <p className="text-sm text-blue-200/60">Album</p>
              <p className="font-medium text-blue-100">💿 {song.album}</p>
            </div>
            <div>
              <p className="text-sm text-blue-200/60">Year</p>
              <p className="font-medium text-blue-100">📅 {song.year}</p>
            </div>
            <a 
              href="#" 
              className="flex items-center text-syncme-light-purple hover:underline"
            >
              <span className="mr-1">Info</span>
              <ExternalLink size={16} />
            </a>
          </div>
          
          <div className="flex flex-col space-y-3">
            <button 
              onClick={onPlay}
              className="flex items-center justify-center py-3 rounded-lg btn-primary"
            >
              <Play size={20} className="mr-2" />
              Play Now
            </button>
            
            <button 
              onClick={onVibeTogether}
              className="flex items-center justify-center py-3 rounded-lg btn-secondary"
            >
              <Users size={20} className="mr-2" />
              Vibe Together
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongResult;
