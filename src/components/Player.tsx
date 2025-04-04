import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Video } from 'lucide-react';
import Header from './Header';
import YouTube from 'react-youtube';
import { toast } from "@/hooks/use-toast";
import { searchYouTubeVideo, verifyYouTubeMatch } from '@/utils/musicDetection';

interface PlayerProps {
  song: {
    title: string;
    artist: string;
    albumArt: string;
    youtubeId?: string;
    isVerified?: boolean;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [playerError, setPlayerError] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [currentYoutubeId, setCurrentYoutubeId] = useState<string | undefined>(song.youtubeId);
  const [isVerifyingVideo, setIsVerifyingVideo] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [skipRickRoll, setSkipRickRoll] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetPlayerState = () => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setSongTitle('');
    setPlayerError(false);
  };

  useEffect(() => {
    const verifySongMatch = async () => {
      resetPlayerState();
      
      if (!song || !song.title || !song.artist) {
        console.error("Invalid song data:", song);
        return;
      }
      
      console.log(`Verifying song: ${song.artist} - ${song.title} (ID: ${song.youtubeId})`);
      setIsVerifyingVideo(true);
      
      try {
        let finalYoutubeId = song.youtubeId;
        let videoIsVerified = false;
        
        if (skipRickRoll && finalYoutubeId === 'dQw4w9WgXcQ') {
          console.log("Rick Astley detected, searching for the actual song...");
          
          const searchQueries = [
            `${song.artist} - ${song.title} official audio`,
            `${song.artist} - ${song.title} official video`,
            `${song.artist} - ${song.title} lyrics`,
            `${song.title} by ${song.artist}`
          ];
          
          for (const query of searchQueries) {
            const alternativeId = await searchYouTubeVideo(query, song.artist, song.title);
            
            if (alternativeId && alternativeId !== 'dQw4w9WgXcQ') {
              toast({
                title: "Better Match Found",
                description: `Found actual video for "${song.title}"`,
              });
              finalYoutubeId = alternativeId;
              break;
            }
          }
        }
        
        if (song.isVerified && finalYoutubeId && finalYoutubeId !== 'dQw4w9WgXcQ') {
          console.log("Song is pre-verified, using provided YouTube ID");
          finalYoutubeId = finalYoutubeId;
          videoIsVerified = true;
        }
        else if (finalYoutubeId) {
          const isMatch = await verifyYouTubeMatch(finalYoutubeId, song.artist, song.title);
          
          if (isMatch) {
            console.log("YouTube ID matches song, using it");
            finalYoutubeId = finalYoutubeId;
            videoIsVerified = true;
          } else {
            console.log("YouTube ID does not match song, searching for better match");
            const specificQueries = [
              `${song.artist} - ${song.title} official audio`,
              `${song.artist} - ${song.title} official video`,
              `${song.artist} - ${song.title} lyrics`,
              `${song.title} by ${song.artist}`
            ];
            
            for (const query of specificQueries) {
              const betterMatch = await searchYouTubeVideo(query, song.artist, song.title);
              
              if (betterMatch && betterMatch !== finalYoutubeId && betterMatch !== 'dQw4w9WgXcQ') {
                const newIsVerified = await verifyYouTubeMatch(betterMatch, song.artist, song.title);
                
                if (newIsVerified) {
                  console.log(`Found verified match with query "${query}": ${betterMatch}`);
                  finalYoutubeId = betterMatch;
                  videoIsVerified = true;
                  toast({
                    title: "Better Match Found",
                    description: `Playing improved match for "${song.title}"`,
                  });
                  break;
                }
              }
            }
            
            if (!videoIsVerified) {
              console.log("No verified match found, using best available");
            }
          }
        }
        else {
          console.log("No YouTube ID provided, searching for one");
          const searchQuery = `${song.artist} - ${song.title} official audio`;
          const newId = await searchYouTubeVideo(searchQuery, song.artist, song.title);
          
          if (newId && newId !== 'dQw4w9WgXcQ') {
            console.log(`Found YouTube match: ${newId}`);
            finalYoutubeId = newId;
            toast({
              title: "Match Found",
              description: `Found music video for "${song.title}"`,
            });
          } else {
            console.error("Could not find YouTube match for:", song);
            toast({
              title: "Playback Issue",
              description: "Could not find a match for this song",
              variant: "destructive"
            });
          }
        }
        
        if (finalYoutubeId) {
          setCurrentYoutubeId(finalYoutubeId);
        } else {
          toast({
            title: "Playback Error",
            description: "Could not find a video for this song",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error verifying song match:", error);
        if (retryCount < 3) {
          setRetryCount(retryCount + 1);
          
          try {
            const searchQuery = `${song.artist} - ${song.title} official`;
            const fallbackId = await searchYouTubeVideo(searchQuery, song.artist, song.title);
            
            if (fallbackId && fallbackId !== 'dQw4w9WgXcQ') {
              setCurrentYoutubeId(fallbackId);
              toast({
                title: "Verification Failed",
                description: "Using best available match",
                variant: "default"
              });
            }
          } catch (secondError) {
            console.error("Failed to find fallback match:", secondError);
          }
        } else {
          toast({
            title: "Playback Error",
            description: "Could not verify song match after multiple attempts",
            variant: "destructive"
          });
        }
      } finally {
        setIsVerifyingVideo(false);
      }
    };
    
    if (song) {
      verifySongMatch();
    }
    
    setRetryCount(0);
  }, [song]);

  useEffect(() => {
    if (currentYoutubeId && playerRef.current && playerRef.current.internalPlayer) {
      try {
        playerRef.current.internalPlayer.loadVideoById(currentYoutubeId);
        
        if (isPlaying) {
          playerRef.current.internalPlayer.playVideo();
        } else {
          playerRef.current.internalPlayer.pauseVideo();
        }
      } catch (error) {
        console.error("Error updating YouTube video:", error);
      }
    }
  }, [currentYoutubeId]);

  const togglePlayPause = () => {
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
        setIsPlaying(!isPlaying);
      }
    } else {
      console.log("Player reference not available yet");
      setIsPlaying(!isPlaying);
    }
  };

  const onStateChange = (event: any) => {
    const playerState = event.data;
    
    if (playerState === 1) {
      setIsPlaying(true);
      
      if (!songTitle && playerRef.current && playerRef.current.internalPlayer) {
        try {
          playerRef.current.internalPlayer.getVideoData().then((data: any) => {
            if (data && data.title) {
              setSongTitle(data.title);
              console.log("Now playing:", data.title);
              
              const videoTitle = data.title.toLowerCase();
              const expectedArtist = song.artist.toLowerCase();
              const expectedTitle = song.title.toLowerCase();
              
              const artistMatches = videoTitle.includes(expectedArtist);
              const titleMatches = videoTitle.includes(expectedTitle);
              
              if (!artistMatches && !titleMatches) {
                console.warn("Video title doesn't match expected song:", data.title);
                toast({
                  title: "Song Mismatch Warning",
                  description: `Playing closest match to "${song.artist} - ${song.title}"`,
                  variant: "default"
                });
                
                const searchNewMatch = async () => {
                  try {
                    const exactQuery = `${song.artist} - ${song.title} official music video`;
                    const newMatch = await searchYouTubeVideo(exactQuery, song.artist, song.title);
                    
                    if (newMatch && newMatch !== currentYoutubeId) {
                      const isVerified = await verifyYouTubeMatch(newMatch, song.artist, song.title);
                      
                      if (isVerified) {
                        toast({
                          title: "Better Match Found",
                          description: "Switching to correct video",
                        });
                        setCurrentYoutubeId(newMatch);
                      }
                    }
                  } catch (err) {
                    console.error("Error finding better match:", err);
                  }
                };
                
                searchNewMatch();
              }
            }
          }).catch((error) => {
            console.error("Error getting video data:", error);
          });
        } catch (e) {
          console.log("Couldn't get video data:", e);
        }
      }
    } else if (playerState === 2) {
      setIsPlaying(false);
    } else if (playerState === 0) {
      setIsPlaying(false);
    }
  };

  const onPlayerReady = (event: any) => {
    console.log("YouTube player ready");
    playerRef.current = event.target;
    setPlayerError(false);
    
    if (isPlaying) {
      try {
        playerRef.current.playVideo();
      } catch (err) {
        console.error("Error starting playback:", err);
      }
    }
    
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
    
    const searchForAlternative = async () => {
      toast({
        title: "Playback Error",
        description: "Looking for an alternative source...",
        variant: "default"
      });
      
      try {
        const searches = [
          `${song.artist} - ${song.title} audio only`,
          `${song.artist} - ${song.title} lyrics video`,
          `${song.title} by ${song.artist} official`,
          `${song.artist} ${song.title}`
        ];
        
        let alternativeId = null;
        
        for (const query of searches) {
          if (alternativeId) break;
          
          alternativeId = await searchYouTubeVideo(
            query, 
            song.artist, 
            song.title
          );
          
          if (alternativeId && alternativeId !== currentYoutubeId && alternativeId !== 'dQw4w9WgXcQ') {
            console.log(`Found alternative video with query "${query}": ${alternativeId}`);
            break;
          }
        }
        
        if (alternativeId && alternativeId !== currentYoutubeId && alternativeId !== 'dQw4w9WgXcQ') {
          setCurrentYoutubeId(alternativeId);
          
          toast({
            title: "Alternative Found",
            description: "Playing from alternative source",
            variant: "default"
          });
        } else {
          if (retryCount >= 2) {
            const artistQuery = `${song.artist} official audio`;
            const lastResortId = await searchYouTubeVideo(artistQuery, song.artist, "");
            
            if (lastResortId && lastResortId !== currentYoutubeId && lastResortId !== 'dQw4w9WgXcQ') {
              setCurrentYoutubeId(lastResortId);
              toast({
                title: "Playing Different Song",
                description: `Couldn't play "${song.title}", trying another song by ${song.artist}`,
                variant: "default"
              });
            } else {
              toast({
                title: "Playback Error",
                description: "Could not play this song. Try detecting again.",
                variant: "destructive"
              });
            }
          } else {
            setRetryCount(retryCount + 1);
            toast({
              title: "Retrying...",
              description: "Trying another approach",
              variant: "default"
            });
            
            const lastAttemptQuery = `"${song.title}" "${song.artist}" music`;
            const lastAttemptId = await searchYouTubeVideo(lastAttemptQuery, song.artist, song.title);
            
            if (lastAttemptId && lastAttemptId !== currentYoutubeId && lastAttemptId !== 'dQw4w9WgXcQ') {
              setCurrentYoutubeId(lastAttemptId);
            } else {
              toast({
                title: "Playback Error",
                description: "Could not play this song. Try detecting again.",
                variant: "destructive"
              });
            }
          }
        }
      } catch (error) {
        console.error("Error finding alternative:", error);
        toast({
          title: "Playback Error",
          description: "Could not play this video. Try detecting again.",
          variant: "destructive"
        });
      }
    };
    
    searchForAlternative();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const toggleVideoMode = () => {
    setVideoMode(!videoMode);
  };

  const playerHeight = videoMode ? Math.min(containerWidth * 0.5625, 360) : 0;
  const playerOptions = {
    height: playerHeight,
    width: '100%',
    playerVars: {
      autoplay: isPlaying ? 1 : 0,
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
        
        <div className="w-full mb-6 overflow-hidden rounded-lg shadow-[0_0_30px_rgba(155,135,245,0.2)] border border-syncme-light-purple/10">
          {isVerifyingVideo ? (
            <div className="flex items-center justify-center w-full h-48 bg-syncme-dark/80">
              <div className="text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-syncme-light-purple border-t-transparent rounded-full mb-2"></div>
                <p className="text-blue-200">Verifying best match...</p>
              </div>
            </div>
          ) : currentYoutubeId ? (
            videoMode ? (
              <div className="w-full" style={{ height: playerHeight }}>
                <YouTube
                  videoId={currentYoutubeId}
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
            {songTitle && (
              <p className="text-xs text-blue-200/50 mt-1">
                Playing: {songTitle}
              </p>
            )}
          </div>
          
          <div className="w-full h-2 bg-syncme-light-purple/10 rounded-full mb-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-syncme-light-purple to-syncme-purple rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-blue-200/70 mb-6">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
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
