
import React, { useState, useEffect } from 'react';
import { Copy, Users } from 'lucide-react';
import Header from './Header';
import { getSocket } from '../utils/socket';

interface RoomScreenProps {
  roomCode?: string;
  isHost: boolean;
  waitingForHost?: boolean;
  onJoinRoom: (code: string) => void;
  onCreateRoom: () => void;
  onHostContinue: () => void;
  onClose: () => void;
}

const RoomScreen: React.FC<RoomScreenProps> = ({ 
  roomCode, 
  isHost, 
  waitingForHost,
  onJoinRoom, 
  onCreateRoom,
  onHostContinue,
  onClose
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [socketState, setSocketState] = useState<null | string>(null);

  useEffect(() => {
    const socket = getSocket();

    // Room creation/join listeners (demo only)
    socket.on("room-created", (code: string) => {
      setSocketState(`Room created: ${code}`);
    });

    socket.on("room-joined", (code: string) => {
      setSocketState(`Joined room: ${code}`);
    });

    socket.on("room-error", (msg: string) => {
      setSocketState(`Room error: ${msg}`);
    });

    return () => {
      socket.off("room-created");
      socket.off("room-joined");
      socket.off("room-error");
    };
  }, []);

  const copyToClipboard = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateRoom = () => {
    const socket = getSocket();
    socket.emit("create-room");
    onCreateRoom();
  };

  const handleJoinRoom = () => {
    if (joinCode) {
      const socket = getSocket();
      socket.emit("join-room", joinCode);
      onJoinRoom(joinCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 space-bg cosmic-dots flex flex-col animate-fade-in">
      <Header title="Vibe Together 👥" showBackButton={true} />

      <div className="flex flex-col items-center justify-center flex-1 p-6 relative">
        <div className="absolute top-10 left-[10%] text-2xl opacity-20 float-slow">👯</div>
        <div className="absolute top-[15%] right-[15%] text-xl opacity-15 float">🎧</div>
        <div className="absolute bottom-[20%] left-[20%] text-xl opacity-20 float-fast">🎉</div>
        <div className="absolute bottom-[30%] right-[10%] text-2xl opacity-10 float-slow">✨</div>

        {socketState && (
          <div className="mb-4 text-blue-300 text-center animate-fade-in">
            {socketState}
          </div>
        )}

        {/* Host Screen */}
        {isHost && roomCode ? (
          <div className="w-full max-w-md bg-syncme-dark/70 rounded-xl backdrop-blur-lg border border-syncme-light-purple/10 p-6 animate-fade-in card-glow">
            <div className="flex items-center justify-center mb-4">
              <span className="text-3xl mr-2">🎉</span>
              <h2 className="text-2xl font-bold mb-0 text-center text-glow">Room Created!</h2>
            </div>
            <p className="text-center text-blue-200/80 mb-6">
              Share this code with friends to vibe together
            </p>
            
            <div className="flex items-center justify-center mb-6 overflow-hidden rounded-lg">
              <div className="flex-1 bg-syncme-light-purple/20 p-5 rounded-l-lg font-mono text-xl text-center text-white border-r border-syncme-light-purple/10">
                {roomCode}
              </div>
              <button 
                onClick={copyToClipboard}
                className="bg-syncme-light-purple p-5 rounded-r-lg text-white hover:bg-syncme-purple transition-colors"
              >
                {copied ? (
                  <span className="text-sm">Copied! ✓</span>
                ) : (
                  <Copy size={20} />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-center space-x-2 p-4 border border-dashed border-syncme-light-purple/30 rounded-lg mb-6 bg-white/5 backdrop-blur-sm">
              <div className="emoji-bg mr-2 bg-syncme-light-purple/20">
                <span className="text-xl">👥</span>
              </div>
              <p className="text-blue-200/80">Waiting for friends to join...</p>
            </div>
            
            <button 
              className="w-full py-3 rounded-lg btn-primary mt-2"
              onClick={onHostContinue}
            >
              Continue to Player
            </button>
          </div>
        ) : /* Client: Waiting for Host */
        (waitingForHost && roomCode) ? (
          <div className="w-full max-w-md bg-syncme-dark/70 rounded-xl backdrop-blur-lg border border-syncme-light-purple/10 p-6 animate-fade-in card-glow">
            <div className="flex items-center justify-center mb-4">
              <span className="text-3xl mr-2">👥</span>
              <h2 className="text-2xl font-bold mb-0 text-center text-glow">Joined Room</h2>
            </div>
            <p className="text-center text-blue-200/80 mb-6">
              Waiting for the Host to start the session...
            </p>
            <div className="flex items-center justify-center mb-6 overflow-hidden rounded-lg">
              <div className="flex-1 bg-syncme-light-purple/20 p-5 rounded-lg font-mono text-xl text-center text-white">
                {roomCode}
              </div>
            </div>
            <div className="flex items-center justify-center p-4 border border-dashed border-syncme-light-purple/30 rounded-lg mb-6 bg-white/5 backdrop-blur-sm">
              <Users size={22} className="text-syncme-light-purple mr-2"/>
              <span className="text-blue-200/80">Waiting for host...</span>
            </div>
          </div>
        ) : (
          // Room Join/Create UI
          <div className="w-full max-w-md bg-syncme-dark/70 rounded-xl backdrop-blur-lg border border-syncme-light-purple/10 p-6 animate-fade-in card-glow">
            <div className="flex items-center justify-center mb-4">
              <span className="text-3xl mr-2">👥</span>
              <h2 className="text-2xl font-bold mb-0 text-center text-glow">Join or Create</h2>
            </div>
            <p className="text-center text-blue-200/80 mb-6">Enter a room code or create your own vibe room</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-blue-200/80 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="w-full px-4 py-3 rounded-lg bg-syncme-dark/50 border border-syncme-light-purple/20 focus:outline-none focus:ring-2 focus:ring-syncme-light-purple/50 text-white placeholder-blue-200/50"
                maxLength={6}
              />
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleJoinRoom}
                disabled={!joinCode}
                className={`w-full py-3 rounded-lg flex items-center justify-center ${
                  joinCode 
                    ? 'bg-syncme-light-purple hover:bg-syncme-purple text-white shadow-[0_0_15px_rgba(155,135,245,0.3)]' 
                    : 'bg-syncme-dark/50 text-blue-200/40 cursor-not-allowed border border-syncme-light-purple/10'
                } transition-colors`}
              >
                <span className="mr-2 text-xl">👥</span> Join Room
              </button>
              
              <div className="relative flex items-center justify-center my-2">
                <div className="flex-grow h-px bg-syncme-light-purple/20"></div>
                <div className="mx-4 text-blue-200/60">or</div>
                <div className="flex-grow h-px bg-syncme-light-purple/20"></div>
              </div>
              
              <button
                onClick={handleCreateRoom}
                className="w-full py-3 rounded-lg bg-syncme-orange hover:bg-syncme-orange/90 text-white transition-colors shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center justify-center"
              >
                <span className="mr-2 text-xl">✨</span> Create New Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomScreen;
