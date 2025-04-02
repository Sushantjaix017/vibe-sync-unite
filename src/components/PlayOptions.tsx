
import React from 'react';
import { Play, Users, Music } from 'lucide-react';

interface PlayOptionsProps {
  onPlay: () => void;
  onVibeTogether: () => void;
}

const PlayOptions: React.FC<PlayOptionsProps> = ({ onPlay, onVibeTogether }) => {
  return (
    <div className="w-full max-w-md p-4 space-y-5 animate-fade-in">
      <button 
        onClick={onPlay}
        className="w-full flex items-center justify-center p-4 rounded-xl bg-syncme-light-purple hover:bg-syncme-purple text-white transition-all card-hover shadow-[0_0_15px_rgba(155,135,245,0.3)]"
      >
        <div className="emoji-bg mr-3">
          <Play size={20} className="text-white" />
        </div>
        <span className="text-lg font-medium">Play Now</span>
      </button>
      
      <button 
        onClick={onVibeTogether}
        className="w-full flex items-center justify-center p-4 rounded-xl bg-syncme-orange hover:bg-syncme-orange/90 text-white transition-all card-hover shadow-[0_0_15px_rgba(249,115,22,0.3)]"
      >
        <div className="emoji-bg mr-3 bg-syncme-orange/20">
          <Users size={20} className="text-white" />
        </div>
        <span className="text-lg font-medium">Vibe Together</span>
      </button>
      
      <div className="text-center text-blue-200/70 mt-4 p-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
        <div className="flex items-center justify-center mb-2">
          <Music size={16} className="text-syncme-orange mr-2" />
          <span className="text-syncme-orange font-medium">Song detected using audd.io</span>
        </div>
        <p>✨ "Vibe Together" lets you sync the music with friends ✨</p>
      </div>
    </div>
  );
};

export default PlayOptions;
