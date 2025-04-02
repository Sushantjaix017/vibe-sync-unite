
import React from 'react';
import { Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title = "SyncMe", 
  showBackButton = false,
  className 
}) => {
  const navigate = useNavigate();

  return (
    <header className={cn(
      "flex items-center justify-between p-4 bg-gradient-to-r from-syncme-light-purple to-syncme-purple text-white shadow-md animate-fade-in",
      className
    )}>
      <div className="flex items-center">
        {showBackButton && (
          <button 
            onClick={() => navigate(-1)}
            className="mr-2 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex items-center">
          <Music className="h-6 w-6 mr-2" />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      </div>
      <div className="flex items-center">
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
