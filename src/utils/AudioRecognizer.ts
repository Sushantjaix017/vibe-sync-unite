
export class AudioRecognizer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private isRecording = false;

  async init(): Promise<boolean> {
    try {
      this.audioContext = new AudioContext();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      this.mediaRecorder = new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      return true;
    } catch (error) {
      console.error('Error initializing audio:', error);
      return false;
    }
  }

  async startRecording(): Promise<void> {
    if (!this.mediaRecorder || this.isRecording) return;

    this.chunks = [];
    this.mediaRecorder.start();
    this.isRecording = true;
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/wav' });
        this.chunks = [];
        this.isRecording = false;
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  async recognizeSong(audioBlob: Blob): Promise<{
    title: string;
    artist: string;
    album: string;
    albumArt: string;
    year: string;
    youtubeSearchQuery: string;
    isVerified: boolean;
  } | null> {
    try {
      const API_TOKEN = "613c8af850a263d2711d0267cdde41aa"; // <--- NEW audd.io API key

      const formData = new FormData();
      formData.append('file', audioBlob);
      formData.append('api_token', API_TOKEN);
      formData.append('return', 'apple_music,spotify');
      
      const response = await fetch('https://api.audd.io/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.result) {
        const { title, artist, album, release_date } = data.result;
        
        // Get album art from Apple Music or use fallback
        const albumArt = data.result.apple_music?.artwork?.url?.replace('{w}x{h}', '500x500') || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=8B5CF6&color=fff&size=256`;
        
        // Create YouTube search query
        const youtubeSearchQuery = `${artist} - ${title} official audio`;
        
        return {
          title,
          artist,
          album: album || 'Unknown Album',
          albumArt,
          year: release_date?.split('-')[0] || 'Unknown',
          youtubeSearchQuery,
          isVerified: false
        };
      }

      return null;
    } catch (error) {
      console.error('Error recognizing song:', error);
      return null;
    }
  }

  cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.mediaRecorder = null;
    this.mediaStream = null;
    this.audioContext = null;
  }
}
