/**
 * Animal Themes Configuration
 * 
 * Defines the visual themes for bookshelves, including colors, emojis, and decorations.
 * Each theme has a unique color scheme and animation style.
 * 
 * Optional: Add gifUrl property to any theme to display an animated GIF instead of emoji.
 * Example: gifUrl: 'https://example.com/cat-animated.gif'
 * If gifUrl is provided, it will be displayed. If it fails to load, it falls back to emoji.
 */

export const ANIMAL_THEMES = {
  cat: { 
    name: 'Cat', 
    emoji: '🐱', 
    colors: { primary: 'from-pink-500 to-rose-500', secondary: 'bg-pink-100', accent: 'text-pink-600' },
    decorations: ['🐱', '🐾', '💕', '⭐'],
    animation: 'float',
    gifUrl: 'https://media.giphy.com/media/Duzbk7OJGmNwwvB4i0/giphy.gif' // Cat studying GIF from Giphy (Mochimons)
  },
  dog: { 
    name: 'Dog', 
    emoji: '🐶', 
    colors: { primary: 'from-amber-500 to-orange-500', secondary: 'bg-amber-100', accent: 'text-amber-600' },
    decorations: ['🐶', '🦴', '🎾', '⭐'],
    animation: 'bounce',
    gifUrl: 'https://media.giphy.com/media/3LrK7Q7UhF5MnhZ5ja/giphy.gif' // Dog reading book GIF from Giphy (Texas A&M University)
  },
  bunny: { 
    name: 'Bunny', 
    emoji: '🐰', 
    colors: { primary: 'from-purple-500 to-indigo-500', secondary: 'bg-purple-100', accent: 'text-purple-600' },
    decorations: ['🐰', '🥕', '🌸', '✨'],
    animation: 'hop',
    gifUrl: 'https://media.giphy.com/media/8dYmJ6Buo3lYY/giphy.gif' // Baby reading book GIF from Giphy
  },
  bear: { 
    name: 'Bear', 
    emoji: '🐻', 
    colors: { primary: 'from-brown-500 to-amber-800', secondary: 'bg-amber-100', accent: 'text-amber-700' },
    decorations: ['🐻', '🍯', '🌲', '⭐'],
    animation: 'sway',
    // gifUrl: 'https://example.com/bear-animated.gif' // Optional
  },
  panda: { 
    name: 'Panda', 
    emoji: '🐼', 
    colors: { primary: 'from-gray-600 to-gray-800', secondary: 'bg-gray-100', accent: 'text-gray-700' },
    decorations: ['🐼', '🎋', '🍃', '⭐'],
    animation: 'float',
    // gifUrl: 'https://example.com/panda-animated.gif' // Optional
  },
  fox: { 
    name: 'Fox', 
    emoji: '🦊', 
    colors: { primary: 'from-orange-500 to-red-500', secondary: 'bg-orange-100', accent: 'text-orange-600' },
    decorations: ['🦊', '🍇', '🍂', '✨'],
    animation: 'dash',
    // gifUrl: 'https://example.com/fox-animated.gif' // Optional
  },
  owl: { 
    name: 'Owl', 
    emoji: '🦉', 
    colors: { primary: 'from-yellow-600 to-amber-600', secondary: 'bg-yellow-100', accent: 'text-yellow-700' },
    decorations: ['🦉', '🌙', '⭐', '✨'],
    animation: 'glide',
    // gifUrl: 'https://example.com/owl-animated.gif' // Optional
  },
  penguin: { 
    name: 'Penguin', 
    emoji: '🐧', 
    colors: { primary: 'from-blue-600 to-indigo-600', secondary: 'bg-blue-100', accent: 'text-blue-600' },
    decorations: ['🐧', '❄️', '🌊', '⭐'],
    animation: 'slide',
    // gifUrl: 'https://example.com/penguin-animated.gif' // Optional
  },
  heart: { 
    name: 'Heart', 
    emoji: '❤️', 
    colors: { primary: 'from-red-500 to-pink-500', secondary: 'bg-red-100', accent: 'text-red-600' },
    decorations: ['❤️', '💕', '✨', '⭐'],
    animation: 'pulse',
    // gifUrl: 'https://example.com/heart-animated.gif' // Optional
  },
  sparkles: { 
    name: 'Sparkles', 
    emoji: '✨', 
    colors: { primary: 'from-purple-500 to-pink-500', secondary: 'bg-purple-100', accent: 'text-purple-600' },
    decorations: ['✨', '⭐', '💫', '🌟'],
    animation: 'sparkle',
    // gifUrl: 'https://example.com/sparkles-animated.gif' // Optional
  },
};

