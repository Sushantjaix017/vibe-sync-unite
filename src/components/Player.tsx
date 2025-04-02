
import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Users, MessageCircle } from 'lucide-react';
import Header from './Header';

interface PlayerProps {
  song: {
    title: string;
    artist: string;
    albumArt: string;
  };
  isHost: boolean;
  roomCode?: string;
  participants?: number;
  onBack: () => void;
}

const Player: React.FC<PlayerProps> = ({ 
  song, 
  isHost, 
  roomCode, 
  participants = 1,
  onBack 
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showChat, setShowChat] = useState(false);

  // Mock function to simulate playback progress
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.5, 100));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, progress]);

  const formatTime = (percentage: number) => {
    // Assuming a 3-minute song
    const totalSeconds = 180 * (percentage / 100);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="flex flex-col h-full gradient-bg animate-fade-in">
      <Header title={roomCode ? `Room: ${roomCode}` : "Now Playing"} showBackButton={true} />
      
      {roomCode && (
        <div className="flex items-center justify-between px-4 py-2 bg-syncme-light-purple/30">
          <div className="flex items-center">
            <Users size={18} className="mr-1" />
            <span className="text-sm text-white">{participants} listener{participants !== 1 ? 's' : ''}</span>
          </div>
          {isHost && <span className="text-xs bg-syncme-orange px-2 py-1 rounded-full">Host</span>}
          <button 
            onClick={() => setShowChat(!showChat)}
            className="flex items-center text-sm text-white"
          >
            <MessageCircle size={18} className="mr-1" />
            Chat
          </button>
        </div>
      )}
      
      <div className="flex-1 flex flex-col items-center justify-between px-6 py-8">
        {/* YouTube player placeholder */}
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg mb-6">
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <p>YouTube Player will appear here</p>
          </div>
        </div>
        
        <div className="w-full">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">{song.title}</h2>
            <p className="text-white/80">{song.artist}</p>
          </div>
          
          <div className="w-full h-1 bg-white/20 rounded-full mb-2">
            <div 
              className="h-full bg-white rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-white/70 mb-6">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(100)}</span>
          </div>
          
          <div className="flex items-center justify-center space-x-8">
            <button className="text-white/70 hover:text-white transition-colors">
              <SkipBack size={28} />
            </button>
            
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-syncme-light-purple hover:bg-white/90 transition-colors"
            >
              {isPlaying ? (
                <Pause size={30} />
              ) : (
                <Play size={30} />
              )}
            </button>
            
            <button className="text-white/70 hover:text-white transition-colors">
              <SkipForward size={28} />
            </button>
          </div>
        </div>
      </div>
      
      {showChat && (
        <div className="fixed inset-0 z-50 bg-syncme-dark/95 animate-slide-up flex flex-col">
          <Header title="Room Chat" showBackButton={false} />
          
          <div className="flex-1 p-4">
            <p className="text-center text-white/50">Chat messages will appear here</p>
          </div>
          
          <div className="p-4 bg-syncme-dark">
            <div className="flex">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 p-3 rounded-l-lg bg-white/10 text-white focus:outline-none"
              />
              <button className="px-4 rounded-r-lg bg-syncme-light-purple text-white">
                Send
              </button>
            </div>
            <button 
              onClick={() => setShowChat(false)}
              className="w-full mt-4 py-2 text-white/70 hover:text-white"
            >
              Close Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
