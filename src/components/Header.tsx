
import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title = "SyncMe", 
  showBackButton = false,
  onBack
}) => {
  return (
    <header className="p-4 flex items-center justify-between border-b border-syncme-light-purple/10 backdrop-blur-md bg-syncme-dark/30 sticky top-0 z-10">
      <div className="flex items-center">
        {showBackButton && onBack && (
          <button 
            onClick={onBack}
            className="mr-2 w-8 h-8 flex items-center justify-center rounded-full bg-syncme-dark/50 text-blue-200"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <h1 className="text-lg font-bold text-white">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="text-xs text-syncme-light-purple">
          Beta
        </div>
      </div>
    </header>
  );
};

export default Header;
