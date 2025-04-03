
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
  
  // Create a YouTube search query from the song info for the YouTube ID
  const youtubeSearchQuery = `${result.artist} ${result.title} official`;
  const youtubeId = getYoutubeIdFromSearch(youtubeSearchQuery);
  
  return {
    title: result.title,
    artist: result.artist,
    album: result.album || 'Unknown Album',
    albumArt,
    year: result.release_date?.split('-')[0] || 'Unknown',
    youtubeId,
  };
};

// Mock function to get a YouTube ID - in a real app, you'd use the YouTube API
const getYoutubeIdFromSearch = (query: string): string => {
  // This is a mock function that returns a hardcoded YouTube ID
  // In a real app, you would make an API call to the YouTube Data API
  const popularMusicVideos = [
    'dQw4w9WgXcQ', // Rick Astley - Never Gonna Give You Up
    '9bZkp7q19f0', // PSY - Gangnam Style
    'JGwWNGJdvx8', // Ed Sheeran - Shape of You
    'kJQP7kiw5Fk', // Luis Fonsi - Despacito ft. Daddy Yankee
    'RgKAFK5djSk', // Wiz Khalifa - See You Again ft. Charlie Puth
    'hT_nvWreIhg', // OneRepublic - Counting Stars
    'CevxZvSJLk8', // Katy Perry - Roar
    'OPf0YbXqDm0', // Mark Ronson - Uptown Funk ft. Bruno Mars
    'fRh_vgS2dFE', // Justin Bieber - Sorry
    'pRpeEdMmmQ0', // Maroon 5 - Sugar
  ];
  
  // For demo purposes, return a random YouTube ID from the list
  return popularMusicVideos[Math.floor(Math.random() * popularMusicVideos.length)];
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
      return convertAuddResultToSong(data.result);
    } else {
      console.log('No song detected in the audio sample');
      throw new Error('No song detected. Please try again with clearer audio.');
    }
  } catch (error) {
    console.error('Error during music recognition:', error);
    throw error;
  }
};
