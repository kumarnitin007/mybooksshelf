/**
 * Avatar Selector Component
 * 
 * Allows users to select an avatar emoji from a predefined list.
 * Used in the profile settings modal.
 */

import React, { useState, useEffect } from 'react';

const AVATARS = [
  '📚', '🦦', '👦', '👧', '🧑', '👨', '👩', '👴', '👵',
  '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞',
  '🐱', '🐶', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁',
  '🐸', '🐷', '🐮', '🐹', '🐭', '🦊', '🐺',
  '🎃', '👻', '🤖', '👽', '👾', '🤡', '💀', '☠️',
  '🦄', '🐉', '🐲', '🦋', '🐝', '🐞', '🦗', '🕷️',
  '🌞', '⭐', '🌟', '💫', '✨', '🔥', '💧', '⚡',
  '🎮', '🎯', '🎲', '🎨', '🎭', '🎪', '🎬', '🎤'
];

/**
 * AvatarSelector Component
 * @param {string} currentAvatar - The currently selected avatar
 * @param {Function} onSelect - Callback function when an avatar is selected
 */
const AvatarSelector = ({ currentAvatar, onSelect }) => {
  const [selected, setSelected] = useState(currentAvatar || '📚');

  useEffect(() => {
    setSelected(currentAvatar || '📚');
  }, [currentAvatar]);

  const handleSelect = (avatar) => {
    setSelected(avatar);
    onSelect(avatar);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Choose Your Avatar
      </label>
      <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
        {AVATARS.map((avatar) => (
          <button
            key={avatar}
            onClick={() => handleSelect(avatar)}
            className={`text-2xl p-2 rounded-lg transition-all hover:scale-110 ${
              selected === avatar
                ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
                : 'bg-white hover:bg-gray-100'
            }`}
            title={avatar}
          >
            {avatar}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500 text-center">
        Click an emoji to select it as your avatar
      </div>
    </div>
  );
};

export default AvatarSelector;

