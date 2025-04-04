
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

// Expanded exact match database for popular songs
const EXACT_SONG_MATCHES: Record<string, Record<string, string>> = {
  'bruno mars': {
    'the lazy song': 'fLexgOxsZu0',
    'uptown funk': 'OPf0YbXqDm0',
    'thats what i like': 'PMivT7MJ41M',
    '24k magic': 'UqyT8IEBkvY',
    'locked out of heaven': 'e-fA-gBCkj0',
    'when i was your man': 'ekzHIouo8Q4',
    'just the way you are': 'LjhCEhWiKXk',
    'lazy song': 'fLexgOxsZu0' // Added alternate title
  },
  'billie eilish': {
    'bad guy': 'DyDfgMOUjCI',
    'happier than ever': '5GJWxDKyk3A',
    'ocean eyes': 'viimfQi_pUw',
    'everything i wanted': 'qCTMq7xvdXU',
    'lovely': 'V1Pl8CzNzCw'
  },
  'taylor swift': {
    'blank space': 'e-ORhEE9VVg',
    'anti-hero': 'b1kbLwvqugk',
    'cruel summer': 'ic8j13piAhQ',
    'shake it off': 'nfWlot6h_JM',
    'love story': 'Y7SvoHVmX74',
    'style': '-CmadmM5cOk'
  },
  'the weeknd': {
    'blinding lights': 'XXYlFuWEuKI',
    'save your tears': 'LIIDh-qI9oI',
    'starboy': 'dqRZDebPIGs',
    'call out my name': 'm4ZCoTRUSn8',
    'die for you': 'YxTM97Vp4c8',
    'after hours': 'ygTZZpVkmKg'
  },
  'ed sheeran': {
    'shape of you': 'JGwWNGJdvx8',
    'perfect': '2Vv-BfVoq4g',
    'thinking out loud': 'lp-EO5I60KA',
    'photograph': 'nSDgHBxUbVQ',
    'bad habits': 'orJSJGHjBLI'
  },
  'adele': {
    'hello': 'YQHsXMglC9A',
    'rolling in the deep': 'rYEDA3JcQqw',
    'someone like you': 'hLQl3WQQoQ0',
    'set fire to the rain': 'Ri7-vnrJD3k',
    'easy on me': 'U3ASj1L6_sY'
  },
  'harry styles': {
    'as it was': 'H5v3kku4y6Q',
    'watermelon sugar': 'E07s5ZYygMg',
    'late night talking': 'jjf-0O4N3I0',
    'adore you': 'VF-r5TtlT9w',
    'sign of the times': 'qN4ooNx77u0'
  },
  'dua lipa': {
    'levitating': 'TUVcZfQe-Kw',
    'dont start now': 'oygrmJFKYZY',
    'new rules': 'k2qgadSvNyU',
    'physical': '9HDEHj2yzew',
    'one kiss': 'DkeiKbqa02g'
  },
  'versus': {
    '7 years rap (remix)': 'Ckt9NCZ7C9A',
    '7 years rap': 'Ckt9NCZ7C9A'
  },
  'jp saxe': {
    'if the world was ending (spanish remix)': 'shQJqWH7fqU',
    'if the world was ending': 'shQJqWH7fqU'
  },
  'sadie jean': {
    'locksmith': 'ytuaYCxLtEQ'
  }
};

// Search for a YouTube video ID based on a query
export const searchYouTubeVideo = async (query: string, artist: string, title: string): Promise<string | null> => {
  try {
    console.log('Searching YouTube for:', query);
    
    // Step 1: Try to find an exact match in our expanded database (most reliable)
    const exactMatchId = getExactSongMatch(artist, title);
    if (exactMatchId) {
      console.log(`Found exact match in database for "${artist} - ${title}": ${exactMatchId}`);
      return exactMatchId;
    }

    // Step 2: Use a direct match for specific songs that are commonly detected
    const directMatchId = getDirectSongMatch(artist, title);
    if (directMatchId) {
      console.log(`Found direct match for "${artist} - ${title}": ${directMatchId}`);
      return directMatchId;
    }
    
    // Step 3: Try the YouTube Search API proxy
    try {
      const searchQuery = encodeURIComponent(`${artist} - ${title} official audio`);
      const proxyResponse = await fetch(`https://yt-api-proxy.glitch.me/search?q=${searchQuery}`);
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        
        if (data && data.items && data.items.length > 0) {
          console.log('YouTube search results:', data.items);
          
          // Find the first result that contains both the artist and title in the video title
          const normalizedArtist = artist.toLowerCase().trim();
          const normalizedTitle = title.toLowerCase().trim();
          
          const exactMatch = data.items.find((item: any) => {
            const videoTitle = item.snippet.title.toLowerCase();
            
            // Check if video title contains both artist and song name
            const artistMatch = videoTitle.includes(normalizedArtist);
            const titleMatch = videoTitle.includes(normalizedTitle);
            
            return artistMatch && titleMatch;
          });
          
          if (exactMatch) {
            console.log('Found exact match in YouTube API:', exactMatch.snippet.title);
            return exactMatch.id.videoId;
          }
          
          // If no exact match, return the first result but show a warning
          console.log('No exact match found, using first result:', data.items[0].snippet.title);
          toast({
            title: "Song Match Warning",
            description: `Playing closest match to "${artist} - ${title}"`,
            variant: "default"
          });
          return data.items[0].id.videoId;
        }
      }
    } catch (proxyError) {
      console.log('YouTube API proxy failed:', proxyError);
    }
    
    // Step 4: Try the secondary API as fallback
    try {
      const secondaryApiUrl = `https://youtube-search-api.vercel.app/api/search?q=${encodeURIComponent(`${artist} ${title} official audio`)}`;
      const secondaryResponse = await fetch(secondaryApiUrl);
      
      if (secondaryResponse.ok) {
        const secondaryData = await secondaryResponse.json();
        
        if (secondaryData && secondaryData.videos && secondaryData.videos.length > 0) {
          console.log('Secondary API results:', secondaryData.videos);
          
          // Find exact match
          const normalizedArtist = artist.toLowerCase().trim();
          const normalizedTitle = title.toLowerCase().trim();
          
          const exactMatch = secondaryData.videos.find((video: any) => {
            const videoTitle = video.title.toLowerCase();
            return videoTitle.includes(normalizedArtist) && 
                   videoTitle.includes(normalizedTitle);
          });
          
          if (exactMatch) {
            console.log('Found exact match in secondary API:', exactMatch.title);
            return extractVideoId(exactMatch.url);
          }
          
          // If no exact match, return the first result but show a warning
          console.log('No exact match in secondary API, using first result');
          toast({
            title: "Song Match Warning",
            description: `Playing closest match to "${artist} - ${title}"`,
            variant: "default"
          });
          return extractVideoId(secondaryData.videos[0].url);
        }
      }
    } catch (secondaryError) {
      console.log('Secondary API failed:', secondaryError);
    }
    
    // Step 5: Last resort - try to find a popular song by the same artist
    const artistFallbackId = getPopularSongByArtist(artist);
    if (artistFallbackId) {
      console.log(`No exact match found, using popular song by ${artist}`);
      toast({
        title: "Song Not Found",
        description: `Playing a different song by ${artist}`,
        variant: "default"
      });
      return artistFallbackId;
    }
    
    // Step 6: If all else fails, return null instead of a random song
    toast({
      title: "Song Not Found",
      description: `Could not find "${title}" by ${artist}`,
      variant: "destructive"
    });
    return null;
    
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return null;
  }
};

// Direct matches for specific songs based on artist and title
function getDirectSongMatch(artist: string, title: string): string | null {
  // Normalize inputs
  const normalizedArtist = artist.toLowerCase().trim();
  const normalizedTitle = title.toLowerCase().trim();

  // Specific direct matches for commonly detected songs
  if (normalizedArtist.includes('bruno mars') && normalizedTitle.includes('lazy')) {
    return 'fLexgOxsZu0'; // Bruno Mars - The Lazy Song official video
  }
  
  if (normalizedArtist.includes('versus') && normalizedTitle.includes('7 years')) {
    return 'Ckt9NCZ7C9A'; // Versus - 7 Years Rap (Remix)
  }
  
  if (normalizedArtist.includes('jp saxe') && normalizedTitle.includes('world was ending')) {
    return 'shQJqWH7fqU'; // JP Saxe - If The World Was Ending ft. Julia Michaels
  }

  return null;
}

// Get an exact song match from our database
const getExactSongMatch = (artist: string, title: string): string | null => {
  // Normalize strings for comparison
  const normalizedArtist = artist.toLowerCase().trim();
  const normalizedTitle = title.toLowerCase().trim();
  
  // Search for exact matches
  for (const dbArtist in EXACT_SONG_MATCHES) {
    if (normalizedArtist.includes(dbArtist) || dbArtist.includes(normalizedArtist)) {
      for (const dbTitle in EXACT_SONG_MATCHES[dbArtist]) {
        if (normalizedTitle.includes(dbTitle) || dbTitle.includes(normalizedTitle)) {
          return EXACT_SONG_MATCHES[dbArtist][dbTitle];
        }
      }
    }
  }
  
  return null;
};

// Get a popular song by the same artist as fallback
const getPopularSongByArtist = (artist: string): string | null => {
  const normalizedArtist = artist.toLowerCase().trim();
  
  for (const dbArtist in EXACT_SONG_MATCHES) {
    if (normalizedArtist.includes(dbArtist) || dbArtist.includes(normalizedArtist)) {
      // Get the first song for this artist
      const titles = Object.keys(EXACT_SONG_MATCHES[dbArtist]);
      if (titles.length > 0) {
        return EXACT_SONG_MATCHES[dbArtist][titles[0]];
      }
    }
  }
  
  return null;
};

// Helper function to extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
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
        // Improved search to ensure the exact YouTube video is found
        const youtubeId = await searchYouTubeVideo(
          song.youtubeSearchQuery, 
          data.result.artist, 
          data.result.title
        );
        
        if (youtubeId) {
          song.youtubeId = youtubeId;
          
          // Log the song data
          console.log(`Found YouTube match for "${data.result.artist} - ${data.result.title}":`, song.youtubeId);
          console.log('Final song data:', song);
          toast({
            title: "Song Found",
            description: `"${data.result.title}" by ${data.result.artist}`,
            variant: "default"
          });
        } else {
          throw new Error('Could not find a matching YouTube video for this song.');
        }
      }
      return song;
    } else if (data.status === 'success' && !data.result) {
      console.log('No song detected in the audio sample');
      toast({
        title: "No Song Detected",
        description: "Try again with clearer audio",
        variant: "destructive"
      });
      return null;
    } else {
      console.log('Error or unexpected response from audd.io');
      throw new Error('Error retrieving song information. Please try again.');
    }
  } catch (error) {
    console.error('Error during music recognition:', error);
    throw error;
  }
};
