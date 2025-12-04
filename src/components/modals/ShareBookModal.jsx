import React, { useState, useEffect } from 'react';
import { X, Share2, Users, Globe, UserCheck, UserPlus } from 'lucide-react';
import { shareBook, setBookPublic } from '../../services/bookService';
import { getAllUsers } from '../../services/userService';
import { getUserProfile } from '../../services/userService';

/**
 * ShareBookModal Component
 * Modal for sharing a book with other users or making it public
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} book - The book to share
 * @param {object} currentUser - Current logged in user
 * @param {function} onClose - Callback to close the modal
 * @param {function} onShareSuccess - Callback when sharing is successful
 */
export default function ShareBookModal({
  show,
  book,
  currentUser,
  onClose,
  onShareSuccess
}) {
  const [users, setUsers] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [selectedUserIds, setSelectedUserIds] = useState(book?.sharedWith || []);
  const [isPublic, setIsPublic] = useState(book?.isPublic || false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (show && book) {
      setSelectedUserIds(book.sharedWith || []);
      setIsPublic(book.isPublic || false);
      loadUsers();
    }
  }, [show, book]);

  const loadUsers = async () => {
    try {
      const { data: allUsers, error } = await getAllUsers();
      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      // Filter out current user
      const otherUsers = (allUsers || []).filter(u => u.id !== currentUser?.id);
      setUsers(otherUsers);

      // Load profiles for display
      const profiles = {};
      for (const user of otherUsers) {
        const { data: profile } = await getUserProfile(user.id);
        if (profile) {
          profiles[user.id] = profile;
        }
      }
      setUserProfiles(profiles);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (!book || !currentUser) return;

    setIsLoading(true);
    try {
      console.log('ShareBookModal: Starting share', { 
        bookId: book.id, 
        selectedUserIds, 
        currentUserId: currentUser.id,
        isPublic 
      });

      // Always call shareBook to update shared_with, shared_by, and shared_at
      const { error: shareError, data: shareData } = await shareBook(
        book.id, 
        selectedUserIds || [], 
        currentUser.id
      );
      
      if (shareError) {
        console.error('Share error:', shareError);
        alert(`Error sharing book: ${shareError.message || JSON.stringify(shareError)}`);
        setIsLoading(false);
        return;
      }

      console.log('Share successful, data:', shareData);

      // Set public status
      const { error: publicError } = await setBookPublic(book.id, isPublic);
      if (publicError) {
        console.error('Public status error:', publicError);
        alert(`Error setting public status: ${publicError.message || JSON.stringify(publicError)}`);
        setIsLoading(false);
        return;
      }

      console.log('All sharing operations completed successfully');

      if (onShareSuccess) {
        onShareSuccess({
          sharedWith: selectedUserIds,
          isPublic: isPublic,
          sharedBy: currentUser.id,
          sharedAt: new Date().toISOString()
        });
      }

      onClose();
    } catch (error) {
      console.error('Error sharing book:', error);
      alert('Error sharing book. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!show || !book) return null;

  const filteredUsers = users.filter(user => {
    const profile = userProfiles[user.id];
    const name = profile?.name || user.username || '';
    const email = user.email || '';
    const searchLower = searchQuery.toLowerCase();
    return name.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Share Book</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Book Info */}
          <div className="flex gap-4 items-center bg-gray-50 rounded-lg p-4">
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-16 h-24 object-cover rounded"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{book.title}</h3>
              {book.author && (
                <p className="text-sm text-gray-600">{book.author}</p>
              )}
            </div>
          </div>

          {/* Public Recommendation */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">Public Recommendation</h4>
                  <p className="text-sm text-gray-600">Make this book visible in public recommendations feed</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Share with Users */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">Share with Specific Users</h4>
            </div>

            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />

            {/* User List */}
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery ? 'No users found' : 'No other users available'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredUsers.map(user => {
                    const profile = userProfiles[user.id];
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleToggleUser(user.id)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <div className="flex-1 flex items-center gap-3">
                          <div className="text-2xl">{profile?.avatar || '👤'}</div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-gray-900">
                              {profile?.name || user.username || 'Unknown User'}
                            </div>
                            {user.email && (
                              <div className="text-sm text-gray-500">{user.email}</div>
                            )}
                          </div>
                        </div>
                        {isSelected ? (
                          <UserCheck className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <UserPlus className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedUserIds.length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? 'Sharing...' : 'Share Book'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

