import React from 'react';
import { NotificationItem } from '../../types';
import { Wallet, ShieldAlert, Gift, Sparkles, Wifi, Inbox, Check } from 'lucide-react';

interface NotificationsScreenProps {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onSelectNotification: (id: string) => void;
  isLightMode?: boolean;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
  isLightMode,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const todayNotifications = notifications.filter((n) => n.group === 'TODAY' || (!n.group && n.group !== 'YESTERDAY' && (n as any).group !== 'EARLIER'));
  const yesterdayNotifications = notifications.filter((n) => n.group === 'YESTERDAY');
  const earlierNotifications = notifications.filter((n) => (n as any).group === 'EARLIER');

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'wallet':
        return <Wallet size={18} className="text-emerald-600 dark:text-emerald-400" />;
      case 'security':
        return <ShieldAlert size={18} className="text-rose-600 dark:text-rose-400" />;
      case 'promo':
        return <Gift size={18} className="text-amber-600 dark:text-amber-400" />;
      case 'system':
        return <Sparkles size={18} className="text-[#0047cc] dark:text-blue-400" />;
      case 'data':
        return <Wifi size={18} className="text-[#0047cc] dark:text-blue-400" />;
      default:
        return <Wallet size={18} className="text-[#0047cc] dark:text-blue-400" />;
    }
  };

  const getIconBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'wallet':
        return 'bg-emerald-50 dark:bg-emerald-950/60';
      case 'security':
        return 'bg-rose-50 dark:bg-rose-950/60';
      case 'promo':
        return 'bg-amber-50 dark:bg-amber-950/60';
      case 'system':
      case 'data':
      default:
        return 'bg-blue-50 dark:bg-blue-950/60';
    }
  };

  return (
    <div id="screen-notifications" className="px-4 sm:px-6 lg:px-8 py-5 space-y-5 pb-28 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
      {/* Subheader with Unread Counter and Mark all as read */}
      <div className="flex justify-between items-center py-2 px-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-50 text-[#0047cc] dark:bg-blue-950/60 dark:text-blue-400 text-xs font-bold">
            {unreadCount}
          </span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Unread</span>
        </div>
        <button
          id="mark-all-read-btn"
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
          className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 ${
            unreadCount > 0
              ? 'text-[#0047cc] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'
              : 'text-slate-400 opacity-50 cursor-not-allowed'
          }`}
        >
          <Check size={14} />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* TODAY GROUP */}
      {todayNotifications.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 tracking-wider uppercase px-1">
            TODAY
          </h2>
          <div className="space-y-2.5">
            {todayNotifications.map((notif) => (
              <div
                key={notif.id}
                id={`notif-item-${notif.id}`}
                onClick={() => onSelectNotification(notif.id)}
                className={`relative flex gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all overflow-hidden border shadow-xs ${
                  !notif.read
                    ? isLightMode
                      ? 'bg-white border-slate-100 hover:border-slate-200'
                      : 'bg-slate-800/90 border-slate-700 hover:border-slate-600'
                    : isLightMode
                    ? 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/70'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 opacity-80'
                }`}
              >
                {/* Left accent bar for unread notifications */}
                {!notif.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0047cc]" />
                )}

                {/* Icon Container */}
                <div
                  className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${getIconBg(notif.type)}`}
                >
                  {renderIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0 justify-center">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-sans text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {notif.title}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
                      {notif.time}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YESTERDAY GROUP */}
      {yesterdayNotifications.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 tracking-wider uppercase px-1">
            YESTERDAY
          </h2>
          <div className="space-y-2.5">
            {yesterdayNotifications.map((notif) => (
              <div
                key={notif.id}
                id={`notif-item-${notif.id}`}
                onClick={() => onSelectNotification(notif.id)}
                className={`flex gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all border shadow-xs ${
                  isLightMode
                    ? 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/70'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
                }`}
              >
                <div
                  className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${getIconBg(notif.type)}`}
                >
                  {renderIcon(notif.type)}
                </div>

                <div className="flex flex-col flex-1 min-w-0 justify-center">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-sans text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {notif.title}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
                      {notif.time}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EARLIER GROUP */}
      {earlierNotifications.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 tracking-wider uppercase px-1">
            EARLIER
          </h2>
          <div className="space-y-2.5">
            {earlierNotifications.map((notif) => (
              <div
                key={notif.id}
                id={`notif-item-${notif.id}`}
                onClick={() => onSelectNotification(notif.id)}
                className={`flex gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all border shadow-xs ${
                  isLightMode
                    ? 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/70'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
                }`}
              >
                <div
                  className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${getIconBg(notif.type)}`}
                >
                  {renderIcon(notif.type)}
                </div>

                <div className="flex flex-col flex-1 min-w-0 justify-center">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-sans text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {notif.title}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
                      {notif.time}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no notifications */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0047cc] dark:text-blue-400 flex items-center justify-center">
            <Inbox size={28} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">No notifications yet</h3>
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              When system alerts, wallet receipts, data vouchers or announcements arrive, they will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-6 gap-2 text-slate-400 dark:text-slate-600">
          <p className="font-sans text-[11px] font-medium">All notifications up to date</p>
        </div>
      )}
    </div>
  );
};
