import React from 'react';
import { getGenreColor } from '../../utils/genreColors';

/**
 * BookSpine Component
 * Displays a book in spine view with 3D effect
 * 
 * @param {object} book - Book object
 * @param {number} index - Index of the book in the list
 * @param {function} onClick - Callback when book is clicked
 */
export default function BookSpine({ book, index, onClick }) {
  return (
    <button
      key={book.id}
      onClick={() => onClick(book)}
      className="relative group"
      style={{ 
        perspective: '1000px',
        height: '300px'
      }}
    >
      {/* Book Spine with 3D effect */}
      <div
        className="relative h-full transition-all duration-300 transform hover:scale-105"
        style={{
          width: '55px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Main spine face */}
        <div
          className="absolute inset-0 rounded-sm shadow-2xl transition-all duration-300 overflow-hidden"
          style={{
            backgroundColor: `hsl(${(index * 25) % 360}, 65%, 45%)`,
            transform: 'rotateY(-2deg)',
            boxShadow: 'inset -3px 0 10px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1)',
            backgroundImage: book.coverUrl && !book.coverUrl.includes('placeholder') 
              ? `linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.1)), url(${book.coverUrl})`
              : `linear-gradient(135deg, hsl(${(index * 25) % 360}, 65%, 45%) 0%, hsl(${(index * 25) % 360}, 65%, 35%) 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'left center',
          }}
        >
          {/* Top binding line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          {/* Bottom binding line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          {/* Left edge highlight (spine edge) */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-white/30 to-transparent"></div>
          
          {/* Right edge shadow (spine edge) */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-black/40 to-transparent"></div>
          
          {/* Text on spine */}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <div 
              className="text-white font-bold text-xs leading-tight transform -rotate-90 whitespace-nowrap"
              style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)',
                letterSpacing: '0.5px',
                maxWidth: '250px',
              }}
            >
              {book.title.length > 25 ? book.title.substring(0, 25) + '...' : book.title}
            </div>
          </div>
          
          {/* Author on spine (smaller, at bottom) */}
          {book.author && (
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center">
              <div 
                className="text-white/80 text-[10px] font-medium transform -rotate-90 whitespace-nowrap"
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  maxWidth: '200px',
                }}
              >
                {book.author.length > 20 ? book.author.substring(0, 20) + '...' : book.author}
              </div>
            </div>
          )}
          
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
          }}></div>
        </div>
        
        {/* Top edge of book (when viewed from side) */}
        <div
          className="absolute top-0 left-0 right-0 h-2 rounded-t-sm"
          style={{
            backgroundColor: `hsl(${(index * 25) % 360}, 65%, 55%)`,
            transform: 'rotateX(88deg) translateZ(2px)',
            transformOrigin: 'top center',
            boxShadow: '0 -2px 5px rgba(0,0,0,0.3)',
          }}
        ></div>
        
        {/* Bottom edge of book (when viewed from side) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 rounded-b-sm"
          style={{
            backgroundColor: `hsl(${(index * 25) % 360}, 65%, 35%)`,
            transform: 'rotateX(-88deg) translateZ(2px)',
            transformOrigin: 'bottom center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
          }}
        ></div>
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 z-20 shadow-xl pointer-events-none min-w-[150px]">
        <div className="font-semibold">{book.title}</div>
        {book.author && <div className="text-gray-300 text-[10px] mt-1">{book.author}</div>}
        {book.genre && (() => {
          const genreColors = getGenreColor(book.genre);
          return (
            <div className="mt-1.5">
              <span className={`px-1.5 py-0.5 ${genreColors.bg} ${genreColors.text} rounded text-[10px] font-semibold border ${genreColors.border}`}>
                {book.genre}
              </span>
            </div>
          );
        })()}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </button>
  );
}

