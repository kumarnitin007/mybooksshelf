import React from 'react';
import { X, Trophy, Sparkles } from 'lucide-react';

/**
 * RewardUnlockedModal Component
 * Displays a celebration modal when the user unlocks a virtual reward
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {array} rewards - Array of newly unlocked rewards
 * @param {function} onClose - Callback to close the modal
 */
export default function RewardUnlockedModal({ show, rewards, onClose }) {
  if (!show || !rewards || rewards.length === 0) return null;

  const reward = rewards[0]; // Show first reward, or we could show all

  const getRewardTypeColor = (type) => {
    const colors = {
      badge: 'from-yellow-500 via-orange-500 to-red-500',
      title: 'from-purple-500 via-pink-500 to-red-500',
      achievement: 'from-indigo-500 via-blue-500 to-purple-500',
      milestone: 'from-green-500 via-emerald-500 to-teal-500',
      default: 'from-gray-500 via-slate-500 to-zinc-500'
    };
    return colors[type] || colors.default;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br ${getRewardTypeColor(reward.reward_type)} rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-pulse`}>
        <div className="text-8xl mb-4">{reward.reward_emoji || '🎁'}</div>
        <h2 className="text-3xl font-bold text-white mb-2">Reward Unlocked! 🎉</h2>
        <p className="text-2xl font-semibold text-white mb-2">
          {reward.reward_name}
        </p>
        {reward.reward_description && (
          <p className="text-white/90 mb-4">
            {reward.reward_description}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 text-white/80 mb-6">
          <Trophy className="w-5 h-5" />
          <span className="text-sm">Keep reading to unlock more rewards!</span>
        </div>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition-colors"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}

