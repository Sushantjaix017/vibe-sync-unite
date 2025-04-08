
import { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeString, stringsMatch } from '@/utils/musicDetection';

interface UseYoutubePlayerOptions {
  searchQuery: string;
  audioOnly?: boolean;
  artist?: string;
  title?: string;
}

interface UseYoutubePlayerResult {
  videoId: string | null;
  isLoading: boolean;
  error: string | null;
  isVerified: boolean;
  player: any;
  setPlayer: (player: any) => void;
  playerRef: React.RefObject<HTMLDivElement>;
  progress: number;
  duration: number;
  currentTime: number;
  seekTo: (seconds: number) => void;
  isPlaying: boolean;
  togglePlayPause: () => void;
}

export function useYoutubePlayer({
  searchQuery,
  audioOnly = false,
  artist = '',
  title = ''
}: UseYoutubePlayerOptions): UseYoutubePlayerResult {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const fetchVideoId = useCallback(async (query: string, retry = false) => {
    if (retry) {
      // If this is a retry, increment the count
      setRetryCount(prevCount => prevCount + 1);
    } else {
      // If this is a fresh search, reset the retry count
      setRetryCount(0);
    }

    try {
      setIsLoading(true);
      setError(null);

      // Different query variations to try
      const queries = [
        `${query}${audioOnly ? ' official audio' : ' official music video'}`,
        query,
        `${query} lyrics`
      ];
      
      let bestId: string | null = null;
      let foundVerifiedMatch = false;
      
      // Try each query sequentially
      for (const searchQuery of queries) {
        try {
          // Try with YouTube API proxy
          const proxyResponse = await fetch(`https://yt-api-proxy.glitch.me/search?q=${encodeURIComponent(searchQuery)}`);
          
          if (proxyResponse.ok) {
            const data = await proxyResponse.json();
            
            if (data && data.items && data.items.length > 0) {
              console.log('YouTube search results:', data.items);
              
              // Look for verified match
              for (const item of data.items) {
                // Skip the notorious rickroll
                if (item.id.videoId === 'dQw4w9WgXcQ') continue;
                
                const videoTitle = item.snippet.title;
                
                // Check if this could be a match
                if (artist && title) {
                  const isMatch = stringsMatch(videoTitle, artist) && stringsMatch(videoTitle, title);
                  
                  if (isMatch) {
                    setIsVerified(true);
                    foundVerifiedMatch = true;
                    setVideoId(item.id.videoId);
                    return item.id.videoId;
                  }
                }
                
                // Store the first valid result as a fallback
                if (!bestId) {
                  bestId = item.id.videoId;
                }
              }
            }
          }
        } catch (err) {
          console.error(`Error with query "${searchQuery}":`, err);
          // Continue to the next query
        }
        
        // If we found a verified match, no need to try other queries
        if (foundVerifiedMatch) break;
      }
      
      // If we found an unverified match and exhausted all queries, use that
      if (bestId && !foundVerifiedMatch) {
        setIsVerified(false);
        setVideoId(bestId);
        return bestId;
      }
      
      // If we've retried fewer than 3 times and found nothing, try again with a delay
      if (!bestId && retryCount < 3) {
        setTimeout(() => {
          fetchVideoId(query, true);
        }, 1000); // 1 second delay between retries
        return null;
      }
      
      if (!bestId) {
        setError("Couldn't find a matching video");
        setVideoId(null);
      }
      
      return bestId;
    } catch (err) {
      console.error('Error fetching video ID:', err);
      setError('Error finding video');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [audioOnly, artist, title, retryCount]);

  const seekTo = useCallback((seconds: number) => {
    if (player) {
      player.seekTo(seconds);
    }
  }, [player]);

  const togglePlayPause = useCallback(() => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  }, [player, isPlaying]);

  // Effect to search for video when searchQuery changes
  useEffect(() => {
    if (searchQuery) {
      fetchVideoId(searchQuery);
    }
  }, [searchQuery, fetchVideoId]);

  // Effect to handle player state changes
  useEffect(() => {
    if (!player) return;

    const handleStateChange = (event: any) => {
      // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
      switch (event.data) {
        case 1: // playing
          setIsPlaying(true);
          break;
        case 0: // ended
        case 2: // paused
          setIsPlaying(false);
          break;
        default:
          break;
      }
    };

    player.addEventListener('onStateChange', handleStateChange);

    return () => {
      player.removeEventListener('onStateChange', handleStateChange);
    };
  }, [player]);

  // Effect to update progress
  useEffect(() => {
    if (!player) return;

    // Get initial duration
    const updateDuration = () => {
      try {
        const newDuration = player.getDuration() || 0;
        setDuration(newDuration);
      } catch (err) {
        console.error('Error getting duration:', err);
      }
    };

    // Set up progress tracking interval
    const setupProgressInterval = () => {
      // Clear any existing interval first
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }

      progressIntervalRef.current = window.setInterval(() => {
        try {
          if (player && isPlaying) {
            const currentTime = player.getCurrentTime() || 0;
            const videoDuration = player.getDuration() || 0;
            
            if (videoDuration) {
              setProgress(currentTime / videoDuration);
              setCurrentTime(currentTime);
            }
          }
        } catch (err) {
          console.error('Error updating progress:', err);
        }
      }, 1000);
    };

    // Initial setup
    updateDuration();
    setupProgressInterval();

    // Cleanup function
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [player, isPlaying]);

  return {
    videoId,
    isLoading,
    error,
    isVerified,
    player,
    setPlayer,
    playerRef,
    progress,
    duration,
    currentTime,
    seekTo,
    isPlaying,
    togglePlayPause
  };
}
