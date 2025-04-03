
import React, { useState } from 'react';
import DetectButton from '@/components/DetectButton';
import RecognitionScreen from '@/components/RecognitionScreen';
import SongResult from '@/components/SongResult';
import RoomScreen from '@/components/RoomScreen';
import Player from '@/components/Player';
import Header from '@/components/Header';
import { sampleSongs, generateRoomCode } from '@/utils/mockData';
import { Music } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';

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
  const [videoMode, setVideoMode] = useState(true);
  const isMobile = useIsMobile();
  
  // Start the detection process
  const handleDetect = () => {
    setIsDetecting(true);
    setAppState(AppState.DETECTING);
  };
  
  // Called when the waveform animation should start
  const startListening = () => {
    // This function is passed to DetectButton and is called when the user clicks to detect
    console.log("Starting music detection process...");
  };
  
  // Called when a song is successfully recognized
  const handleSongRecognized = (song: any) => {
    setRecognizedSong(song);
    setIsDetecting(false);
    setAppState(AppState.RESULT);
    
    toast({
      title: "Song Recognized!",
      description: `${song.title} by ${song.artist}`,
    });
  };
  
  const handleCancelDetection = () => {
    setIsDetecting(false);
    setAppState(AppState.HOME);
  };
  
  const handlePlay = () => {
    setVideoMode(true);
    setAppState(AppState.PLAYING);
    setIsHost(true);
  };
  
  const handleAudioOnly = () => {
    setVideoMode(false);
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
    <div className="flex flex-col min-h-screen space-bg cosmic-dots overflow-hidden">
      {appState === AppState.HOME && (
        <>
          <Header />
          <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
            {/* Floating music emojis */}
            <div className="absolute top-10 left-[10%] text-2xl opacity-20 float-slow">🎵</div>
            <div className="absolute top-[15%] right-[15%] text-3xl opacity-15 float">🎶</div>
            <div className="absolute bottom-[20%] left-[20%] text-xl opacity-20 float-fast">🎧</div>
            <div className="absolute bottom-[30%] right-[10%] text-2xl opacity-10 float-slow">🎤</div>
            
            <div className="text-center mb-10 animate-fade-in max-w-md">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-syncme-light-purple rounded-full blur-xl opacity-30"></div>
                  <div className="bg-gradient-to-br from-syncme-light-purple to-syncme-purple p-5 rounded-full relative z-10">
                    <Music className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-300 to-blue-300 text-transparent bg-clip-text drop-shadow-md">
                Sync<span className="text-syncme-light-purple">Me</span> 
              </h1>
              <p className="text-blue-200/80 mb-2">
                Detect, play, and share music in real-time ✨
              </p>
              <p className="text-blue-200/50 text-sm mt-2 max-w-xs mx-auto">
                Let's bring your music experience to the next level
              </p>
            </div>
            
            <div className="relative">
              <DetectButton 
                onDetect={handleDetect} 
                isDetecting={isDetecting}
                startListening={startListening}
              />
            </div>
            
            <div className="mt-12 text-center animate-fade-in bg-white/5 backdrop-blur-md p-5 rounded-xl border border-white/10 max-w-xs">
              <h2 className="font-medium mb-2 text-blue-200">How it works</h2>
              <ol className="text-blue-200/70 space-y-2 text-sm text-left">
                <li className="flex items-center"><span className="mr-2 bg-syncme-light-purple/20 w-6 h-6 rounded-full flex items-center justify-center">1</span> Tap to detect music playing around you 🎵</li>
                <li className="flex items-center"><span className="mr-2 bg-syncme-light-purple/20 w-6 h-6 rounded-full flex items-center justify-center">2</span> Choose to play solo or vibe with friends 👥</li>
                <li className="flex items-center"><span className="mr-2 bg-syncme-light-purple/20 w-6 h-6 rounded-full flex items-center justify-center">3</span> Create or join a room to sync music 🚀</li>
              </ol>
            </div>
          </main>
        </>
      )}
      
      {appState === AppState.DETECTING && (
        <RecognitionScreen 
          isListening={isDetecting} 
          onCancel={handleCancelDetection}
          onSongRecognized={handleSongRecognized}
        />
      )}
      
      {appState === AppState.RESULT && (
        <div className="min-h-screen flex flex-col space-bg cosmic-dots">
          <Header 
            title="Song Recognized ✓" 
            showBackButton={true} 
            onBackClick={() => setAppState(AppState.HOME)}
          />
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
