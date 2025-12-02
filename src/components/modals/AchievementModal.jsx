import React from 'react';

/**
 * AchievementModal Component
 * Displays a celebration modal when the user unlocks an achievement
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} achievement - Achievement data with badge_emoji, badge_name, and badge_description
 * @param {function} onClose - Callback to close the modal
 */
export default function AchievementModal({ show, achievement, onClose }) {
  if (!show || !achievement) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-pulse">
        <div className="text-8xl mb-4">{achievement.badge_emoji}</div>
        <h2 className="text-3xl font-bold text-white mb-2">Achievement Unlocked!</h2>
        <p className="text-2xl font-semibold text-white mb-2">
          {achievement.badge_name}
        </p>
        <p className="text-white/90 mb-6">
          {achievement.badge_description}
        </p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition-colors"
        >
          Amazing!
        </button>
      </div>
    </div>
  );
}

