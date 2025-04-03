import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Users, MessageCircle, Music, Video } from 'lucide-react';
import Header from './Header';
import YouTube from 'react-youtube';

interface PlayerProps {
  song: {
    title: string;
    artist: string;
    albumArt: string;
    youtubeId?: string;
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
  const [videoMode, setVideoMode] = useState(true);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playerHeight, setPlayerHeight] = useState(0);
  const [playerWidth, setPlayerWidth] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setPlayerWidth(width);
        setPlayerHeight(videoMode ? width * 0.5625 : 0);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [containerRef, videoMode]);

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.internalPlayer.pauseVideo();
      } else {
        playerRef.current.internalPlayer.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlayerReady = (event: any) => {
    playerRef.current = event.target;
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  const handlePlayerStateChange = (event: any) => {
    const playerState = event.data;
    if (playerState === 1) {
      setIsPlaying(true);
    } else if (playerState === 2) {
      setIsPlaying(false);
    }
    
    if (playerState === 1) {
      const interval = setInterval(() => {
        if (playerRef.current) {
          const currentTime = playerRef.current.internalPlayer.getCurrentTime();
          const duration = playerRef.current.internalPlayer.getDuration();
          const progressPercent = (currentTime / duration) * 100;
          setProgress(progressPercent);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  };

  const formatTime = (percentage: number) => {
    if (!playerRef.current) return "0:00";
    
    try {
      const duration = playerRef.current.internalPlayer.getDuration() || 180;
      const totalSeconds = duration * (percentage / 100);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = Math.floor(totalSeconds % 60);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    } catch (error) {
      return "0:00";
    }
  };

  const toggleVideoMode = () => {
    setVideoMode(!videoMode);
  };

  return (
    <div className="flex flex-col h-full space-bg cosmic-dots animate-fade-in">
      <Header title={roomCode ? `Room: ${roomCode}` : "Now Playing 🎵"} showBackButton={true} />
      
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
        
        <div 
          ref={containerRef} 
          className={`w-full mb-6 overflow-hidden rounded-lg shadow-[0_0_30px_rgba(155,135,245,0.2)] border border-syncme-light-purple/10 ${videoMode ? 'aspect-video' : 'h-16 bg-syncme-dark/80 backdrop-blur-md flex items-center justify-center'}`}
        >
          {song.youtubeId ? (
            videoMode ? (
              <YouTube
                videoId={song.youtubeId}
                opts={{
                  width: playerWidth.toString(),
                  height: playerHeight.toString(),
                  playerVars: {
                    autoplay: isPlaying ? 1 : 0,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0
                  },
                }}
                onReady={handlePlayerReady}
                onStateChange={handlePlayerStateChange}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center text-blue-200 w-full h-full">
                <Music className="mr-2" size={20} />
                <span>Playing audio only</span>
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-blue-200/50 bg-syncme-dark/80">
              <p>No YouTube video available</p>
            </div>
          )}
        </div>
        
        <div className="w-full flex justify-center mb-4">
          <button
            onClick={toggleVideoMode}
            className={`flex items-center px-4 py-2 rounded-full border ${videoMode ? 'bg-syncme-light-purple text-white border-syncme-light-purple' : 'bg-syncme-dark/40 text-blue-200 border-syncme-light-purple/30'}`}
          >
            {videoMode ? (
              <>
                <Video size={16} className="mr-2" />
                Video Mode
              </>
            ) : (
              <>
                <Music size={16} className="mr-2" />
                Audio Only
              </>
            )}
          </button>
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
              onClick={togglePlayPause}
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
