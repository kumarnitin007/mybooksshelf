import React, { useState } from 'react';
import { Coffee, DollarSign, Sparkles, Book, X, ChevronDown, ChevronUp } from 'lucide-react';

const AboutBookshelfModal = ({ show, onClose }) => {
  const [isAppsExpanded, setIsAppsExpanded] = useState(false);
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border-2 border-amber-200 my-8 max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-white/50 rounded-full"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center mb-6">
          <div className="mb-4 text-6xl">📚</div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900">About Bookshelf 💙</h2>
        </div>

        {/* About Bookshelf Section */}
        <div className="mb-6 bg-white/80 rounded-xl p-6 border border-amber-200 shadow-sm">
          <h3 className="text-xl font-bold mb-3 text-amber-700 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Meet Your Bookshelf
          </h3>
          <p className="text-gray-700 leading-relaxed">
            📚 Bookshelf is your personal reading companion! Track your reading journey, organize your books into beautiful themed shelves, 
            and discover new favorites. Whether you're a voracious reader or just starting your reading adventure, Bookshelf helps you 
            keep track of what you've read, what you want to read, and what you loved. With customizable animal themes, detailed book 
            tracking, and reading recommendations, Bookshelf makes managing your personal library fun and engaging!
          </p>
        </div>

        {/* Other Apps in the Family Section */}
        <div className="mb-6 bg-white/80 rounded-xl p-6 border border-amber-200 shadow-sm">
          <button
            onClick={() => setIsAppsExpanded(!isAppsExpanded)}
            className="w-full flex items-center justify-between text-left"
            title={isAppsExpanded ? "Click to collapse other apps" : "Click to see other apps in the family"}
          >
            <h3 className="text-xl font-bold text-cyan-700">Other Apps in the Family</h3>
            {isAppsExpanded ? (
              <ChevronUp className="w-5 h-5 text-cyan-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-cyan-700" />
            )}
          </button>
          {isAppsExpanded && (
            <div className="mt-4 space-y-4">
              {/* Cipher Otto */}
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-4 border border-purple-200">
                <div className="mb-2">
                  <h4 className="text-lg font-bold text-gray-900">🦦 Cipher Otto</h4>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your interactive cryptography learning platform! Learn, practice, and master various ciphers 
                  with Otto's guidance. Explore historical ciphers, solve challenges, track your progress, and 
                  join a community of cryptography enthusiasts.
                </p>
              </div>

              {/* Bookshelf */}
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-4 border border-amber-200">
                <div className="mb-2">
                  <h4 className="text-lg font-bold text-gray-900">📚 Bookshelf</h4>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your personal reading tracker and library organizer! Keep track of books you've read, want to read, 
                  and get personalized recommendations. Organize your collection with themed bookshelves and detailed 
                  book information.
                </p>
              </div>

              {/* Leo Planner */}
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-4 border border-blue-200">
                <div className="mb-2">
                  <h4 className="text-lg font-bold text-gray-900">🦁 Leo Planner</h4>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your personal task manager, event tracker, and gift card organizer. Keep track of your schedule, 
                  share calendars with family, and manage your daily tasks with ease.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Support Section */}
        <div className="mb-6 bg-white/80 rounded-xl p-6 border border-amber-200 shadow-sm">
          <h3 className="text-xl font-bold mb-3 text-green-700">Support Bookshelf</h3>
          <p className="text-gray-700 mb-4">Help keep this app free and ad-free!</p>
          <div className="space-y-3">
            <a href="https://venmo.com/Nitin-Kumar-22" target="_blank" rel="noopener noreferrer" className="block w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 py-4 rounded-xl font-bold text-center transition-all">
              <Coffee className="w-6 h-6 inline mr-2" />
              Donate via Venmo
            </a>
            <a href="https://paypal.me/kumarnitin007" target="_blank" rel="noopener noreferrer" className="block w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 py-4 rounded-xl font-bold text-center transition-all">
              <DollarSign className="w-6 h-6 inline mr-2" />
              Donate via PayPal
            </a>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-white hover:bg-gray-50 text-gray-900 py-3 rounded-xl font-semibold transition-all border border-amber-200 shadow-sm">Close</button>
      </div>
    </div>
  );
};

export default AboutBookshelfModal;

