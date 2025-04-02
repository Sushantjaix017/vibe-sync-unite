import React, { useState, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Users, MessageCircle } from 'lucide-react';
import Header from './Header';
import YoutubeIframe from 'react-native-youtube-iframe';

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
  const [youtubeReady, setYoutubeReady] = useState(false);
  const playerRef = useRef(null);

  const videoId = getYoutubeVideoId(`${song.title} ${song.artist}`);

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setIsPlaying(false);
    } else if (state === 'playing') {
      setIsPlaying(true);
    } else if (state === 'paused') {
      setIsPlaying(false);
    }
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  function getYoutubeVideoId(query: string): string {
    console.log(`Would search YouTube for: ${query}`);
    return 'dQw4w9WgXcQ';
  }

  const formatTime = (percentage: number) => {
    const totalSeconds = 180 * (percentage / 100);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="flex flex-col h-full space-bg cosmic-dots animate-fade-in">
      <Header title={roomCode ? `Room: ${roomCode}` : "Now Playing 🎵"} showBackButton={true} onBackClick={onBack} />
      
      {roomCode && (
        <div className="flex items-center justify-between px-4 py-2 bg-syncme-light-purple/10 backdrop-blur-md border-b border-syncme-light-purple/10">
          <div className="flex items-center">
            <div className="emoji-bg mr-2 w-8 h-8">
              <span className="text-lg">👥</span>
            </div>
            <span className="text-sm text-blue-200">{participants} listener{participants !== 1 ? 's' : ''}</span>
          </div>
          {isHost && <span className="text-xs bg-syncme-orange px-2 py-1 rounded-full">🎮 Host</span>}
          <button 
            onClick={() => setShowChat(!showChat)}
            className="flex items-center text-sm text-blue-200"
          >
            <div className="emoji-bg mr-2 w-8 h-8">
              <span className="text-lg">💬</span>
            </div>
            Chat
          </button>
        </div>
      )}
      
      <div className="flex-1 flex flex-col items-center justify-between px-6 py-8 relative">
        <div className="absolute top-10 left-[10%] text-xl opacity-10 float-slow">🎵</div>
        <div className="absolute top-[15%] right-[15%] text-xl opacity-10 float">🎶</div>
        <div className="absolute bottom-[20%] left-[20%] text-xl opacity-10 float-fast">🎧</div>
        
        <div className="w-full aspect-video bg-syncme-dark/80 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(155,135,245,0.2)] mb-6 backdrop-blur-md border border-syncme-light-purple/10">
          <YoutubeIframe
            ref={playerRef}
            height="100%"
            width="100%"
            videoId={videoId}
            play={isPlaying}
            onChangeState={onStateChange}
            onReady={() => setYoutubeReady(true)}
            initialPlayerParams={{
              preventFullScreen: true,
              controls: false,
              showinfo: false,
              rel: false,
              modestbranding: true
            }}
          />
        </div>
        
        <div className="w-full">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">🎵</span> {song.title}
            </h2>
            <p className="text-blue-200/80 flex items-center">
              <span className="mr-2">👨‍🎤</span> {song.artist}
            </p>
          </div>
          
          <div className="w-full h-2 bg-syncme-light-purple/10 rounded-full mb-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-syncme-light-purple to-syncme-purple rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-blue-200/70 mb-6">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(100)}</span>
          </div>
          
          <div className="flex items-center justify-center space-x-8">
            <button className="text-blue-200/70 hover:text-white transition-colors">
              <SkipBack size={28} />
            </button>
            
            <button 
              onClick={togglePlayback}
              className="w-16 h-16 rounded-full bg-syncme-light-purple flex items-center justify-center text-white hover:bg-syncme-purple transition-colors shadow-[0_0_20px_rgba(155,135,245,0.5)]"
            >
              {isPlaying ? (
                <Pause size={30} />
              ) : (
                <Play size={30} />
              )}
            </button>
            
            <button className="text-blue-200/70 hover:text-white transition-colors">
              <SkipForward size={28} />
            </button>
          </div>
        </div>
      </div>
      
      {showChat && (
        <div className="fixed inset-0 z-50 space-bg cosmic-dots animate-slide-up flex flex-col">
          <Header title="Room Chat 💬" showBackButton={false} />
          
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="bg-syncme-dark/40 backdrop-blur-md rounded-lg p-4 border border-syncme-light-purple/10 mb-4">
              <div className="text-xs text-blue-200/50 mb-1">System</div>
              <p className="text-blue-200">Welcome to the chat room! 👋</p>
            </div>
            
            <div className="bg-syncme-dark/40 backdrop-blur-md rounded-lg p-4 border border-syncme-light-purple/10 mb-4 ml-auto max-w-[80%]">
              <div className="text-xs text-blue-200/50 mb-1">You</div>
              <p className="text-blue-200">This song is awesome! 🔥</p>
            </div>
            
            <div className="bg-syncme-dark/40 backdrop-blur-md rounded-lg p-4 border border-syncme-light-purple/10 mb-4">
              <div className="text-xs text-blue-200/50 mb-1">User123</div>
              <p className="text-blue-200">Yeah! Love this track 💃</p>
            </div>
          </div>
          
          <div className="p-4 bg-syncme-dark/80 backdrop-blur-lg border-t border-syncme-light-purple/10">
            <div className="flex">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 p-3 rounded-l-lg bg-syncme-dark/50 text-white border border-syncme-light-purple/20 focus:outline-none focus:ring-1 focus:ring-syncme-light-purple/50"
              />
              <button className="px-4 rounded-r-lg bg-syncme-light-purple text-white hover:bg-syncme-purple transition-colors">
                Send
              </button>
            </div>
            <button 
              onClick={() => setShowChat(false)}
              className="w-full mt-4 py-2 text-blue-200/70 hover:text-white bg-syncme-dark/40 rounded-lg border border-syncme-light-purple/10"
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
