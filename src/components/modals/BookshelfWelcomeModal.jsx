import React from 'react';
import { X } from 'lucide-react';
import { ANIMAL_THEMES } from '../../constants/animalThemes';

/**
 * BookshelfWelcomeModal Component
 * Displays a welcome modal with "My Bookshelf" title, bookshelf icon, and animal emojis around it
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {function} onClose - Callback to close the modal
 */
export default function BookshelfWelcomeModal({ show, onClose }) {
  if (!show) return null;

  // Get all animal emojis from themes
  const animalEmojis = Object.values(ANIMAL_THEMES).map(theme => theme.emoji);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center relative animate-pulse"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <h2 className="text-4xl font-bold text-white mb-8 flex items-center justify-center gap-3 drop-shadow-lg">
          <span className="text-5xl">📚</span>
          <span>My Bookshelf</span>
        </h2>

        {/* Animal emojis arranged in a circle around the bookshelf */}
        <div className="relative w-80 h-80 mx-auto mb-6">
          {/* Center bookshelf icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-9xl animate-pulse">📚</div>
          </div>
          
          {/* Animal emojis positioned around the center - spread 15% further from center */}
          <div className="absolute inset-0">
            {/* Top */}
            <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: '-15%' }}>
              <div className="text-7xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '1.5s' }}>
                {animalEmojis[0] || '🐱'}
              </div>
            </div>
            
            {/* Top-right */}
            <div className="absolute" style={{ top: '8%', right: '12%' }}>
              <div className="text-6xl animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1.7s' }}>
                {animalEmojis[1] || '🐶'}
              </div>
            </div>
            
            {/* Right */}
            <div className="absolute top-1/2 transform -translate-y-1/2" style={{ right: '-15%' }}>
              <div className="text-7xl animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '1.6s' }}>
                {animalEmojis[2] || '🐰'}
              </div>
            </div>
            
            {/* Bottom-right */}
            <div className="absolute" style={{ bottom: '8%', right: '12%' }}>
              <div className="text-6xl animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '1.8s' }}>
                {animalEmojis[3] || '🐻'}
              </div>
            </div>
            
            {/* Bottom */}
            <div className="absolute left-1/2 transform -translate-x-1/2" style={{ bottom: '-15%' }}>
              <div className="text-7xl animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '1.5s' }}>
                {animalEmojis[4] || '🐼'}
              </div>
            </div>
            
            {/* Bottom-left */}
            <div className="absolute" style={{ bottom: '8%', left: '12%' }}>
              <div className="text-6xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '1.7s' }}>
                {animalEmojis[5] || '🦊'}
              </div>
            </div>
            
            {/* Left */}
            <div className="absolute top-1/2 transform -translate-y-1/2" style={{ left: '-15%' }}>
              <div className="text-7xl animate-bounce" style={{ animationDelay: '1.2s', animationDuration: '1.6s' }}>
                {animalEmojis[6] || '🦉'}
              </div>
            </div>
            
            {/* Top-left */}
            <div className="absolute" style={{ top: '8%', left: '12%' }}>
              <div className="text-6xl animate-bounce" style={{ animationDelay: '1.4s', animationDuration: '1.8s' }}>
                {animalEmojis[7] || '🐧'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional animals in a row below */}
        {animalEmojis.length > 8 && (
          <div className="flex justify-center gap-6 mb-6 flex-wrap">
            {animalEmojis.slice(8).map((emoji, index) => (
              <div 
                key={index}
                className="text-6xl animate-bounce opacity-75"
                style={{ animationDelay: `${1.6 + index * 0.2}s`, animationDuration: '1.5s' }}
              >
                {emoji}
              </div>
            ))}
          </div>
        )}

        {/* Close button at bottom */}
        <button
          onClick={onClose}
          className="px-8 py-3 bg-white text-orange-600 rounded-lg font-bold hover:bg-gray-100 transition-all shadow-lg mt-4"
        >
          Close
        </button>
      </div>
    </div>
  );
}

