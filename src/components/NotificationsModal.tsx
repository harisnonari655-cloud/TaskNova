import React from 'react';
import { NotificationItem } from '../types';
import { api } from '../api';
import { Bell, Check, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface NotificationsModalProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onRefresh: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onRefresh,
}) => {
  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      onRefresh();
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-white text-base">In-App Notifications</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No notifications yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto space-y-2">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
                className={`p-3 rounded-xl transition-colors cursor-pointer space-y-1 ${
                  notif.read ? 'bg-slate-950/40 text-slate-400' : 'bg-slate-800/40 text-slate-200 border border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                    <span>{notif.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
