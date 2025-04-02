
import React from 'react';
import { Play, Users } from 'lucide-react';

interface PlayOptionsProps {
  onPlay: () => void;
  onVibeTogether: () => void;
}

const PlayOptions: React.FC<PlayOptionsProps> = ({ onPlay, onVibeTogether }) => {
  return (
    <div className="w-full max-w-md p-4 space-y-4 animate-fade-in">
      <button 
        onClick={onPlay}
        className="w-full flex items-center justify-center p-4 rounded-xl bg-syncme-light-purple hover:bg-syncme-purple text-white transition-all card-hover"
      >
        <Play size={24} className="mr-2" />
        <span className="text-lg font-medium">Play Now</span>
      </button>
      
      <button 
        onClick={onVibeTogether}
        className="w-full flex items-center justify-center p-4 rounded-xl bg-syncme-orange hover:bg-syncme-orange/90 text-white transition-all card-hover"
      >
        <Users size={24} className="mr-2" />
        <span className="text-lg font-medium">Vibe Together</span>
      </button>
      
      <p className="text-center text-gray-500">
        "Vibe Together" allows you to sync with friends
      </p>
    </div>
  );
};

export default PlayOptions;
