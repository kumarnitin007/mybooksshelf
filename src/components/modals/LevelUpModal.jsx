import React from 'react';

/**
 * LevelUpModal Component
 * Displays a celebration modal when the user levels up
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} levelUpData - Data containing level and xp information
 * @param {function} onClose - Callback to close the modal
 */
export default function LevelUpModal({ show, levelUpData, onClose }) {
  if (!show || !levelUpData) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-bounce">
        <div className="text-8xl mb-4">🎉</div>
        <h2 className="text-4xl font-bold text-white mb-2">LEVEL UP!</h2>
        <p className="text-2xl font-semibold text-white mb-4">
          You've reached Level {levelUpData.level}!
        </p>
        <p className="text-white/90 mb-6">
          Total XP: {levelUpData.xp}
        </p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-white text-orange-600 rounded-lg font-bold hover:bg-gray-100 transition-colors"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}

