
import React from 'react';
import WaveformAnimation from './WaveformAnimation';
import Header from './Header';

interface RecognitionScreenProps {
  isListening: boolean;
  onCancel: () => void;
}

const RecognitionScreen: React.FC<RecognitionScreenProps> = ({ isListening, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-syncme-dark bg-opacity-95 text-white animate-fade-in">
      <Header title="Detecting Music" showBackButton={false} />
      
      <div className="flex flex-col items-center justify-center flex-1 p-6">
        <div className="w-32 h-32 mb-8 rounded-full bg-syncme-light-purple/30 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-syncme-light-purple/60 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-syncme-light-purple flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
        </div>
        
        <WaveformAnimation isListening={isListening} />
        
        <h2 className="text-2xl font-bold mb-2">Listening to Music</h2>
        <p className="text-center text-white/70 mb-8">
          Hold your phone close to the music source for better recognition
        </p>
        
        <button 
          onClick={onCancel}
          className="px-8 py-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default RecognitionScreen;
