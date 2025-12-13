import React, { useState, useEffect } from 'react';
import { X, Target, Plus, Calendar, Users, Share2, Trash2, Check, UserCheck, UserPlus, Trophy, BookOpen, Filter } from 'lucide-react';
import { getChallenges, createChallenge, shareChallenge, deleteChallenge, getChallengeUserProgress } from '../../services/gamificationService';
import { getAllUsers } from '../../services/userService';
import { getUserProfile } from '../../services/userService';

/**
 * ChallengeModal Component
 * Modal for creating, viewing, and sharing reading challenges
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} currentUser - Current logged in user
 * @param {function} onClose - Callback to close the modal
 * @param {function} onChallengeCreated - Callback when challenge is created
 */
export default function ChallengeModal({
  show,
  currentUser,
  onClose,
  onChallengeCreated
}) {
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [users, setUsers] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [sharedUserProfiles, setSharedUserProfiles] = useState({}); // Profiles for users shared with challenges
  const [challengeUserProgress, setChallengeUserProgress] = useState({}); // Progress per user per challenge
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [challengeName, setChallengeName] = useState('');
  const [targetCount, setTargetCount] = useState(10);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [rewardXP, setRewardXP] = useState(100);
  const [description, setDescription] = useState('');
  // Condition fields (all optional)
  const [conditionGenre, setConditionGenre] = useState('');
  const [conditionMinRating, setConditionMinRating] = useState('');
  const [conditionAuthor, setConditionAuthor] = useState('');
  const [conditionFormat, setConditionFormat] = useState('');
  const [conditionYearMin, setConditionYearMin] = useState('');
  const [conditionYearMax, setConditionYearMax] = useState('');

  useEffect(() => {
    if (show && currentUser) {
      loadChallenges();
    }
  }, [show, currentUser]);

  // Listen for challenge updates from other parts of the app
  useEffect(() => {
    const handleChallengesUpdated = () => {
      if (show && currentUser) {
        loadChallenges();
      }
    };
    
    window.addEventListener('challengesUpdated', handleChallengesUpdated);
    return () => {
      window.removeEventListener('challengesUpdated', handleChallengesUpdated);
    };
  }, [show, currentUser]);

  const loadChallenges = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const { data, error } = await getChallenges(currentUser.id);
      if (error) {
        console.error('Error loading challenges:', error);
      } else {
        setChallenges(data || []);
        
        // Load profiles for all shared users across all challenges
        const sharedUserIds = new Set();
        (data || []).forEach(challenge => {
          if (challenge.shared_with && Array.isArray(challenge.shared_with)) {
            challenge.shared_with.forEach(userId => {
              if (userId && userId !== currentUser.id) {
                sharedUserIds.add(userId);
              }
            });
          }
        });
        
        // Load profiles for shared users and creator
        const profiles = {};
        const progressData = {};
        
        // Load profiles and progress for all challenges
        for (const challenge of (data || [])) {
          // Include creator in profiles
          if (challenge.user_id && !sharedUserIds.has(challenge.user_id)) {
            sharedUserIds.add(challenge.user_id);
          }
          
          // Get progress for this challenge
          const { data: progress } = await getChallengeUserProgress(challenge.id);
          if (progress) {
            progressData[challenge.id] = progress;
          }
        }
        
        // Load all user profiles
        for (const userId of sharedUserIds) {
          try {
            const { data: profile } = await getUserProfile(userId);
            if (profile) {
              profiles[userId] = profile;
            }
          } catch (err) {
            console.error(`Error loading profile for user ${userId}:`, err);
          }
        }
        setSharedUserProfiles(profiles);
        setChallengeUserProgress(progressData);
        setChallengeUserProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: allUsers, error } = await getAllUsers();
      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      const otherUsers = (allUsers || []).filter(u => u.id !== currentUser?.id);
      setUsers(otherUsers);

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

  const handleCreateChallenge = async () => {
    if (!currentUser || !challengeName || !targetCount || !endDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Process condition fields
      const conditionGenreArray = conditionGenre.trim() 
        ? conditionGenre.split(',').map(g => g.trim()).filter(g => g)
        : null;
      const conditionAuthorArray = conditionAuthor.trim()
        ? conditionAuthor.split(',').map(a => a.trim()).filter(a => a)
        : null;
      const conditionFormatArray = conditionFormat.trim()
        ? conditionFormat.split(',').map(f => f.trim()).filter(f => f)
        : null;

      const challengeData = {
        challenge_name: challengeName,
        challenge_type: 'reading', // Required field - default challenge type
        target_count: parseInt(targetCount),
        current_count: 0,
        start_date: startDate,
        end_date: endDate,
        reward_xp: parseInt(rewardXP) || 0,
        description: description || null,
        is_completed: false,
        shared_with: selectedUserIds,
        // Optional condition fields
        condition_genre: conditionGenreArray,
        condition_min_rating: conditionMinRating ? parseFloat(conditionMinRating) : null,
        condition_author: conditionAuthorArray,
        condition_format: conditionFormatArray,
        condition_year_min: conditionYearMin ? parseInt(conditionYearMin) : null,
        condition_year_max: conditionYearMax ? parseInt(conditionYearMax) : null
      };

      const { data, error } = await createChallenge(currentUser.id, challengeData);
      if (error) {
        alert(`Error creating challenge: ${error.message || JSON.stringify(error)}`);
      } else {
        // Reset form
        setChallengeName('');
        setTargetCount(10);
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setRewardXP(100);
        setDescription('');
        setSelectedUserIds([]);
        setShowCreateForm(false);
        
        // Reload challenges
        await loadChallenges();
        
        if (onChallengeCreated) {
          onChallengeCreated(data);
        }
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Error creating challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareChallenge = async () => {
    if (!selectedChallenge) return;

    setIsLoading(true);
    try {
      const { error } = await shareChallenge(selectedChallenge.id, selectedUserIds);
      if (error) {
        alert(`Error sharing challenge: ${error.message || JSON.stringify(error)}`);
      } else {
        setShowShareModal(false);
        setSelectedChallenge(null);
        setSelectedUserIds([]);
        await loadChallenges();
      }
    } catch (error) {
      console.error('Error sharing challenge:', error);
      alert('Error sharing challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;

    setIsLoading(true);
    try {
      const { error } = await deleteChallenge(challengeId);
      if (error) {
        alert(`Error deleting challenge: ${error.message || JSON.stringify(error)}`);
      } else {
        await loadChallenges();
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      alert('Error deleting challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const openShareModal = (challenge) => {
    setSelectedChallenge(challenge);
    setSelectedUserIds(challenge.shared_with || []);
    setSearchQuery('');
    loadUsers();
    setShowShareModal(true);
  };

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(user => {
    const profile = userProfiles[user.id];
    const name = profile?.name || user.username || '';
    const email = user.email || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  const getProgressPercentage = (challenge) => {
    if (!challenge.target_count) return 0;
    return Math.min(100, (challenge.current_count || 0) / challenge.target_count * 100);
  };

  const isChallengeActive = (challenge) => {
    const now = new Date();
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    return now >= start && now <= end && !challenge.is_completed;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Reading Challenges</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                if (showCreateForm) {
                  setChallengeName('');
                  setTargetCount(10);
                  setStartDate(new Date().toISOString().split('T')[0]);
                  setEndDate('');
                  setRewardXP(100);
                  setDescription('');
                  setSelectedUserIds([]);
                  // Reset condition fields
                  setConditionGenre('');
                  setConditionMinRating('');
                  setConditionAuthor('');
                  setConditionFormat('');
                  setConditionYearMin('');
                  setConditionYearMax('');
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {showCreateForm ? 'Cancel' : 'New Challenge'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-grow">
          {/* Create Challenge Form */}
          {showCreateForm && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-6 border border-indigo-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Challenge</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Challenge Name *</label>
                  <input
                    type="text"
                    value={challengeName}
                    onChange={(e) => setChallengeName(e.target.value)}
                    placeholder="e.g., Read 10 Books This Month"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Target Books *</label>
                    <input
                      type="number"
                      value={targetCount}
                      onChange={(e) => setTargetCount(e.target.value)}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Reward XP</label>
                    <input
                      type="number"
                      value={rewardXP}
                      onChange={(e) => setRewardXP(e.target.value)}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Optional Conditions Section */}
                <div className="border-t border-indigo-200 pt-4 mt-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Optional Book Conditions
                    <span className="text-xs font-normal text-gray-500">(Leave blank to allow all books)</span>
                  </h4>
                  <div className="space-y-3 bg-white rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Genre (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={conditionGenre}
                          onChange={(e) => setConditionGenre(e.target.value)}
                          placeholder="e.g., Fantasy, Sci-Fi"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Minimum Rating (stars)
                        </label>
                        <input
                          type="number"
                          value={conditionMinRating}
                          onChange={(e) => setConditionMinRating(e.target.value)}
                          placeholder="e.g., 4.0"
                          min="0"
                          max="5"
                          step="0.5"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Author (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={conditionAuthor}
                          onChange={(e) => setConditionAuthor(e.target.value)}
                          placeholder="e.g., J.K. Rowling, Stephen King"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Format (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={conditionFormat}
                          onChange={(e) => setConditionFormat(e.target.value)}
                          placeholder="e.g., Paperback, Hardcover, Ebook"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Publication Year (Min)
                        </label>
                        <input
                          type="number"
                          value={conditionYearMin}
                          onChange={(e) => setConditionYearMin(e.target.value)}
                          placeholder="e.g., 2000"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Publication Year (Max)
                        </label>
                        <input
                          type="number"
                          value={conditionYearMax}
                          onChange={(e) => setConditionYearMax(e.target.value)}
                          placeholder="e.g., 2024"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreateChallenge}
                    disabled={isLoading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Create Challenge'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Challenges List */}
          {isLoading && !showCreateForm ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">Loading challenges...</p>
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">No Challenges Yet</p>
              <p className="text-sm text-gray-500">Create your first reading challenge to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge) => {
                const progress = getProgressPercentage(challenge);
                const isActive = isChallengeActive(challenge);
                const isOwner = challenge.user_id === currentUser?.id;

                return (
                  <div
                    key={challenge.id}
                    className={`bg-white rounded-lg border-2 p-4 ${
                      challenge.is_completed
                        ? 'border-green-300 bg-green-50'
                        : isActive
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900">{challenge.challenge_name}</h3>
                          {challenge.is_completed && (
                            <Trophy className="w-5 h-5 text-yellow-600" />
                          )}
                          {isActive && (
                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">Active</span>
                          )}
                          {/* All participants avatars (including creator) */}
                          {(() => {
                            // Get all participants (creator + shared users)
                            const allParticipants = [
                              challenge.user_id,
                              ...(challenge.shared_with || [])
                            ].filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
                            
                            return allParticipants.length > 0 && (
                              <div className="flex items-center gap-1 ml-1">
                                {allParticipants.slice(0, 5).map((userId) => {
                                  const profile = sharedUserProfiles[userId];
                                  const isCreator = userId === challenge.user_id;
                                  return (
                                    <div
                                      key={userId}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-white shadow-sm ${
                                        isCreator ? 'bg-indigo-200 ring-2 ring-indigo-400' : 'bg-gray-200'
                                      }`}
                                      title={isCreator ? `${profile?.name || 'Creator'}` : profile?.name || 'Participant'}
                                    >
                                      {profile?.avatar || '👤'}
                                    </div>
                                  );
                                })}
                                {allParticipants.length > 5 && (
                                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs border-2 border-white shadow-sm text-gray-600">
                                    +{allParticipants.length - 5}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        {challenge.description && (
                          <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
                            </span>
                          </div>
                          {challenge.reward_xp > 0 && (
                            <div className="flex items-center gap-1">
                              <Trophy className="w-4 h-4" />
                              <span>{challenge.reward_xp} XP</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openShareModal(challenge)}
                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Share challenge"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete challenge"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Progress Bars - One for each participant */}
                    <div className="mb-2 space-y-2">
                      {(() => {
                        // Get all participants (creator + shared users)
                        const allParticipants = [
                          challenge.user_id,
                          ...(challenge.shared_with || [])
                        ].filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
                        
                        const userProgress = challengeUserProgress[challenge.id] || {};
                        
                        return allParticipants.map((userId) => {
                          const profile = sharedUserProfiles[userId];
                          const userName = profile?.name || 'Unknown User';
                          const userProgressCount = userProgress[userId] || 0;
                          const userProgressPercent = Math.min(100, (userProgressCount / challenge.target_count) * 100);
                          const isCreator = userId === challenge.user_id;
                          const isCurrentUser = userId === currentUser?.id;
                          const isCompleted = userProgressCount >= challenge.target_count;
                          
                          return (
                            <div key={userId} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{profile?.avatar || '👤'}</span>
                                  <span className={`font-medium ${isCurrentUser ? 'text-indigo-600' : 'text-gray-700'}`}>
                                    {isCurrentUser ? 'You' : userName}
                                    {isCreator && <span className="ml-1 text-indigo-500">(Creator)</span>}
                                  </span>
                                </div>
                                {isCompleted ? (
                                  <span className="text-green-600 font-semibold flex items-center gap-1">
                                    <Trophy className="w-3 h-3" />
                                    Completed
                                    {challenge.reward_xp > 0 && (
                                      <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white rounded-full text-xs font-bold">
                                        +{challenge.reward_xp} XP
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">
                                    {userProgressCount} / {challenge.target_count}
                                  </span>
                                )}
                              </div>
                              {!isCompleted && (
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isCurrentUser
                                        ? 'bg-indigo-600'
                                        : 'bg-blue-400'
                                    }`}
                                    style={{ width: `${userProgressPercent}%` }}
                                  />
                                </div>
                              )}
                              {isCompleted && (
                                <div className="w-full bg-green-100 rounded-lg p-2 border border-green-300">
                                  <div className="flex items-center gap-2 text-green-700 text-xs font-medium">
                                    <Check className="w-4 h-4" />
                                    <span>Challenge completed! 🎉</span>
                                    {challenge.reward_xp > 0 && (
                                      <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white rounded-full font-bold">
                                        +{challenge.reward_xp} XP
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && selectedChallenge && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-900">Share Challenge</h3>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Select users to share "{selectedChallenge.challenge_name}" with:
              </p>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              />

              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto mb-4">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No users found</div>
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
                          <div className="text-2xl">{profile?.avatar || '👤'}</div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-gray-900">
                              {profile?.name || user.username || 'Unknown User'}
                            </div>
                            {user.email && (
                              <div className="text-sm text-gray-500">{user.email}</div>
                            )}
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

              <div className="flex gap-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareChallenge}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


