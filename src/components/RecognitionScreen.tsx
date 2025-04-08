import React, { useEffect, useState, useRef } from 'react';
import WaveformAnimation from './WaveformAnimation';
import Header from './Header';
import { toast } from '@/hooks/use-toast';
import { AudioRecognizer } from '@/utils/AudioRecognizer';
import { searchYouTubeVideo, verifyYouTubeMatch } from '@/utils/musicDetection';

interface RecognitionScreenProps {
  isListening: boolean;
  onCancel: () => void;
  onSongRecognized: (song: any) => void;
}

const RecognitionScreen: React.FC<RecognitionScreenProps> = ({ 
  isListening, 
  onCancel,
  onSongRecognized
}) => {
  const [status, setStatus] = useState<'ready' | 'recording' | 'processing' | 'verifying'>('ready');
  const audioRecognizer = useRef<AudioRecognizer | null>(null);
  
  useEffect(() => {
    audioRecognizer.current = new AudioRecognizer();
    
    if (isListening) {
      detectMusic();
    }
    
    return () => {
      if (audioRecognizer.current) {
        audioRecognizer.current.cleanup();
      }
    };
  }, [isListening]);
  
  const detectMusic = async () => {
    try {
      if (!audioRecognizer.current) {
        audioRecognizer.current = new AudioRecognizer();
      }
      
      setStatus('recording');
      
      const initialized = await audioRecognizer.current.init();
      if (!initialized) {
        toast({
          title: "Microphone Error",
          description: "Please allow microphone access to detect music",
          variant: "destructive"
        });
        onCancel();
        return;
      }
      
      await audioRecognizer.current.startRecording();
      
      setTimeout(async () => {
        if (!audioRecognizer.current) return;
        
        const audioBlob = await audioRecognizer.current.stopRecording();
        
        if (!audioBlob) {
          toast({
            title: "Recording Error",
            description: "Failed to capture audio. Please try again.",
            variant: "destructive"
          });
          onCancel();
          return;
        }
        
        setStatus('processing');
        
        const recognizedSong = await audioRecognizer.current.recognizeSong(audioBlob);
        
        if (recognizedSong) {
          setStatus('verifying');
          
          const searchQueries = [
            `${recognizedSong.artist} - ${recognizedSong.title} official audio`,
            `${recognizedSong.artist} - ${recognizedSong.title} official video`,
            `${recognizedSong.artist} - ${recognizedSong.title} lyrics`
          ];
          
          let bestYoutubeId = null;
          let isVerified = false;
          
          for (const query of searchQueries) {
            if (isVerified) break;
            
            const youtubeId = await searchYouTubeVideo(
              query, 
              recognizedSong.artist, 
              recognizedSong.title
            );
            
            if (youtubeId) {
              const verificationResult = await verifyYouTubeMatch(
                youtubeId, 
                recognizedSong.artist, 
                recognizedSong.title
              );
              
              if (verificationResult) {
                bestYoutubeId = youtubeId;
                isVerified = true;
                console.log(`Found verified match with query "${query}": ${youtubeId}`);
                break;
              } else if (!bestYoutubeId) {
                bestYoutubeId = youtubeId;
                console.log(`Found unverified match: ${youtubeId}`);
              }
            }
          }
          
          const songWithYoutube = {
            ...recognizedSong,
            youtubeId: bestYoutubeId,
            isVerified
          };
          
          onSongRecognized(songWithYoutube);
          
          toast({
            title: "Song Found",
            description: `${recognizedSong.title} by ${recognizedSong.artist}`,
          });
        } else {
          toast({
            title: "No music detected",
            description: "Please try again with clearer audio",
            variant: "destructive"
          });
          onCancel();
        }
      }, 5000);
    } catch (error) {
      console.error('Error during music detection:', error);
      toast({
        title: "Detection Failed",
        description: error instanceof Error ? error.message : "Failed to recognize music",
        variant: "destructive"
      });
      onCancel();
    }
  };
  
  const getStatusMessage = () => {
    switch (status) {
      case 'recording':
        return 'Listening to Music';
      case 'processing':
        return 'Processing Audio...';
      case 'verifying':
        return 'Finding Best Match...';
      default:
        return 'Ready';
    }
  };
  
  const getStatusDescription = () => {
    switch (status) {
      case 'recording':
        return 'Hold your phone close to the music source for better recognition 🔊';
      case 'processing':
        return 'Identifying the song using audd.io API 🔍';
      case 'verifying':
        return 'Finding the best YouTube match for this song 🎬';
      default:
        return 'Tap to begin detection';
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col space-bg cosmic-dots text-white animate-fade-in">
      <Header title="Detecting Music 🎵" showBackButton={false} />
      
      <div className="flex flex-col items-center justify-center flex-1 p-6 relative">
        <div className="absolute top-10 left-[10%] text-2xl opacity-20 float-slow">🎵</div>
        <div className="absolute top-[15%] right-[15%] text-xl opacity-15 float">🎧</div>
        <div className="absolute bottom-[20%] left-[20%] text-xl opacity-20 float-fast">🎸</div>
        <div className="absolute bottom-[30%] right-[10%] text-2xl opacity-10 float-slow">🎺</div>
        
        <div className="w-32 h-32 mb-8 rounded-full bg-syncme-light-purple/10 flex items-center justify-center relative">
          <div className="absolute w-full h-full rounded-full animate-pulse-ring border border-syncme-light-purple/20"></div>
          <div className="w-24 h-24 rounded-full bg-syncme-light-purple/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-syncme-light-purple flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
        </div>
        
        <WaveformAnimation isListening={status === 'recording'} />
        
        <h2 className="text-2xl font-bold mb-2 text-glow">
          {getStatusMessage()}
        </h2>
        <p className="text-center text-blue-200/70 mb-8 max-w-xs">
          {getStatusDescription()}
        </p>
        
        <button 
          onClick={onCancel}
          className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default RecognitionScreen;
