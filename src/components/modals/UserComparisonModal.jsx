import React from 'react';
import { X } from 'lucide-react';

/**
 * UserComparisonModal Component
 * Displays a comparison table of all users' reading statistics
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {array} users - Array of all users
 * @param {object} currentUser - The currently logged in user
 * @param {object} userProfiles - Map of userId -> profile data
 * @param {object} userStats - Map of userId -> stats (xp, level)
 * @param {boolean} loadingUserStats - Whether stats are being loaded
 * @param {function} onClose - Callback to close the modal
 * @param {function} getTotalBooksRead - Function to get total books read for a user
 * @param {function} getBooksReadThisMonth - Function to get books read this month for a user
 */
export default function UserComparisonModal({
  show,
  users,
  currentUser,
  userProfiles,
  userStats,
  loadingUserStats,
  onClose,
  getTotalBooksRead,
  getBooksReadThisMonth
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">User Comparison</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {loadingUserStats ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading user statistics...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Books</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">This Month</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Level</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">XP</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Sort users: current user first, then by total books (descending)
                  const sortedUsers = [...users].sort((a, b) => {
                    const aIsCurrent = currentUser && a.id === currentUser.id;
                    const bIsCurrent = currentUser && b.id === currentUser.id;
                    
                    // Current user always first
                    if (aIsCurrent && !bIsCurrent) return -1;
                    if (!aIsCurrent && bIsCurrent) return 1;
                    
                    // Then sort by total books (descending)
                    const aBooks = getTotalBooksRead(a.id);
                    const bBooks = getTotalBooksRead(b.id);
                    return bBooks - aBooks;
                  });
                  
                  return sortedUsers.map((user) => {
                    const totalBooks = getTotalBooksRead(user.id);
                    const monthlyBooks = getBooksReadThisMonth(user.id);
                    const isCurrentUser = currentUser && user.id === currentUser.id;
                    const profile = userProfiles[user.id];
                    const displayName = profile?.name?.trim() || user.username || user.email || 'Unknown User';
                    const avatar = profile?.avatar || '👤';
                    const userXP = userStats[user.id]?.xp || 0;
                    const userLevel = userStats[user.id]?.level || 1;
                    
                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          isCurrentUser ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{avatar}</span>
                            <span className={`font-medium ${isCurrentUser ? 'text-indigo-600' : 'text-gray-900'}`}>
                              {displayName}
                              {isCurrentUser && <span className="ml-2 text-xs text-indigo-500">(You)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="text-lg font-semibold text-gray-900">{totalBooks}</span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="text-lg font-semibold text-indigo-600">{monthlyBooks}</span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="text-lg font-semibold text-yellow-600">Level {userLevel}</span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="text-lg font-semibold text-orange-600">{userXP.toLocaleString()}</span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No users found. Create an account to get started!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

