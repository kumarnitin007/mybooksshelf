import React, { useState, useEffect } from 'react';
import { X, Trophy, Star, Gift, Award, Sparkles, Lock, Unlock } from 'lucide-react';
import { getUserRewards } from '../../services/gamificationService';

/**
 * RewardsModal Component
 * Modal for displaying virtual rewards earned by the user
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} currentUser - Current logged in user
 * @param {array} userRewards - Array of user rewards
 * @param {object} userXP - User XP data (level, total XP, etc.)
 * @param {array} challenges - Array of challenges (to show completed ones that awarded XP)
 * @param {array} recentAchievements - Array of recent achievements
 * @param {function} onClose - Callback to close the modal
 */
export default function RewardsModal({
  show,
  currentUser,
  userRewards = [],
  userXP = null,
  challenges = [],
  recentAchievements = [],
  onClose
}) {
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unlocked, locked

  useEffect(() => {
    if (show && currentUser) {
      loadRewards();
    }
  }, [show, currentUser]);

  const loadRewards = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const { data, error } = await getUserRewards(currentUser.id);
      if (error) {
        console.error('Error loading rewards:', error);
      } else {
        setRewards(data || []);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Define available reward types and their display info
  const rewardTypes = {
    badge: { icon: Award, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    title: { icon: Star, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    achievement: { icon: Trophy, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
    milestone: { icon: Gift, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
    default: { icon: Sparkles, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
  };

  const getRewardTypeInfo = (rewardType) => {
    return rewardTypes[rewardType] || rewardTypes.default;
  };

  const filteredRewards = rewards.filter(reward => {
    if (filter === 'unlocked') return reward.unlocked_at;
    if (filter === 'locked') return !reward.unlocked_at;
    return true;
  });

  // Group rewards by type
  const rewardsByType = filteredRewards.reduce((acc, reward) => {
    const type = reward.reward_type || 'default';
    if (!acc[type]) acc[type] = [];
    acc[type].push(reward);
    return acc;
  }, {});

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-900">Virtual Rewards</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-grow">
          {/* XP Summary Section */}
          {userXP && (
            <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-500 rounded-full p-3">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Your Experience Points</h3>
                    <div className="flex items-baseline gap-3">
                      <div>
                        <span className="text-2xl font-bold text-yellow-600">Level {userXP.current_level || 1}</span>
                      </div>
                      <div className="text-gray-600">
                        <span className="text-lg font-semibold text-orange-600">{userXP.total_xp || 0}</span>
                        <span className="text-sm ml-1">XP</span>
                      </div>
                    </div>
                    {userXP.xp_to_next_level > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">
                          {userXP.xp_to_next_level} XP needed for Level {userXP.current_level + 1}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(100, ((userXP.total_xp || 0) % (100 + (userXP.current_level - 1) * 50)) / (userXP.xp_to_next_level || 100) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* XP History Section */}
          {(() => {
            if (!challenges || challenges.length === 0) return null;
            
            const completedChallenges = challenges.filter(c => {
              // Check if challenge is completed - either is_completed flag or progress >= target
              const isCompleted = c.is_completed || (c.current_count >= c.target_count);
              const hasRewardXP = c.reward_xp && c.reward_xp > 0;
              return isCompleted && hasRewardXP;
            });
            
            if (completedChallenges.length > 0) {
              return (
                <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    XP History
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {completedChallenges.map(challenge => (
                      <div key={challenge.id} className="flex items-center justify-between text-sm bg-white rounded p-2 border border-indigo-100">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-600" />
                          <span className="text-gray-700">Completed: <strong>{challenge.challenge_name}</strong></span>
                        </div>
                        <span className="text-yellow-600 font-bold">+{challenge.reward_xp} XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'all'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({rewards.length})
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'unlocked'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unlocked ({rewards.filter(r => r.unlocked_at).length})
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'locked'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Locked ({rewards.filter(r => !r.unlocked_at).length})
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mb-4"></div>
              <p className="text-gray-600">Loading rewards...</p>
            </div>
          ) : filteredRewards.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">No Virtual Rewards Yet</p>
              <p className="text-sm text-gray-500 mb-3">
                {filter === 'unlocked'
                  ? "You haven't unlocked any virtual rewards (badges, titles, achievements) yet. Keep reading to earn rewards!"
                  : filter === 'locked'
                  ? "No locked rewards available."
                  : "Virtual rewards (badges, titles, achievements) will appear here when you unlock them. Your XP from completed challenges is shown in the XP History section above."}
              </p>
              <p className="text-xs text-gray-400 italic">
                Note: XP History shows your completed challenges. Virtual rewards are separate badges/titles you can unlock.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(rewardsByType).map(([type, typeRewards]) => {
                const typeInfo = getRewardTypeInfo(type);
                const Icon = typeInfo.icon;

                return (
                  <div key={type} className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-5 h-5 ${typeInfo.color}`} />
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">{type} Rewards</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {typeRewards.map((reward) => {
                        const isUnlocked = !!reward.unlocked_at;
                        return (
                          <div
                            key={reward.id}
                            className={`rounded-lg border-2 p-4 transition-all ${
                              isUnlocked
                                ? `${typeInfo.bgColor} ${typeInfo.borderColor} border-2`
                                : 'bg-gray-100 border-gray-300 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isUnlocked ? (
                                  <Unlock className={`w-5 h-5 ${typeInfo.color}`} />
                                ) : (
                                  <Lock className="w-5 h-5 text-gray-400" />
                                )}
                                <h4 className={`font-bold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {reward.reward_name || 'Unnamed Reward'}
                                </h4>
                              </div>
                            </div>
                            {reward.reward_value && (
                              <div className="text-sm text-gray-600 mb-2">
                                Value: {reward.reward_value}
                              </div>
                            )}
                            {isUnlocked && reward.unlocked_at && (
                              <div className="text-xs text-gray-500 mt-2">
                                Unlocked: {new Date(reward.unlocked_at).toLocaleDateString()}
                              </div>
                            )}
                            {!isUnlocked && (
                              <div className="text-xs text-gray-500 mt-2 italic">
                                Locked - Complete challenges to unlock
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">About XP (Experience Points)</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Your current Level and Total XP are shown at the top of this modal. XP is automatically added when you complete challenges!
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>When you complete a challenge:</strong> You'll receive the XP reward defined for that challenge. Your total XP and level are also displayed in the header stats at the top of the page.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">How to Earn Rewards</h4>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>Complete reading challenges (earn XP - shown in header stats)</li>
                    <li>Reach reading milestones (10, 25, 50, 100 books)</li>
                    <li>Maintain reading streaks</li>
                    <li>Unlock achievements</li>
                    <li>Level up your reading profile</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


