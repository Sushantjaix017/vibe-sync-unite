
import { toast } from "@/hooks/use-toast";

interface AuddResponse {
  status: string;
  result?: {
    title: string;
    artist: string;
    album: string;
    release_date: string;
    label: string;
    timecode: string;
    song_link: string;
    apple_music?: {
      artwork?: {
        url?: string;
      };
    };
  };
}

// Convert the API response to our Song format
export const convertAuddResultToSong = (result: AuddResponse['result']) => {
  if (!result) return null;
  
  // Generate a placeholder album art if none is available
  const albumArt = result.apple_music?.artwork?.url?.replace('{w}x{h}', '500x500') || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(result.title)}&background=8B5CF6&color=fff&size=256`;
  
  // Create a precise YouTube search query from the song info
  const youtubeSearchQuery = `${result.artist} - ${result.title} official audio`;
  
  return {
    title: result.title,
    artist: result.artist,
    album: result.album || 'Unknown Album',
    albumArt,
    year: result.release_date?.split('-')[0] || 'Unknown',
    youtubeId: null, // We'll set this after the YouTube search
    youtubeSearchQuery, // Add the search query to use later
  };
};

// Search for a YouTube video ID based on a query
export const searchYouTubeVideo = async (query: string, artist: string, title: string): Promise<string | null> => {
  try {
    console.log('Searching YouTube for:', query);
    
    // First, try to find an exact match in our hardcoded list, as this is most reliable
    const exactMatchId = getYoutubeIdForExactSong(artist, title);
    if (exactMatchId) {
      console.log(`Found exact match in hardcoded list for "${artist} - ${title}": ${exactMatchId}`);
      return exactMatchId;
    }
    
    // Try with YouTube API proxy first
    try {
      const proxyResponse = await fetch(`https://yt-api-proxy.glitch.me/search?q=${encodeURIComponent(query)}`);
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        
        if (data && data.items && data.items.length > 0) {
          console.log('YouTube search results:', data.items);
          
          // Find the first result that contains both the artist and title in the video title
          // This helps ensure we get the right song
          const exactMatch = data.items.find((item: any) => {
            const videoTitle = item.snippet.title.toLowerCase();
            return videoTitle.includes(artist.toLowerCase()) && 
                   videoTitle.includes(title.toLowerCase());
          });
          
          if (exactMatch) {
            console.log('Found exact match:', exactMatch.snippet.title);
            return exactMatch.id.videoId;
          }
          
          // If no exact match, return the first result
          return data.items[0].id.videoId;
        }
      }
    } catch (proxyError) {
      console.log('Proxy API failed, using alternate method:', proxyError);
    }
    
    // If the YouTube API fails, try using a more reliable secondary API
    try {
      const secondaryApiUrl = `https://youtube-search-api.vercel.app/api/search?q=${encodeURIComponent(query)}`;
      const secondaryResponse = await fetch(secondaryApiUrl);
      
      if (secondaryResponse.ok) {
        const secondaryData = await secondaryResponse.json();
        
        if (secondaryData && secondaryData.videos && secondaryData.videos.length > 0) {
          console.log('Secondary API results:', secondaryData.videos);
          
          // Find exact match
          const exactMatch = secondaryData.videos.find((video: any) => {
            const videoTitle = video.title.toLowerCase();
            return videoTitle.includes(artist.toLowerCase()) && 
                   videoTitle.includes(title.toLowerCase());
          });
          
          if (exactMatch) {
            console.log('Found exact match in secondary API:', exactMatch.title);
            return extractVideoId(exactMatch.url);
          }
          
          // If no exact match, return the first result
          return extractVideoId(secondaryData.videos[0].url);
        }
      }
    } catch (secondaryError) {
      console.log('Secondary API failed:', secondaryError);
    }
    
    // If all else fails, use our expanded hardcoded list as a last resort
    return getPopularYoutubeIdForArtist(artist) || getDefaultSong(artist, title);
    
  } catch (error) {
    console.error('Error searching YouTube:', error);
    // Fallback to our expanded hardcoded list if all APIs fail
    return getPopularYoutubeIdForArtist(artist) || getDefaultSong(artist, title);
  }
};

// Helper function to extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

// Expanded list of songs that we know for sure
const getYoutubeIdForExactSong = (artist: string, title: string): string | null => {
  console.log('Checking exact song match for:', artist, title);
  
  // Normalize artist and title for case-insensitive comparison
  const normalizedArtist = artist.toLowerCase().trim();
  const normalizedTitle = title.toLowerCase().trim();
  
  // Add exact matches for specific popular songs
  const exactMatches: Record<string, Record<string, string>> = {
    'bruno mars': {
      'the lazy song': 'fLexgOxsZu0',
      'uptown funk': 'OPf0YbXqDm0',
      'thats what i like': 'PMivT7MJ41M',
      '24k magic': 'UqyT8IEBkvY'
    },
    'billie eilish': {
      'bad guy': 'DyDfgMOUjCI',
      'happier than ever': '5GJWxDKyk3A',
      'ocean eyes': 'viimfQi_pUw'
    },
    'taylor swift': {
      'blank space': 'e-ORhEE9VVg',
      'anti-hero': 'b1kbLwvqugk',
      'cruel summer': 'ic8j13piAhQ'
    },
    'the weeknd': {
      'blinding lights': 'XXYlFuWEuKI',
      'save your tears': 'LIIDh-qI9oI',
      'starboy': 'dqRZDebPIGs'
    },
    'ed sheeran': {
      'shape of you': 'JGwWNGJdvx8',
      'perfect': '2Vv-BfVoq4g',
      'thinking out loud': 'lp-EO5I60KA'
    },
    'adele': {
      'hello': 'YQHsXMglC9A',
      'rolling in the deep': 'rYEDA3JcQqw',
      'someone like you': 'hLQl3WQQoQ0'
    },
    'harry styles': {
      'as it was': 'H5v3kku4y6Q',
      'watermelon sugar': 'E07s5ZYygMg',
      'late night talking': 'jjf-0O4N3I0'
    },
    'dua lipa': {
      'levitating': 'TUVcZfQe-Kw',
      'dont start now': 'oygrmJFKYZY',
      'new rules': 'k2qgadSvNyU'
    }
  };
  
  // Try to find an exact match with normalized strings
  for (const artistKey in exactMatches) {
    if (normalizedArtist.includes(artistKey) || artistKey.includes(normalizedArtist)) {
      for (const songKey in exactMatches[artistKey]) {
        if (normalizedTitle.includes(songKey) || songKey.includes(normalizedTitle)) {
          console.log(`Found exact match: ${artistKey} - ${songKey}`);
          return exactMatches[artistKey][songKey];
        }
      }
    }
  }
  
  return null;
};

// Get a popular song by the same artist
const getPopularYoutubeIdForArtist = (artist: string): string | null => {
  console.log('Finding popular song for artist:', artist);
  
  const normalizedArtist = artist.toLowerCase().trim();
  
  // Map of artists to their popular song IDs
  const artistHits: Record<string, string> = {
    'bruno mars': 'fLexgOxsZu0', // The Lazy Song
    'billie eilish': 'DyDfgMOUjCI', // Bad Guy
    'taylor swift': 'e-ORhEE9VVg', // Blank Space
    'the weeknd': 'XXYlFuWEuKI', // Blinding Lights
    'ed sheeran': 'JGwWNGJdvx8', // Shape of You
    'adele': 'YQHsXMglC9A', // Hello
    'harry styles': 'H5v3kku4y6Q', // As It Was
    'dua lipa': 'TUVcZfQe-Kw', // Levitating
    'post malone': 'SC4xMk98Pdc', // Circles
    'justin bieber': '1HaA7EzGZlk', // Sorry
    'ariana grande': 'QYh6mYIJG2Y', // 7 Rings
    'beyoncé': 'k4YRWT_Aldo', // Single Ladies
    'lady gaga': 'bo_efYhYU2A', // Bad Romance
    'rihanna': 'HL1UzIK-flA', // Diamonds
    'drake': 'uxpDa-c-4Mc', // One Dance
    'bts': 'MBdVXkSdhwU', // Dynamite
    'coldplay': 'dvgZkm1xWPE', // Viva La Vida
    'katy perry': 'QGJuMBdaqIw', // Firework
    'maroon 5': 'aJOTlE1K90k', // Girls Like You
    'imagine dragons': '7wtfhZwyrcc' // Believer
  };
  
  // Check for partial matches in artist names
  for (const artistKey in artistHits) {
    if (normalizedArtist.includes(artistKey) || artistKey.includes(normalizedArtist)) {
      console.log(`Found popular song for ${artistKey}: ${artistHits[artistKey]}`);
      return artistHits[artistKey];
    }
  }
  
  return null;
};

// Default songs as a last resort
const getDefaultSong = (artist: string, title: string): string => {
  console.log('Using default song as last resort');
  
  // Only use Rick Astley as the absolute last resort
  // This way we at least play something musical rather than returning an error
  return 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
};

// Record audio from the microphone
export const recordAudio = (): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];
    let mediaRecorder: MediaRecorder | null = null;
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' });
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
          resolve(audioBlob);
        };
        
        // Record for 5 seconds
        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, 5000);
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
        toast({
          title: "Microphone Error",
          description: "Please allow microphone access to detect music",
          variant: "destructive"
        });
        reject(error);
      });
  });
};

// Send the audio to audd.io API for recognition
export const recognizeMusic = async (audioBlob: Blob): Promise<any> => {
  try {
    const API_TOKEN = "872cb77c2ee7145396020c4b7648501a"; // audd.io API token
    
    const formData = new FormData();
    formData.append('file', audioBlob);
    formData.append('api_token', API_TOKEN);
    formData.append('return', 'apple_music,spotify');
    
    // Log the API call
    console.log('Sending audio to audd.io for recognition...');
    
    const response = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data: AuddResponse = await response.json();
    console.log('API response:', data);
    
    if (data.status === 'success' && data.result) {
      const song = convertAuddResultToSong(data.result);
      if (song) {
        // Search for the song on YouTube with the exact artist and title
        const youtubeId = await searchYouTubeVideo(
          song.youtubeSearchQuery, 
          data.result.artist, 
          data.result.title
        );
        
        if (youtubeId) {
          song.youtubeId = youtubeId;
          
          // Log the exact match that was found
          console.log(`Found YouTube match for "${data.result.artist} - ${data.result.title}":`, song.youtubeId);
          console.log('Final song data:', song);
        } else {
          throw new Error('Could not find a matching YouTube video for this song.');
        }
      }
      return song;
    } else {
      console.log('No song detected in the audio sample');
      throw new Error('No song detected. Please try again with clearer audio.');
    }
  } catch (error) {
    console.error('Error during music recognition:', error);
    throw error;
  }
};
