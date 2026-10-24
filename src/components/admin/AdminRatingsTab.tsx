import React, { useState, useEffect } from 'react';
import {
  Star,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  User,
  Phone,
  Mail,
  Calendar,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import {
  apiAdminGetRatings,
  apiAdminDeleteFeedback,
  RatingFeedbackItem,
  RatingsSummary,
} from '../../services/apiClient';
import { playTapSound, playSuccessChime } from '../../utils/soundEffects';

interface AdminRatingsTabProps {
  isLightMode?: boolean;
  showToast?: (msg: string) => void;
  adminProfile?: any;
}

export const AdminRatingsTab: React.FC<AdminRatingsTabProps> = ({
  isLightMode = true,
  showToast,
  adminProfile,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [summary, setSummary] = useState<RatingsSummary>({
    totalReviews: 0,
    averageRating: 5.0,
    distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
  });
  const [reviews, setReviews] = useState<RatingFeedbackItem[]>([]);

  const fetchRatings = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await apiAdminGetRatings();
      if (res && res.data) {
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        const reviewList = res.data.feedbacks || res.data.reviews || [];
        setReviews(reviewList);
      }
    } catch (err) {
      console.error('Error fetching admin ratings:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const handleRefresh = () => {
    playTapSound();
    fetchRatings(true);
  };

  const handleDelete = async (id: string) => {
    playTapSound();
    if (!window.confirm('Are you sure you want to delete this customer feedback review?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await apiAdminDeleteFeedback(id);
      if (res && (res.success || res.status === 'success')) {
        playSuccessChime();
        if (showToast) showToast('Customer review removed successfully.');
        setReviews((prev) => prev.filter((r) => r.id !== id));
        // Update total count
        setSummary((prev) => ({
          ...prev,
          totalReviews: Math.max(0, prev.totalReviews - 1),
        }));
      } else {
        alert(res?.message || 'Failed to delete review.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while removing review.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    const starMatches = selectedStarFilter === 'all' || Math.round(r.rating) === selectedStarFilter;
    if (!starMatches) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const comment = (r.comment || r.suggestion || '').toLowerCase();
    const name = (r.userName || '').toLowerCase();
    const phone = (r.phone || '').toLowerCase();
    const email = (r.userEmail || '').toLowerCase();

    return comment.includes(q) || name.includes(q) || phone.includes(q) || email.includes(q);
  });

  const totalReviews = summary.totalReviews || reviews.length;
  const positiveCount = (summary.distribution['5'] || 0) + (summary.distribution['4'] || 0);
  const positivePercent = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c1322] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Star size={22} className="fill-amber-400 stroke-amber-500" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                Customer Ratings & Feedback
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Live feedback, star scores, and user satisfaction metrics from production database
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Refresh Ratings"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh Live Data</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Overall Rating Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Rating
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-black text-slate-900 dark:text-white">
                {summary.averageRating.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400 pt-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={15}
                  className={
                    star <= Math.round(summary.averageRating)
                      ? 'fill-amber-400 stroke-amber-500'
                      : 'stroke-slate-300 dark:stroke-slate-600'
                  }
                />
              ))}
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Star size={28} className="fill-white stroke-white" />
          </div>
        </div>

        {/* Total Reviews */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Reviews Received
            </span>
            <div className="text-3xl font-heading font-black text-slate-900 dark:text-white">
              {totalReviews.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck size={13} />
              <span>100% Real Authenticated Users</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0052e0] to-[#0047cc] text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <MessageSquare size={26} />
          </div>
        </div>

        {/* Positive Sentiment */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Positive Sentiment
            </span>
            <div className="text-3xl font-heading font-black text-emerald-600 dark:text-emerald-400">
              {positivePercent}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {positiveCount} of {totalReviews} customers gave 4★ or 5★
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <ThumbsUp size={26} />
          </div>
        </div>
      </div>

      {/* 3. Distribution Breakdown */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white">
          Star Distribution Breakdown
        </h3>
        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.distribution[String(stars) as keyof typeof summary.distribution] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 w-14 shrink-0 font-bold text-slate-700 dark:text-slate-300">
                  <span>{stars}</span>
                  <Star size={13} className="fill-amber-400 stroke-amber-400" />
                </div>
                <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stars >= 4
                        ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                        : stars === 3
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-20 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{count}</span> ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Controls: Search & Star Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews by name, phone or comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setSelectedStarFilter('all');
            }}
            className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              selectedStarFilter === 'all'
                ? 'bg-[#0047cc] text-white shadow-xs'
                : 'bg-white dark:bg-[#0c1322] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            All Stars ({totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.distribution[String(stars) as keyof typeof summary.distribution] || 0;
            return (
              <button
                key={stars}
                type="button"
                onClick={() => {
                  playTapSound();
                  setSelectedStarFilter(stars);
                }}
                className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 active:scale-95 ${
                  selectedStarFilter === stars
                    ? 'bg-[#0047cc] text-white shadow-xs'
                    : 'bg-white dark:bg-[#0c1322] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{stars}</span>
                <Star size={12} className="fill-amber-400 stroke-amber-400" />
                <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Reviews List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading customer reviews from database...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <MessageSquare size={36} className="text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Reviews Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedStarFilter !== 'all'
                ? 'No customer reviews match your active filter criteria. Try clearing filters.'
                : 'Customer feedback submissions from the mobile app will automatically display here.'}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const commentText = review.comment || review.suggestion || '(No text comment provided)';
            const formattedDate = review.createdAt
              ? new Date(review.createdAt).toLocaleString('en-NG', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Recent';

            return (
              <div
                key={review.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all space-y-3"
              >
                {/* Header row: User Details + Stars + Delete Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-900/60 text-sm">
                      {(review.userName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                          {review.userName || 'Customer'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-semibold">
                          Verified User
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone size={11} />
                          {review.phone}
                        </span>
                        {review.userEmail && (
                          <span className="hidden sm:flex items-center gap-1">
                            <Mail size={11} />
                            {review.userEmail}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 self-start sm:self-auto pt-1 sm:pt-0">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            className={
                              star <= review.rating
                                ? 'fill-amber-400 stroke-amber-500'
                                : 'stroke-slate-300 dark:stroke-slate-600'
                            }
                          />
                        ))}
                      </div>
                      <span className="font-mono ml-1">{review.rating}★</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer flex items-center justify-center active:scale-95 disabled:opacity-50"
                      title="Delete / dismiss review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Comment body */}
                <div className="pl-0 sm:pl-13">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    "{commentText}"
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
