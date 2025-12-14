import React, { useState, useEffect } from 'react';
import { X, Settings, Users, Trophy, BookOpen, BarChart3, Shield, Check, X as XIcon, Edit2, Trash2, Save, Plus } from 'lucide-react';
import { getAllUsersWithProfiles, updateUserSettings } from '../../services/adminService';
import { getAllRewards, updateReward, deleteReward, createReward } from '../../services/adminService';
import { getSystemStats } from '../../services/adminService';

/**
 * AdminModal Component
 * Admin console for managing users, rewards, and system settings
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} currentUser - Current logged in user
 * @param {function} onClose - Callback to close the modal
 */
export default function AdminModal({
  show,
  currentUser,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('stats'); // stats, users, rewards
  const [users, setUsers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewRewardForm, setShowNewRewardForm] = useState(false);
  const [newReward, setNewReward] = useState({
    user_id: '', // Optional - for user-specific rewards
    reward_type: 'badge',
    reward_name: '',
    reward_value: '',
    reward_emoji: '',
    reward_description: '',
    criteria_genre: '' // Optional - for criteria-based rewards
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Common emojis for rewards
  const rewardEmojis = [
    '🏆', '📚', '⭐', '🎖️', '👑', '💎', '🌟', '🔥', '✨', '🎯',
    '📖', '📝', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎮', '🎲',
    '🏅', '🥇', '🥈', '🥉', '🎖️', '🏵️', '🎗️', '🎟️', '🎫', '🎁'
  ];

  useEffect(() => {
    if (show) {
      loadData();
    }
  }, [show]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      const [usersResult, rewardsResult, statsResult] = await Promise.all([
        getAllUsersWithProfiles(),
        getAllRewards(),
        getSystemStats()
      ]);

      if (usersResult.data) setUsers(usersResult.data);
      if (rewardsResult.data) setRewards(rewardsResult.data);
      if (statsResult.data) setSystemStats(statsResult.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserSettings = async (userId, settings) => {
    setIsLoading(true);
    try {
      const { error } = await updateUserSettings(userId, settings);
      if (error) {
        alert(`Error updating user settings: ${error.message}`);
      } else {
        await loadData(); // Reload data
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      alert('Error updating user settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReward = async (rewardId, updates) => {
    setIsLoading(true);
    try {
      const { error } = await updateReward(rewardId, updates);
      if (error) {
        alert(`Error updating reward: ${error.message}`);
      } else {
        await loadData(); // Reload data
        setEditingReward(null);
      }
    } catch (error) {
      console.error('Error updating reward:', error);
      alert('Error updating reward');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReward = async (rewardId) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    setIsLoading(true);
    try {
      const { error } = await deleteReward(rewardId);
      if (error) {
        alert(`Error deleting reward: ${error.message}`);
      } else {
        await loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error deleting reward:', error);
      alert('Error deleting reward');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReward = async () => {
    if (!newReward.reward_name || !newReward.reward_type) {
      alert('Please fill in all required fields (Type, Name)');
      return;
    }

    // User selection is optional - if not provided, this is a criteria-based reward
    // that will be automatically assigned to users who meet the criteria

    setIsLoading(true);
    try {
      const { data, error } = await createReward(
        newReward.user_id || null, // Optional user_id
        newReward.reward_type,
        newReward.reward_name,
        newReward.reward_value || '0',
        newReward.reward_emoji || null,
        newReward.reward_description || null,
        newReward.criteria_genre || null // Optional genre criteria
      );

      if (error) {
        alert(`Error creating reward: ${error.message}`);
      } else {
        await loadData(); // Reload data
        setShowNewRewardForm(false);
        setNewReward({
          user_id: '',
          reward_type: 'badge',
          reward_name: '',
          reward_value: '',
          reward_emoji: '',
          reward_description: '',
          criteria_genre: ''
        });
      }
    } catch (error) {
      console.error('Error creating reward:', error);
      alert('Error creating reward');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const username = (user.username || '').toLowerCase();
    const name = (user.name || '').toLowerCase();
    return username.includes(query) || name.includes(query);
  });

  // Helper function to extract genre from description
  const extractGenreFromDescription = (description) => {
    if (!description) return null;
    const match = description.match(/\[Criteria: Genre = ([^\]]+)\]/);
    return match ? match[1] : null;
  };

  // Helper function to remove genre from description
  const removeGenreFromDescription = (description) => {
    if (!description) return '';
    return description.replace(/\s*\|\s*\[Criteria: Genre = [^\]]+\]/, '').replace(/\[Criteria: Genre = [^\]]+\]\s*\|\s*/, '').replace(/\[Criteria: Genre = [^\]]+\]/, '').trim();
  };

  const filteredRewards = rewards.filter(reward => {
    const query = searchQuery.toLowerCase();
    const rewardName = (reward.reward_name || '').toLowerCase();
    const userName = users.find(u => u.id === reward.user_id)?.username || '';
    const genre = extractGenreFromDescription(reward.reward_description) || '';
    return rewardName.includes(query) || userName.toLowerCase().includes(query) || genre.toLowerCase().includes(query);
  });

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Admin Console</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-grow">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'rewards'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Rewards ({rewards.length})
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* Statistics Tab */}
              {activeTab === 'stats' && systemStats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Total Users</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">{systemStats.totalUsers}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Total Books</span>
                      </div>
                      <p className="text-3xl font-bold text-green-600">{systemStats.totalBooks}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-600">Total Rewards</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-600">{systemStats.totalRewards}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-600">Total Bookshelves</span>
                      </div>
                      <p className="text-3xl font-bold text-yellow-600">{systemStats.totalBookshelves}</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-600">Total Challenges</span>
                      </div>
                      <p className="text-3xl font-bold text-indigo-600">{systemStats.totalChallenges}</p>
                    </div>
                  </div>
                  {systemStats.mostActiveUser && (
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-medium text-gray-600">Most Active User</span>
                      </div>
                      <p className="text-2xl font-bold text-teal-600">{systemStats.mostActiveUser.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        @{systemStats.mostActiveUser.username} • {systemStats.mostActiveUser.bookCount} books
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No users found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hide from Compare</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">AI Access</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Admin</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{user.avatar || '📚'}</span>
                                  <span className="font-medium text-gray-900">{user.name || user.username || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">@{user.username}</td>
                              <td className="px-4 py-3">
                                {editingUser?.id === (user.user_id || user.id) ? (
                                  <input
                                    type="checkbox"
                                    checked={editingUser.hide_from_comparison || false}
                                    onChange={(e) => setEditingUser({ ...editingUser, hide_from_comparison: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                  />
                                ) : (
                                  <span className="text-gray-600">
                                    {user.hide_from_comparison ? 'Yes' : 'No'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {editingUser?.id === (user.user_id || user.id) ? (
                                  <input
                                    type="checkbox"
                                    checked={editingUser.ai_recommendations_enabled !== false}
                                    onChange={(e) => setEditingUser({ ...editingUser, ai_recommendations_enabled: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                  />
                                ) : (
                                  <span className="text-gray-600">
                                    {user.ai_recommendations_enabled !== false ? 'Yes' : 'No'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {editingUser?.id === (user.user_id || user.id) ? (
                                  <input
                                    type="checkbox"
                                    checked={editingUser.is_admin || false}
                                    onChange={(e) => setEditingUser({ ...editingUser, is_admin: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                  />
                                ) : (
                                  <span className="text-gray-600">
                                    {user.is_admin ? 'Yes' : 'No'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {editingUser?.id === (user.user_id || user.id) ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        // Use user_id if available (from merged data), otherwise use id
                                        const userId = user.user_id || user.id;
                                        handleUpdateUserSettings(userId, {
                                          hide_from_comparison: editingUser.hide_from_comparison || false,
                                          ai_recommendations_enabled: editingUser.ai_recommendations_enabled !== false,
                                          is_admin: editingUser.is_admin || false
                                        });
                                      }}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                      title="Save"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingUser(null)}
                                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                      title="Cancel"
                                    >
                                      <XIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      // Use user_id if available (from merged data), otherwise use id
                                      const userId = user.user_id || user.id;
                                      setEditingUser({
                                        id: userId, // Use the actual user ID, not profile ID
                                        hide_from_comparison: user.hide_from_comparison || false,
                                        ai_recommendations_enabled: user.ai_recommendations_enabled !== false,
                                        is_admin: user.is_admin || false
                                      });
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Rewards Tab */}
              {activeTab === 'rewards' && (
                <div className="space-y-4">
                  {/* Add New Reward Button */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Virtual Rewards</h3>
                    <button
                      onClick={() => setShowNewRewardForm(!showNewRewardForm)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {showNewRewardForm ? 'Cancel' : 'Add New Reward'}
                    </button>
                  </div>

                  {/* New Reward Form */}
                  {showNewRewardForm && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                      <h4 className="text-md font-semibold text-gray-900">Create New Reward</h4>
                      <p className="text-sm text-gray-600">
                        <strong>Reward Value:</strong> A numeric value representing the milestone (e.g., "10" for "Read 10 books", "5" for "Level 5"). 
                        Used to track progress toward earning the reward.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            User <span className="text-gray-400 text-xs">(Optional - leave empty for criteria-based rewards)</span>
                          </label>
                          <select
                            value={newReward.user_id}
                            onChange={(e) => setNewReward({ ...newReward, user_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">None (Criteria-based)</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id}>
                                @{user.username} {user.name ? `(${user.name})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Genre Criteria <span className="text-gray-400 text-xs">(Optional)</span></label>
                          <select
                            value={newReward.criteria_genre}
                            onChange={(e) => setNewReward({ ...newReward, criteria_genre: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Any Genre</option>
                            <option value="Fiction">Fiction</option>
                            <option value="Science Fiction">Science Fiction</option>
                            <option value="Fantasy">Fantasy</option>
                            <option value="Mystery">Mystery</option>
                            <option value="Thriller">Thriller</option>
                            <option value="Horror">Horror</option>
                            <option value="Romance">Romance</option>
                            <option value="Historical Fiction">Historical Fiction</option>
                            <option value="Literary Fiction">Literary Fiction</option>
                            <option value="Biography">Biography</option>
                            <option value="Autobiography">Autobiography</option>
                            <option value="History">History</option>
                            <option value="Science">Science</option>
                            <option value="Philosophy">Philosophy</option>
                            <option value="Self-Help">Self-Help</option>
                            <option value="Business">Business</option>
                            <option value="Health">Health</option>
                            <option value="Travel">Travel</option>
                            <option value="Cooking">Cooking</option>
                            <option value="Art">Art</option>
                            <option value="Music">Music</option>
                            <option value="Sports">Sports</option>
                            <option value="Education">Education</option>
                            <option value="Religion">Religion</option>
                            <option value="Psychology">Psychology</option>
                            <option value="Young Adult">Young Adult</option>
                            <option value="Children">Children</option>
                            <option value="Poetry">Poetry</option>
                            <option value="Drama">Drama</option>
                            <option value="Comedy">Comedy</option>
                            <option value="Adventure">Adventure</option>
                            <option value="Crime">Crime</option>
                            <option value="Dystopian">Dystopian</option>
                            <option value="Western">Western</option>
                            <option value="War">War</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reward Type *</label>
                          <select
                            value={newReward.reward_type}
                            onChange={(e) => setNewReward({ ...newReward, reward_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="badge">Badge</option>
                            <option value="title">Title</option>
                            <option value="achievement">Achievement</option>
                            <option value="milestone">Milestone</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reward Name *</label>
                          <input
                            type="text"
                            value={newReward.reward_name}
                            onChange={(e) => setNewReward({ ...newReward, reward_name: e.target.value })}
                            placeholder="e.g., First Reader Badge"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reward Value</label>
                          <input
                            type="text"
                            value={newReward.reward_value}
                            onChange={(e) => setNewReward({ ...newReward, reward_value: e.target.value })}
                            placeholder="e.g., 1, 10, 5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newReward.reward_emoji}
                              onChange={(e) => setNewReward({ ...newReward, reward_emoji: e.target.value })}
                              placeholder="e.g., 🏆, 📚, ⭐"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                              title="Pick emoji"
                            >
                              😀
                            </button>
                          </div>
                          {showEmojiPicker && (
                            <div className="mt-2 p-3 bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                              <div className="grid grid-cols-10 gap-2">
                                {rewardEmojis.map((emoji, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setNewReward({ ...newReward, reward_emoji: emoji });
                                      setShowEmojiPicker(false);
                                    }}
                                    className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                                    title={emoji}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={newReward.reward_description}
                            onChange={(e) => setNewReward({ ...newReward, reward_description: e.target.value })}
                            placeholder="e.g., Read your first book!"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowNewRewardForm(false);
        setNewReward({
          user_id: '',
          reward_type: 'badge',
          reward_name: '',
          reward_value: '',
          reward_emoji: '',
          reward_description: '',
          criteria_genre: ''
        });
                          }}
                          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateReward}
                          disabled={isLoading}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Creating...' : 'Create Reward'}
                        </button>
                      </div>
                    </div>
                  )}

                  {filteredRewards.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No rewards found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Genre</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Emoji</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unlocked</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRewards.map((reward) => {
                            const user = users.find(u => u.id === reward.user_id);
                            return (
                              <tr key={reward.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-600">
                                  {user ? `@${user.username}` : 'Unknown'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                    {reward.reward_type || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {editingReward?.id === reward.id ? (
                                    <input
                                      type="text"
                                      value={editingReward.reward_name || ''}
                                      onChange={(e) => setEditingReward({ ...editingReward, reward_name: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  ) : (
                                    <span className="font-medium text-gray-900">{reward.reward_name || 'N/A'}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-600">{reward.reward_value || 'N/A'}</td>
                                <td className="px-4 py-3">
                                  {editingReward?.id === reward.id ? (
                                    <select
                                      value={editingReward.criteria_genre || ''}
                                      onChange={(e) => setEditingReward({ ...editingReward, criteria_genre: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="">Any Genre</option>
                                      <option value="Fiction">Fiction</option>
                                      <option value="Science Fiction">Science Fiction</option>
                                      <option value="Fantasy">Fantasy</option>
                                      <option value="Mystery">Mystery</option>
                                      <option value="Thriller">Thriller</option>
                                      <option value="Horror">Horror</option>
                                      <option value="Romance">Romance</option>
                                      <option value="Historical Fiction">Historical Fiction</option>
                                      <option value="Literary Fiction">Literary Fiction</option>
                                      <option value="Biography">Biography</option>
                                      <option value="Autobiography">Autobiography</option>
                                      <option value="History">History</option>
                                      <option value="Science">Science</option>
                                      <option value="Philosophy">Philosophy</option>
                                      <option value="Self-Help">Self-Help</option>
                                      <option value="Business">Business</option>
                                      <option value="Health">Health</option>
                                      <option value="Travel">Travel</option>
                                      <option value="Cooking">Cooking</option>
                                      <option value="Art">Art</option>
                                      <option value="Music">Music</option>
                                      <option value="Sports">Sports</option>
                                      <option value="Education">Education</option>
                                      <option value="Religion">Religion</option>
                                      <option value="Psychology">Psychology</option>
                                      <option value="Young Adult">Young Adult</option>
                                      <option value="Children">Children</option>
                                      <option value="Poetry">Poetry</option>
                                      <option value="Drama">Drama</option>
                                      <option value="Comedy">Comedy</option>
                                      <option value="Adventure">Adventure</option>
                                      <option value="Crime">Crime</option>
                                      <option value="Dystopian">Dystopian</option>
                                      <option value="Western">Western</option>
                                      <option value="War">War</option>
                                    </select>
                                  ) : (
                                    <span className="text-sm text-gray-600">
                                      {extractGenreFromDescription(reward.reward_description) || 'Any'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {editingReward?.id === reward.id ? (
                                    <input
                                      type="text"
                                      value={editingReward.reward_emoji || ''}
                                      onChange={(e) => setEditingReward({ ...editingReward, reward_emoji: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  ) : (
                                    <span className="text-2xl">{reward.reward_emoji || '🎁'}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {editingReward?.id === reward.id ? (
                                    <input
                                      type="text"
                                      value={editingReward.reward_description || ''}
                                      onChange={(e) => setEditingReward({ ...editingReward, reward_description: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  ) : (
                                    <span className="text-sm text-gray-600">{reward.reward_description || 'N/A'}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {reward.unlocked_at ? new Date(reward.unlocked_at).toLocaleDateString() : 'Not unlocked'}
                                </td>
                                <td className="px-4 py-3">
                                  {editingReward?.id === reward.id ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          // Reconstruct description with genre if provided
                                          let finalDescription = editingReward.reward_description || '';
                                          if (editingReward.criteria_genre) {
                                            finalDescription = finalDescription + (finalDescription ? ' | ' : '') + `[Criteria: Genre = ${editingReward.criteria_genre}]`;
                                          }
                                          
                                          handleUpdateReward(reward.id, {
                                            reward_name: editingReward.reward_name,
                                            reward_emoji: editingReward.reward_emoji,
                                            reward_description: finalDescription
                                          });
                                        }}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                        title="Save"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setEditingReward(null)}
                                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                        title="Cancel"
                                      >
                                        <XIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          const genre = extractGenreFromDescription(reward.reward_description);
                                          const descriptionWithoutGenre = removeGenreFromDescription(reward.reward_description);
                                          setEditingReward({
                                            id: reward.id,
                                            reward_name: reward.reward_name,
                                            reward_emoji: reward.reward_emoji,
                                            reward_description: descriptionWithoutGenre,
                                            criteria_genre: genre || ''
                                          });
                                        }}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteReward(reward.id)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

