
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Video } from 'lucide-react';
import Header from './Header';
import YouTube from 'react-youtube';
import { toast } from "@/hooks/use-toast";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [videoMode, setVideoMode] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [playerError, setPlayerError] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [videoConfirmed, setVideoConfirmed] = useState(false);
  const [isWaitingForVerification, setIsWaitingForVerification] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When the song changes, validate it's playing the right song
  useEffect(() => {
    if (song) {
      console.log(`Song to play: ${song.artist} - ${song.title} (ID: ${song.youtubeId})`);
      
      // Reset player state for new song
      setPlayerError(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      setSongTitle('');
      setVideoConfirmed(false);
      setIsWaitingForVerification(true);
      setIsPlaying(false);
      
      // If the player is already ready, play the song
      if (playerRef.current && playerRef.current.internalPlayer) {
        playerRef.current.internalPlayer.playVideo();
      }
    }
  }, [song]);

  const togglePlayPause = () => {
    if (!videoConfirmed && isWaitingForVerification) {
      toast({
        title: "Please Wait",
        description: "Verifying the song match first...",
        variant: "default"
      });
      return;
    }
    
    if (playerRef.current && playerRef.current.internalPlayer) {
      try {
        if (isPlaying) {
          playerRef.current.internalPlayer.pauseVideo();
        } else {
          playerRef.current.internalPlayer.playVideo();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error("Error toggling play/pause:", error);
        setIsPlaying(!isPlaying); // Toggle state even if there's an error
      }
    } else {
      console.log("Player reference not available yet");
    }
  };

  const onStateChange = (event: any) => {
    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    const playerState = event.data;
    
    if (playerState === 1) {
      // When playback starts, try to get the video title to confirm it's the right song
      if (!videoConfirmed && playerRef.current && playerRef.current.internalPlayer) {
        try {
          playerRef.current.internalPlayer.getVideoData().then((data: any) => {
            if (data && data.title) {
              setSongTitle(data.title);
              console.log("Now playing:", data.title);
              
              // Validate if the video matches what we expect
              const videoTitle = data.title.toLowerCase();
              const expectedArtist = song.artist.toLowerCase();
              const expectedTitle = song.title.toLowerCase();
              
              const artistMatch = videoTitle.includes(expectedArtist);
              const titleMatch = videoTitle.includes(expectedTitle);
              
              setVideoConfirmed(true);
              setIsWaitingForVerification(false);
              
              if (!artistMatch && !titleMatch) {
                console.warn("Video title doesn't match expected song:", data.title);
                setIsPlaying(false);
                playerRef.current.internalPlayer.pauseVideo();
                
                toast({
                  title: "Song Mismatch",
                  description: `Video doesn't match "${song.artist} - ${song.title}". Please try again.`,
                  variant: "destructive"
                });
              } else {
                console.log("Match confirmed, starting playback!");
                setIsPlaying(true);
                
                toast({
                  title: "Now Playing",
                  description: `${song.artist} - ${song.title}`,
                  variant: "default"
                });
              }
            }
          }).catch(() => {
            // If this fails, consider it unverified but allow playback
            setVideoConfirmed(true);
            setIsWaitingForVerification(false);
            setIsPlaying(true);
          });
        } catch (e) {
          // If this fails, consider it unverified but allow playback
          console.log("Couldn't get video data:", e);
          setVideoConfirmed(true);
          setIsWaitingForVerification(false);
          setIsPlaying(true);
        }
      } else {
        setIsPlaying(true);
      }
    } else if (playerState === 2) {
      setIsPlaying(false);
    } else if (playerState === 0) {
      // Video ended
      setIsPlaying(false);
    }
  };

  const onPlayerReady = (event: any) => {
    console.log("YouTube player ready");
    // Store player reference
    playerRef.current = event.target;
    setPlayerError(false);
    
    // Start interval to track progress
    const intervalId = setInterval(() => {
      if (playerRef.current) {
        try {
          const currentTime = playerRef.current.getCurrentTime() || 0;
          const duration = playerRef.current.getDuration() || 0;
          setCurrentTime(currentTime);
          setDuration(duration);
          const progressPercent = (currentTime / duration) * 100;
          setProgress(progressPercent);
        } catch (err) {
          console.error("Error updating progress:", err);
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  };

  const onPlayerError = (event: any) => {
    console.error("YouTube player error:", event);
    setPlayerError(true);
    setIsWaitingForVerification(false);
    toast({
      title: "Playback Error",
      description: "Could not play this video. Try a different song.",
      variant: "destructive"
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const toggleVideoMode = () => {
    setVideoMode(!videoMode);
  };

  // Dynamic player height based on screen size
  const getPlayerHeight = () => {
    if (!videoMode) return 0;
    
    if (containerWidth <= 640) {
      return containerWidth * 0.5625; // 16:9 ratio
    } else {
      return Math.min(containerWidth * 0.5, 360); // Max 360px height on larger screens
    }
  };

  const playerHeight = getPlayerHeight();
  const playerOptions = {
    height: playerHeight,
    width: '100%',
    playerVars: {
      autoplay: 0, // Do not autoplay until we verify the song
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0
    }
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
            <div className="emoji-bg mr-2 w-6 h-6 sm:w-8 sm:h-8">
              <span className="text-base sm:text-lg">💬</span>
            </div>
            <span className="hidden sm:inline">Chat</span>
          </button>
        </div>
      )}
      
      <div className="flex-1 flex flex-col items-center justify-between px-3 sm:px-6 py-4 sm:py-8 relative">
        <div className="absolute top-10 left-[10%] text-xl opacity-10 float-slow">🎵</div>
        <div className="absolute top-[15%] right-[15%] text-xl opacity-10 float">🎶</div>
        <div className="absolute bottom-[20%] left-[20%] text-xl opacity-10 float-fast">🎧</div>
        
        <div className="w-full mb-4 sm:mb-6 overflow-hidden rounded-lg shadow-[0_0_30px_rgba(155,135,245,0.2)] border border-syncme-light-purple/10">
          {song.youtubeId ? (
            videoMode ? (
              <div className="w-full relative" style={{ height: playerHeight }}>
                {isWaitingForVerification && (
                  <div className="absolute inset-0 flex items-center justify-center bg-syncme-dark/80 z-10">
                    <div className="text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-syncme-light-purple border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-blue-200">Verifying song match...</p>
                    </div>
                  </div>
                )}
                <YouTube
                  videoId={song.youtubeId}
                  opts={playerOptions}
                  onReady={onPlayerReady}
                  onStateChange={onStateChange}
                  onError={onPlayerError}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center text-blue-200 w-full h-16 bg-syncme-dark/80">
                <Music className="mr-2" size={20} />
                <span>Playing audio only</span>
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-blue-200/50 bg-syncme-dark/80 min-h-[120px]">
              <p>No YouTube video available</p>
            </div>
          )}
        </div>
        
        <div className="w-full flex justify-center mb-4">
          <button
            onClick={toggleVideoMode}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-full border text-sm ${videoMode ? 'bg-syncme-light-purple text-white border-syncme-light-purple' : 'bg-syncme-dark/40 text-blue-200 border-syncme-light-purple/30'}`}
          >
            {videoMode ? (
              <>
                <Video size={16} className="mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Video Mode</span>
                <span className="xs:hidden">Video</span>
              </>
            ) : (
              <>
                <Music size={16} className="mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Audio Only</span>
                <span className="xs:hidden">Audio</span>
              </>
            )}
          </button>
        </div>
        
        <div className="w-full">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
              <span className="mr-2">🎵</span> {song.title}
            </h2>
            <p className="text-blue-200/80 flex items-center text-sm sm:text-base">
              <span className="mr-2">👨‍🎤</span> {song.artist}
            </p>
          </div>
          
          <div className="w-full h-2 bg-syncme-light-purple/10 rounded-full mb-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-syncme-light-purple to-syncme-purple rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs sm:text-sm text-blue-200/70 mb-4 sm:mb-6">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          <div className="flex items-center justify-center space-x-4 sm:space-x-8">
            <button className="text-blue-200/70 hover:text-white transition-colors">
              <SkipBack size={24} className="sm:w-7 sm:h-7" />
            </button>
            
            <button 
              onClick={togglePlayPause}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${isWaitingForVerification ? 'bg-syncme-light-purple/50' : 'bg-syncme-light-purple'} flex items-center justify-center text-white hover:bg-syncme-purple transition-colors shadow-[0_0_20px_rgba(155,135,245,0.5)]`}
              disabled={isWaitingForVerification}
            >
              {isPlaying ? (
                <Pause size={28} className="sm:w-8 sm:h-8" />
              ) : (
                <Play size={28} className="sm:w-8 sm:h-8 ml-1" />
              )}
            </button>
            
            <button className="text-blue-200/70 hover:text-white transition-colors">
              <SkipForward size={24} className="sm:w-7 sm:h-7" />
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
