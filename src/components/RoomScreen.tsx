
import React, { useState } from 'react';
import { Copy, Users } from 'lucide-react';
import Header from './Header';

interface RoomScreenProps {
  roomCode?: string;
  isHost: boolean;
  onJoinRoom: (code: string) => void;
  onCreateRoom: () => void;
  onClose: () => void;
}

const RoomScreen: React.FC<RoomScreenProps> = ({ 
  roomCode, 
  isHost, 
  onJoinRoom, 
  onCreateRoom,
  onClose
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-syncme-dark/95 flex flex-col animate-fade-in">
      <Header title="Vibe Together" showBackButton={true} />
      
      <div className="flex flex-col items-center justify-center flex-1 p-6">
        {isHost && roomCode ? (
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-center">Room Created!</h2>
            <p className="text-center text-gray-500 mb-6">Share this code with friends to vibe together</p>
            
            <div className="flex items-center justify-center mb-6">
              <div className="flex-1 bg-gray-100 p-4 rounded-l-lg font-mono text-xl text-center">
                {roomCode}
              </div>
              <button 
                onClick={copyToClipboard}
                className="bg-syncme-light-purple p-4 rounded-r-lg text-white hover:bg-syncme-purple transition-colors"
              >
                {copied ? (
                  <span className="text-sm">Copied!</span>
                ) : (
                  <Copy size={20} />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-center space-x-2 p-4 border border-dashed border-gray-300 rounded-lg mb-6">
              <Users className="text-syncme-light-purple" />
              <p className="text-gray-500">Waiting for others to join...</p>
            </div>
            
            <button 
              className="w-full py-3 rounded-lg btn-primary"
              onClick={onClose}
            >
              Continue to Player
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-center">Join or Create a Room</h2>
            <p className="text-center text-gray-500 mb-6">Enter a room code or create your own room</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-syncme-light-purple"
                maxLength={6}
              />
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => joinCode && onJoinRoom(joinCode)}
                disabled={!joinCode}
                className={`w-full py-3 rounded-lg ${
                  joinCode 
                    ? 'bg-syncme-light-purple hover:bg-syncme-purple text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                } transition-colors`}
              >
                Join Room
              </button>
              
              <div className="relative flex items-center justify-center">
                <div className="flex-grow h-px bg-gray-300"></div>
                <div className="mx-4 text-gray-500">or</div>
                <div className="flex-grow h-px bg-gray-300"></div>
              </div>
              
              <button
                onClick={onCreateRoom}
                className="w-full py-3 rounded-lg bg-syncme-orange hover:bg-syncme-orange/90 text-white transition-colors"
              >
                Create New Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomScreen;
