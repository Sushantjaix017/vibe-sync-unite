
import React, { useState } from 'react';
import DetectButton from '@/components/DetectButton';
import RecognitionScreen from '@/components/RecognitionScreen';
import SongResult from '@/components/SongResult';
import RoomScreen from '@/components/RoomScreen';
import Player from '@/components/Player';
import Header from '@/components/Header';
import { sampleSongs, generateRoomCode } from '@/utils/mockData';
import { Music } from 'lucide-react';

enum AppState {
  HOME,
  DETECTING,
  RESULT,
  ROOM,
  PLAYING
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [isDetecting, setIsDetecting] = useState(false);
  const [recognizedSong, setRecognizedSong] = useState(sampleSongs[0]);
  const [roomCode, setRoomCode] = useState<string | undefined>();
  const [isHost, setIsHost] = useState(false);
  
  // Mock detection process
  const handleDetect = () => {
    setIsDetecting(true);
    setAppState(AppState.DETECTING);
    
    // Simulate recognition after 3 seconds
    setTimeout(() => {
      const randomSong = sampleSongs[Math.floor(Math.random() * sampleSongs.length)];
      setRecognizedSong(randomSong);
      setIsDetecting(false);
      setAppState(AppState.RESULT);
    }, 3000);
  };
  
  const handleCancelDetection = () => {
    setIsDetecting(false);
    setAppState(AppState.HOME);
  };
  
  const handlePlay = () => {
    setAppState(AppState.PLAYING);
    setIsHost(true);
  };
  
  const handleVibeTogether = () => {
    setAppState(AppState.ROOM);
  };
  
  const handleCreateRoom = () => {
    setRoomCode(generateRoomCode());
    setIsHost(true);
  };
  
  const handleJoinRoom = (code: string) => {
    setRoomCode(code);
    setIsHost(false);
    setAppState(AppState.PLAYING);
  };
  
  const handleBackToHome = () => {
    setAppState(AppState.HOME);
    setRoomCode(undefined);
    setIsHost(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-purple-50 dark:from-syncme-dark dark:to-black">
      {appState === AppState.HOME && (
        <>
          <Header />
          <main className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center mb-10 animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="bg-syncme-light-purple p-4 rounded-full">
                  <Music className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">SyncMe</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Detect, play, and share music in real-time
              </p>
            </div>
            
            <DetectButton 
              onDetect={handleDetect} 
              isDetecting={isDetecting} 
            />
            
            <div className="mt-16 text-center animate-fade-in">
              <h2 className="font-medium mb-2">How it works</h2>
              <ol className="text-gray-600 dark:text-gray-300 space-y-2 text-sm">
                <li>1. Tap the button to detect music playing around you</li>
                <li>2. Choose to play alone or vibe with friends</li>
                <li>3. Create or join a room to sync music playback</li>
              </ol>
            </div>
          </main>
        </>
      )}
      
      {appState === AppState.DETECTING && (
        <RecognitionScreen 
          isListening={isDetecting} 
          onCancel={handleCancelDetection} 
        />
      )}
      
      {appState === AppState.RESULT && (
        <div className="min-h-screen flex flex-col">
          <Header title="Song Recognized" showBackButton={true} />
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <SongResult 
              song={recognizedSong}
              onPlay={handlePlay}
              onVibeTogether={handleVibeTogether}
            />
          </div>
        </div>
      )}
      
      {appState === AppState.ROOM && (
        <RoomScreen 
          roomCode={roomCode}
          isHost={isHost}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onClose={() => setAppState(AppState.PLAYING)}
        />
      )}
      
      {appState === AppState.PLAYING && (
        <Player 
          song={recognizedSong}
          isHost={isHost}
          roomCode={roomCode}
          participants={3}
          onBack={handleBackToHome}
        />
      )}
    </div>
  );
};

export default Index;
