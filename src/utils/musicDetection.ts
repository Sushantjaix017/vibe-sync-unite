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
    isVerified: false, // Track if we've verified this is the correct YouTube video
  };
};

// Track recently used fallback IDs to avoid using the same one repeatedly
const recentlyUsedFallbackIds = new Set<string>();

// Normalize strings for better matching
export const normalizeString = (str: string): string => {
  if (!str) return '';
  
  return str.toLowerCase()
    .replace(/[^\w\s]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
};

// More sophisticated string matching that handles variations better
export const stringsMatch = (str1: string, str2: string): boolean => {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  
  // Direct match
  if (norm1 === norm2) return true;
  
  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Check word by word (for artist names like "The Beatles" vs "Beatles")
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  // If one string has at least 70% of words from the other
  let matchCount = 0;
  for (const word of words1) {
    if (word.length > 2 && words2.includes(word)) matchCount++;
  }
  
  return matchCount >= Math.min(words1.length, words2.length) * 0.7;
};

// Search for a YouTube video ID based on a query
export const searchYouTubeVideo = async (query: string, artist: string, title: string): Promise<string | null> => {
  try {
    console.log('Searching YouTube for:', query);
    
    // Try with YouTube API proxy first
    try {
      const proxyResponse = await fetch(`https://yt-api-proxy.glitch.me/search?q=${encodeURIComponent(query)}`);
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        
        if (data && data.items && data.items.length > 0) {
          console.log('YouTube search results:', data.items);
          
          // Find the first result that contains both the artist and title in the video title
          // using our enhanced string matching
          const exactMatch = data.items.find((item: any) => {
            const videoTitle = item.snippet.title;
            return stringsMatch(videoTitle, artist) && stringsMatch(videoTitle, title);
          });
          
          if (exactMatch) {
            console.log('Found exact match:', exactMatch.snippet.title);
            return exactMatch.id.videoId;
          }
          
          // If no exact match, return the first result that's not a rickroll
          for (const item of data.items) {
            if (item.id.videoId !== 'dQw4w9WgXcQ') {
              return item.id.videoId;
            }
          }
          
          // If somehow all results are rickrolls (extremely unlikely), return the first result
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
          
          // Find exact match with enhanced string matching
          const exactMatch = secondaryData.videos.find((video: any) => {
            return stringsMatch(video.title, artist) && stringsMatch(video.title, title);
          });
          
          if (exactMatch) {
            console.log('Found exact match in secondary API:', exactMatch.title);
            return extractVideoId(exactMatch.url);
          }
          
          // If no exact match, return the first result that's not a rickroll
          for (const video of secondaryData.videos) {
            const videoId = extractVideoId(video.url);
            if (videoId !== 'dQw4w9WgXcQ') {
              return videoId;
            }
          }
          
          // If all else fails, return the first result
          return extractVideoId(secondaryData.videos[0].url);
        }
      }
    } catch (secondaryError) {
      console.log('Secondary API failed:', secondaryError);
    }
    
    // If all else fails, fall back to our hardcoded list
    return getYoutubeIdForExactSong(artist, title);
    
  } catch (error) {
    console.error('Error searching YouTube:', error);
    // Fallback to a hardcoded list if all APIs fail
    return getYoutubeIdForExactSong(artist, title);
  }
};

// Helper function to extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

// Verify if a YouTube video matches the expected song
export const verifyYouTubeMatch = async (youtubeId: string, artist: string, title: string): Promise<boolean> => {
  // Never verify the rickroll as a valid match
  if (youtubeId === 'dQw4w9WgXcQ') {
    return false;
  }
  
  try {
    // Try to fetch video details using YouTube API to verify it's the right song
    const response = await fetch(`https://yt-api-proxy.glitch.me/videos?id=${youtubeId}&part=snippet`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.items && data.items.length > 0) {
        const videoTitle = data.items[0].snippet.title;
        
        // Use enhanced string matching
        const artistMatch = stringsMatch(videoTitle, artist);
        const titleMatch = stringsMatch(videoTitle, title);
        
        console.log(`Verification: Video title "${videoTitle}" matches artist: ${artistMatch}, title: ${titleMatch}`);
        
        // If both match, we're good
        if (artistMatch && titleMatch) {
          return true;
        }
        
        // If at least the title matches, it's probably OK
        if (titleMatch) {
          return true;
        }
        
        // Otherwise, it's likely not the right video
        return false;
      }
    }
    
    // If we can't verify, assume it's not a match
    return false;
  } catch (error) {
    console.error('Error verifying YouTube match:', error);
    return false;
  }
};

// Expanded list for most popular songs
const popularSongs: Record<string, Record<string, string>> = {
  'Billie Eilish': {
    'BIRDS OF A FEATHER': 'Ah0Ys50CqO8',
    'Bad Guy': 'DyDfgMOUjCI',
    'Happier Than Ever': '5GJWxDKyk3A',
    'when the partys over': 'pbMwTqkKSps',
    'Ocean Eyes': 'viimfQi_pUw'
  },
  'Taylor Swift': {
    'Blank Space': 'e-ORhEE9VVg',
    'Anti-Hero': 'b1kbLwvqugk',
    'Cruel Summer': 'ic8j13piAhQ',
    'Shake It Off': 'nfWlot6h_JM',
    'Love Story': 'V9ZiklE2Q8k'
  },
  'The Weeknd': {
    'Blinding Lights': 'XXYlFuWEuKI',
    'Save Your Tears': 'LIIDh-qI9oI',
    'Starboy': 'dqRZDebPIGs',
    'The Hills': 'yzTuBuRdAyA',
    'Die For You': 'vYMR3lku5Vg'
  },
  'Ed Sheeran': {
    'Shape of You': 'JGwWNGJdvx8',
    'Perfect': '2Vv-BfVoq4g',
    'Thinking Out Loud': 'lp-EO5I60KA',
    'Photograph': 'nSDgHBxUbVQ',
    'Bad Habits': 'orJSJGHjBLI'
  },
  'Adele': {
    'Hello': 'YQHsXMglC9A',
    'Rolling in the Deep': 'rYEDA3JcQqw',
    'Someone Like You': 'hLQl3WQQoQ0',
    'Easy On Me': 'U3ASj1L6_sY',
    'Set Fire to the Rain': 'Ri7-vnrJD3k'
  },
  'Harry Styles': {
    'As It Was': 'H5v3kku4y6Q',
    'Watermelon Sugar': 'E07s5ZYygMg',
    'Late Night Talking': 'jjf-0O4N3I0',
    'Adore You': 'VF-r5TtlT9w',
    'Golden': 'P3cffdsEXXw'
  },
  'Dua Lipa': {
    'Levitating': 'TUVcZfQe-Kw',
    'Don\'t Start Now': 'oygrmJFKYZY',
    'New Rules': 'k2qgadSvNyU',
    'Physical': '9HDEHj2yzew',
    'Break My Heart': 'Nj2U6rhnucI'
  },
  'Bruno Mars': {
    'The Lazy Song': 'fLexgOxsZu0',
    'Just The Way You Are': 'LjhCEhWiKXk',
    'Uptown Funk': 'OPf0YbXqDm0',
    'That\'s What I Like': 'PMivT7MJ41M',
    'When I Was Your Man': 'ekzHIouo8Q4'
  },
  'Coldplay': {
    'Yellow': 'yKNxeF4KMsY',
    'Viva La Vida': 'dvgZkm1xWPE',
    'A Sky Full of Stars': 'VPRjCeoBqrI',
    'Fix You': 'k4V3Mo61fJM',
    'Paradise': '1G4isv_Fylg'
  },
  'Justin Bieber': {
    'Sorry': 'fRh_vgS2dFE',
    'What Do You Mean?': 'DK_0jXPuIr0',
    'Love Yourself': 'oyEuk8j8imI',
    'Stay': 'yWEK4JbyF9k',
    'Ghost': 'Fp8msa5McBk'
  },
  'Drake': {
    'God\'s Plan': 'xpVfcZ0ZcFM',
    'Hotline Bling': 'uxpDa-c-4Mc',
    'In My Feelings': 'DRS_PpOrUZ4',
    'Started From the Bottom': 'RubBzkZzpUA',
    'One Dance': 'vcer12OFU2g'
  },
  'Ariana Grande': {
    'thank u, next': 'gl1aHhXnN1k',
    '7 rings': 'QYh6mYIJG2Y',
    'positions': 'tcYodQoapMg',
    'Side To Side': 'SXiSVQZLje8',
    'no tears left to cry': 'ffxKSjUwKdU'
  }
};

// Find a YouTube ID for a specific song using our database
const getYoutubeIdForExactSong = (artist: string, title: string): string => {
  console.log('Using fallback YouTube search for:', artist, title);
  
  // Try to find an exact match for artist and song in our database
  for (const knownArtist in popularSongs) {
    // Check for artist match (case insensitive, partial match)
    if (stringsMatch(artist, knownArtist)) {
          
      // Check if we have this song by the artist
      for (const knownSong in popularSongs[knownArtist]) {
        if (stringsMatch(title, knownSong)) {
          console.log(`Found exact song match: ${knownArtist} - ${knownSong}`);
          return popularSongs[knownArtist][knownSong];
        }
      }
      
      // If we found the artist but not the exact song, return another song by that artist
      const artistSongs = Object.values(popularSongs[knownArtist]);
      if (artistSongs.length > 0) {
        // Find a song ID we haven't used recently
        const unusedSongIds = artistSongs.filter(id => !recentlyUsedFallbackIds.has(id));
        
        if (unusedSongIds.length > 0) {
          const songId = unusedSongIds[0];
          // Keep track of recently used IDs
          recentlyUsedFallbackIds.add(songId);
          if (recentlyUsedFallbackIds.size > 10) {
            // Keep the set from growing too large by removing the oldest entry
            recentlyUsedFallbackIds.delete([...recentlyUsedFallbackIds][0]);
          }
          
          console.log(`Found artist match: ${knownArtist}, using a song`);
          return songId;
        }
        
        // If all songs by this artist have been used recently, just use the first one
        const songId = artistSongs[0];
        console.log(`Found artist match: ${knownArtist}, using a song (all were recently used)`);
        return songId;
      }
    }
  }
  
  // If we can't find a match by artist or song, use a random popular song
  // (but NOT Rick Astley unless we've exhausted all options)
  
  // Flatten all songs into a single array
  const allSongs: string[] = [];
  for (const artist in popularSongs) {
    for (const song in popularSongs[artist]) {
      if (popularSongs[artist][song] !== 'dQw4w9WgXcQ') {
        allSongs.push(popularSongs[artist][song]);
      }
    }
  }
  
  // Find a song we haven't used recently
  const unusedSongs = allSongs.filter(id => !recentlyUsedFallbackIds.has(id));
  
  if (unusedSongs.length > 0) {
    const randomIndex = Math.floor(Math.random() * unusedSongs.length);
    const randomSongId = unusedSongs[randomIndex];
    
    // Keep track of recently used IDs
    recentlyUsedFallbackIds.add(randomSongId);
    if (recentlyUsedFallbackIds.size > 10) {
      recentlyUsedFallbackIds.delete([...recentlyUsedFallbackIds][0]);
    }
    
    console.log('No specific match found, using random popular song');
    return randomSongId;
  }
  
  // Last resort - in the extremely unlikely case that we've recently used all songs in our database
  console.log('All songs have been recently used, using first Billie Eilish song');
  return popularSongs['Billie Eilish']['Bad Guy']; // A safe default that's not a rickroll
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
        // Try multiple search queries to find the best match
        const searchQueries = [
          `${data.result.artist} - ${data.result.title} official audio`,
          `${data.result.artist} - ${data.result.title} official video`,
          `${data.result.artist} - ${data.result.title} lyrics`
        ];
        
        let bestYoutubeId = null;
        let isVerified = false;
        
        // Try each query until we find a verified match
        for (const query of searchQueries) {
          if (isVerified) break; // Only break if we found a verified match
          
          const youtubeId = await searchYouTubeVideo(
            query, 
            data.result.artist, 
            data.result.title
          );
          
          if (youtubeId) {
            // Check if this video is verified as matching the song
            const verificationResult = await verifyYouTubeMatch(
              youtubeId, 
              data.result.artist, 
              data.result.title
            );
            
            // If verified, use this ID
            if (verificationResult) {
              bestYoutubeId = youtubeId;
              isVerified = true;
              console.log(`Found verified match with query "${query}": ${youtubeId}`);
              break;
            } 
            // If not verified but we don't have any ID yet, use this as a backup
            else if (!bestYoutubeId) {
              bestYoutubeId = youtubeId;
              console.log(`Found unverified match: ${youtubeId}`);
            }
          }
        }
        
        // Use the best match we found, or fall back to a hardcoded song if needed
        if (bestYoutubeId) {
          song.youtubeId = bestYoutubeId;
          song.isVerified = isVerified;
        } else {
          // Last resort - use our database
          const fallbackId = getYoutubeIdForExactSong(data.result.artist, data.result.title);
          song.youtubeId = fallbackId;
          song.isVerified = false;
          console.log(`Using fallback from database: ${fallbackId}`);
        }
        
        console.log('Final song data:', song);
        return song;
      }
      return null;
    } else {
      console.log('No song detected in the audio sample');
      throw new Error('No song detected. Please try again with clearer audio.');
    }
  } catch (error) {
    console.error('Error during music recognition:', error);
    throw error;
  }
};
