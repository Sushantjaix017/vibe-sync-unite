
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
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="relative">
          <img 
            src={song.albumArt} 
            alt={`${song.album} cover`}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-2xl font-bold text-white">{song.title}</h2>
            <p className="text-white/90">{song.artist}</p>
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Album</p>
              <p className="font-medium">{song.album}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Year</p>
              <p className="font-medium">{song.year}</p>
            </div>
            <a 
              href="#" 
              className="flex items-center text-syncme-blue hover:underline"
            >
              <span className="mr-1">More info</span>
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
