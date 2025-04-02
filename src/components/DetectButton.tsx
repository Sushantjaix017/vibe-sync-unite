
import React, { useState } from 'react';
import { Mic } from 'lucide-react';

interface DetectButtonProps {
  onDetect: () => void;
  isDetecting: boolean;
}

const DetectButton: React.FC<DetectButtonProps> = ({ onDetect, isDetecting }) => {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onDetect}
        disabled={isDetecting}
        className={`relative flex items-center justify-center w-24 h-24 rounded-full btn-primary ${
          isDetecting ? 'opacity-75' : 'hover:scale-105'
        } transition-all duration-300 shadow-lg focus:outline-none`}
      >
        {isDetecting ? (
          <>
            <span className="absolute w-full h-full rounded-full bg-syncme-light-purple animate-pulse-ring"></span>
            <Mic className="w-10 h-10 text-white" />
          </>
        ) : (
          <Mic className="w-10 h-10 text-white" />
        )}
      </button>
      <p className="mt-4 text-lg font-medium text-center">
        {isDetecting ? 'Listening...' : 'Tap to Detect Music'}
      </p>
    </div>
  );
};

export default DetectButton;
