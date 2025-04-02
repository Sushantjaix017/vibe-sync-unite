
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
  
  return {
    title: result.title,
    artist: result.artist,
    album: result.album || 'Unknown Album',
    albumArt,
    year: result.release_date?.split('-')[0] || 'Unknown',
  };
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
