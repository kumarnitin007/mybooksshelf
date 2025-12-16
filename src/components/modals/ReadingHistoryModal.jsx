import React, { useState, useMemo } from 'react';
import { X, BarChart3, TrendingUp, Calendar, BookOpen, Sparkles, Trophy, Target } from 'lucide-react';

/**
 * ReadingHistoryModal Component
 * Displays reading history with charts and statistics to motivate users
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {array} bookshelves - Array of bookshelves with books
 * @param {function} onClose - Callback to close the modal
 */
export default function ReadingHistoryModal({
  show,
  bookshelves = [],
  onClose
}) {
  const [timePeriod, setTimePeriod] = useState('monthly'); // daily, weekly, monthly
  const [showLineConnection, setShowLineConnection] = useState(true);

  // Get all books with finish dates
  const allBooks = useMemo(() => {
    return bookshelves.flatMap(shelf => shelf.books || [])
      .filter(book => book.finishDate)
      .map(book => ({
        ...book,
        finishDate: new Date(book.finishDate)
      }))
      .sort((a, b) => b.finishDate - a.finishDate);
  }, [bookshelves]);

  // Calculate statistics based on time period
  const statistics = useMemo(() => {
    if (allBooks.length === 0) {
      return {
        data: [],
        total: 0,
        average: 0,
        max: 0,
        currentPeriod: 0,
        trend: 'neutral'
      };
    }

    const now = new Date();
    let data = [];
    let periodLabel = '';

    if (timePeriod === 'daily') {
      // Last 30 days
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const count = allBooks.filter(book => {
          const bookDate = new Date(book.finishDate);
          return bookDate >= dayStart && bookDate <= dayEnd;
        }).length;

        days.push({
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          date: date.toISOString().split('T')[0],
          count
        });
      }
      data = days;
      periodLabel = 'Last 30 Days';
    } else if (timePeriod === 'weekly') {
      // Last 12 weeks
      const weeks = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const count = allBooks.filter(book => {
          const bookDate = new Date(book.finishDate);
          return bookDate >= weekStart && bookDate <= weekEnd;
        }).length;

        weeks.push({
          label: `W${12 - i}`,
          date: weekStart.toISOString().split('T')[0],
          count
        });
      }
      data = weeks;
      periodLabel = 'Last 12 Weeks';
    } else {
      // Last 12 months
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

        const count = allBooks.filter(book => {
          const bookDate = new Date(book.finishDate);
          return bookDate >= monthStart && bookDate <= monthEnd;
        }).length;

        months.push({
          label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          date: monthStart.toISOString().split('T')[0],
          count
        });
      }
      data = months;
      periodLabel = 'Last 12 Months';
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);
    const average = data.length > 0 ? (total / data.length).toFixed(1) : 0;
    const max = Math.max(...data.map(item => item.count), 1);
    const currentPeriod = data[data.length - 1]?.count || 0;
    const previousPeriod = data[data.length - 2]?.count || 0;
    
    let trend = 'neutral';
    if (currentPeriod > previousPeriod) trend = 'up';
    else if (currentPeriod < previousPeriod) trend = 'down';

    return {
      data,
      total,
      average: parseFloat(average),
      max,
      currentPeriod,
      trend,
      periodLabel
    };
  }, [allBooks, timePeriod]);

  // Calculate additional stats
  const additionalStats = useMemo(() => {
    if (allBooks.length === 0) {
      return {
        totalBooks: 0,
        longestStreak: 0,
        favoriteGenre: 'N/A',
        favoriteAuthor: 'N/A'
      };
    }

    // Calculate longest reading streak (consecutive days with at least one book)
    const sortedDates = [...allBooks]
      .map(b => new Date(b.finishDate).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort()
      .map(d => new Date(d));

    let longestStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const daysDiff = Math.floor((sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    // Favorite genre
    const genreCounts = {};
    allBooks.forEach(book => {
      if (book.genre) {
        genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
      }
    });
    const favoriteGenre = Object.keys(genreCounts).length > 0
      ? Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';

    // Favorite author
    const authorCounts = {};
    allBooks.forEach(book => {
      if (book.author) {
        authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
      }
    });
    const favoriteAuthor = Object.keys(authorCounts).length > 0
      ? Object.entries(authorCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';

    return {
      totalBooks: allBooks.length,
      longestStreak,
      favoriteGenre,
      favoriteAuthor
    };
  }, [allBooks]);

  // Render bar chart
  const renderBarChart = () => {
    const { data, max } = statistics;
    const chartHeight = 200;
    const barWidth = Math.max(20, (100 / data.length) - 2);

    return (
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {data.map((item, index) => {
            const barHeight = max > 0 ? (item.count / max) * (chartHeight - 40) : 0;
            const x = (index * (100 / data.length)) + '%';
            const y = chartHeight - 20 - barHeight;
            const isMax = item.count === max && item.count > 0;
            
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={`${barWidth}%`}
                  height={barHeight}
                  fill={isMax ? 'url(#gradientMax)' : 'url(#gradientBar)'}
                  rx="4"
                  className="transition-all hover:opacity-80"
                />
                {item.count > 0 && (
                  <text
                    x={`${parseFloat(x) + barWidth / 2}%`}
                    y={y - 5}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-gray-700"
                  >
                    {item.count}
                  </text>
                )}
              </g>
            );
          })}
          <defs>
            <linearGradient id="gradientBar" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="gradientMax" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          {data.map((item, index) => (
            <span key={index} className="truncate" style={{ width: `${100 / data.length}%` }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Render line chart
  const renderLineChart = () => {
    const { data, max } = statistics;
    const chartHeight = 200;
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * 100;
      const y = max > 0 ? 100 - (item.count / max) * 80 : 100;
      return { x, y, count: item.count };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg width="100%" height={chartHeight} viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area under line - only show if line connection is enabled */}
          {showLineConnection && (
            <path
              d={`${pathData} L ${points[points.length - 1].x} 100 L 0 100 Z`}
              fill="url(#lineGradient)"
            />
          )}
          {/* Line - only show if checkbox is checked */}
          {showLineConnection && (
            <path
              d={pathData}
              fill="none"
              stroke="#6366f1"
              strokeWidth="0.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={`${point.x}%`}
                cy={`${point.y}%`}
                r="4"
                fill="#6366f1"
                className="hover:r-6 transition-all"
              />
              {point.count > 0 && (
                <text
                  x={`${point.x}%`}
                  y={`${point.y - 10}%`}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-gray-700"
                >
                  {point.count}
                </text>
              )}
            </g>
          ))}
        </svg>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          {data.map((item, index) => (
            <span key={index} className="truncate" style={{ width: `${100 / data.length}%` }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Reading History & Analytics</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-grow">
          {/* Time Period Selector */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
            <button
              onClick={() => setTimePeriod('daily')}
              className={`px-4 py-2 font-medium transition-colors rounded-lg ${
                timePeriod === 'daily'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimePeriod('weekly')}
              className={`px-4 py-2 font-medium transition-colors rounded-lg ${
                timePeriod === 'weekly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimePeriod('monthly')}
              className={`px-4 py-2 font-medium transition-colors rounded-lg ${
                timePeriod === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
          </div>

          {allBooks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">No Reading History Yet</p>
              <p className="text-sm text-gray-500">Start reading and finishing books to see your reading history and analytics!</p>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Total Books</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{statistics.total}</p>
                  <p className="text-xs text-gray-500 mt-1">{statistics.periodLabel}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Average</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{statistics.average}</p>
                  <p className="text-xs text-gray-500 mt-1">per {timePeriod === 'daily' ? 'day' : timePeriod === 'weekly' ? 'week' : 'month'}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-600">Best Period</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.max}</p>
                  <p className="text-xs text-gray-500 mt-1">books in one period</p>
                </div>
                <div className={`bg-gradient-to-br rounded-lg p-4 border ${
                  statistics.trend === 'up' 
                    ? 'from-green-50 to-emerald-50 border-green-200'
                    : statistics.trend === 'down'
                    ? 'from-red-50 to-pink-50 border-red-200'
                    : 'from-gray-50 to-slate-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className={`w-5 h-5 ${
                      statistics.trend === 'up' ? 'text-green-600' : statistics.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`} />
                    <span className="text-sm font-medium text-gray-600">Trend</span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    statistics.trend === 'up' ? 'text-green-600' : statistics.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {statistics.trend === 'up' ? '📈 Up' : statistics.trend === 'down' ? '📉 Down' : '➡️ Steady'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">vs previous period</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Bar Chart */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Books Read - Bar Chart</h3>
                  </div>
                  {renderBarChart()}
                </div>

                {/* Line Chart */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Reading Trend - Line Graph</h3>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showLineConnection}
                        onChange={(e) => setShowLineConnection(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span>Connect dots</span>
                    </label>
                  </div>
                  {renderLineChart()}
                </div>
              </div>

              {/* Additional Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Longest Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{additionalStats.longestStreak}</p>
                  <p className="text-xs text-gray-500 mt-1">consecutive days</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-600">Favorite Genre</span>
                  </div>
                  <p className="text-lg font-bold text-indigo-600 truncate">{additionalStats.favoriteGenre}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    <span className="text-sm font-medium text-gray-600">Most Read Author</span>
                  </div>
                  <p className="text-lg font-bold text-teal-600 truncate">{additionalStats.favoriteAuthor}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-gray-600">Total Finished</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">{additionalStats.totalBooks}</p>
                  <p className="text-xs text-gray-500 mt-1">books completed</p>
                </div>
              </div>

              {/* Motivational Message */}
              {statistics.trend === 'up' && (
                <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-green-600" />
                    <p className="text-green-800 font-semibold">
                      🎉 Amazing progress! You're reading more than before! Keep up the great work!
                    </p>
                  </div>
                </div>
              )}
              {statistics.currentPeriod === 0 && statistics.total > 0 && (
                <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-300">
                  <div className="flex items-center gap-2">
                    <Target className="w-6 h-6 text-yellow-600" />
                    <p className="text-yellow-800 font-semibold">
                      💪 You haven't finished any books this {timePeriod === 'daily' ? 'today' : timePeriod === 'weekly' ? 'week' : 'month'} yet. Time to pick up a book!
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

