import React, { useState } from 'react';
import { Coffee, DollarSign, Sparkles, Book, X, ChevronDown, ChevronUp, Grid } from 'lucide-react';

const AboutBookshelfModal = ({ show, onClose }) => {
  const [isAppsExpanded, setIsAppsExpanded] = useState(false);
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);
  
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
            📚 Hey there, book lover! Bookshelf is like having your own personal library right in your pocket! 
            It's super easy to use and makes reading way more fun. You can organize all your books into cool themed 
            shelves (each one has its own cute animal theme!), keep track of what you're reading, and even remember 
            your favorite parts of each book. Plus, you can see how many books you've read and challenge yourself 
            to read even more! Whether you're a reading pro or just getting started, Bookshelf is here to make your 
            reading journey awesome! 🎉
          </p>
        </div>

        {/* Other Apps in the Family Section */}
        <div className="mb-6 bg-white/80 rounded-xl p-6 border border-amber-200 shadow-sm">
          <button
            onClick={() => setIsAppsExpanded(!isAppsExpanded)}
            className="w-full flex items-center justify-between text-left"
            title={isAppsExpanded ? "Click to collapse other apps" : "Click to see other apps in the family"}
          >
            <h3 className="text-xl font-bold text-cyan-700 flex items-center gap-2">
              <Grid className="w-5 h-5" />
              Other Apps in the Family
            </h3>
            {isAppsExpanded ? (
              <ChevronUp className="w-5 h-5 text-cyan-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-cyan-700" />
            )}
          </button>
          {isAppsExpanded && (
            <div className="mt-4 space-y-4">
              {/* Bookshelf */}
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-4 border border-amber-200">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-900">📚 Bookshelf</h4>
                  <a 
                    href="https://mybooksshelf.vercel.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline"
                  >
                    Visit App →
                  </a>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your personal reading tracker and library organizer! Keep track of books you've read, want to read, 
                  and get personalized recommendations. Organize your collection with themed bookshelves and detailed 
                  book information.
                </p>
              </div>

              {/* Cipher Otto */}
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-4 border border-purple-200">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-900">🦦 Cipher Otto</h4>
                  <div className="flex gap-2">
                    <a 
                      href="https://cipher-otto.vercel.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium underline"
                    >
                      Beta →
                    </a>
                    <a 
                      href="https://cipher-otto2.vercel.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium underline"
                    >
                      Stable →
                    </a>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your interactive cryptography learning platform! Learn, practice, and master various ciphers 
                  with Otto's guidance. Explore historical ciphers, solve challenges, track your progress, and 
                  join a community of cryptography enthusiasts.
                </p>
              </div>

              {/* Leo Planner */}
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-4 border border-blue-200">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-900">🦁 Leo Planner</h4>
                  <span className="text-gray-500 text-sm">URL TBD</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your personal task manager, event tracker, and gift card organizer. Keep track of your schedule, 
                  share calendars with family, and manage your daily tasks with ease.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mb-6 bg-white/80 rounded-xl p-6 border border-amber-200 shadow-sm">
          <button
            onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
            className="w-full flex items-center justify-between text-left"
            title={isFeaturesExpanded ? "Click to collapse features" : "Click to see all awesome features"}
          >
            <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
              <Book className="w-5 h-5" />
              Cool Features
            </h3>
            {isFeaturesExpanded ? (
              <ChevronUp className="w-5 h-5 text-purple-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-purple-700" />
            )}
          </button>
          {isFeaturesExpanded && (
            <div className="mt-4 space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">🎨 Themed Bookshelves</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Create super cool bookshelves with different animal themes! Each shelf has its own personality 
                  and colors. You can have as many shelves as you want to organize your books however you like!
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">📖 Track Everything</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Keep track of when you started reading, when you finished, and even rate your books! 
                  Write down your favorite characters, memorable moments, and what you thought about each book. 
                  It's like having a reading journal that never gets lost!
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">⭐ Wishlist & Favorites</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Have a special place for books you want to read (your wishlist) and books you absolutely loved 
                  (your favorites)! These shelves never get full, so add as many as you want!
                </p>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">🎮 Level Up & Achievements</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Reading is like a game! Earn XP (experience points) for every book you finish, level up, 
                  and unlock cool achievements! Keep your reading streak going and see how awesome you're doing!
                </p>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">🔍 Search & Find</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Can't remember where you put that book? No problem! Search by title or author to find it instantly. 
                  You can also filter to see only books you've read, haven't read, or rated!
                </p>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-4 border border-pink-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">📊 Reading Stats</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  See how many books you've read this month, your average rating, and even your favorite author! 
                  Set monthly reading goals and watch yourself crush them! 📈
                </p>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">💡 Book Recommendations</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Get awesome book suggestions based on what you've read! Discover new books you might love and 
                  add them to your wishlist with just one click!
                </p>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">📱 Multiple Views</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  View your books as cool covers, as spines on a shelf, or in a detailed table! Switch between 
                  views anytime to see your collection in different ways!
                </p>
              </div>

              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">📤 Export Your Data</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Want to keep a backup or share your reading list? Export all your books to CSV or JSON format 
                  anytime! Your data, your control!
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

