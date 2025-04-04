
import React, { useEffect, useState } from 'react';
import WaveformAnimation from './WaveformAnimation';
import Header from './Header';
import { recordAudio, recognizeMusic } from '@/utils/musicDetection';
import { toast } from '@/hooks/use-toast';

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
  const [status, setStatus] = useState<'ready' | 'recording' | 'processing'>('ready');
  
  useEffect(() => {
    if (isListening) {
      detectMusic();
    }
    
    return () => {
      // Cleanup function if needed
    };
  }, [isListening]);
  
  const detectMusic = async () => {
    try {
      setStatus('recording');
      
      // Record audio from microphone
      const audioBlob = await recordAudio();
      
      setStatus('processing');
      
      // Send audio to audd.io for recognition
      const song = await recognizeMusic(audioBlob);
      
      // Send the recognized song to the parent component
      if (song) {
        onSongRecognized(song);
      } else {
        toast({
          title: "No music detected",
          description: "Please try again with clearer audio",
          variant: "destructive"
        });
        onCancel();
      }
      
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
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col space-bg cosmic-dots text-white animate-fade-in">
      <Header title="Detecting Music 🎵" showBackButton={false} />
      
      <div className="flex flex-col items-center justify-center flex-1 p-4 sm:p-6 relative">
        {/* Floating music emojis */}
        <div className="absolute top-10 left-[10%] text-2xl opacity-20 float-slow">🎵</div>
        <div className="absolute top-[15%] right-[15%] text-xl opacity-15 float">🎧</div>
        <div className="absolute bottom-[20%] left-[20%] text-xl opacity-20 float-fast">🎸</div>
        <div className="absolute bottom-[30%] right-[10%] text-2xl opacity-10 float-slow">🎺</div>
        
        <div className="w-24 h-24 sm:w-32 sm:h-32 mb-6 sm:mb-8 rounded-full bg-syncme-light-purple/10 flex items-center justify-center relative">
          <div className="absolute w-full h-full rounded-full animate-pulse-ring border border-syncme-light-purple/20"></div>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-syncme-light-purple/20 flex items-center justify-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-syncme-light-purple flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
        </div>
        
        <WaveformAnimation isListening={isListening} />
        
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-glow">
          {status === 'recording' ? 'Listening to Music' : 'Processing Audio...'}
        </h2>
        <p className="text-center text-blue-200/70 mb-6 sm:mb-8 max-w-xs px-4">
          {status === 'recording' 
            ? 'Hold your phone close to the music source for better recognition 🔊' 
            : 'Identifying the song using audd.io API 🔍'}
        </p>
        
        <button 
          onClick={onCancel}
          className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10 text-sm sm:text-base"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default RecognitionScreen;
