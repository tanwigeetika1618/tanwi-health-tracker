import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellOff, Check, Clock, Settings } from 'lucide-react';

interface Reminder {
  id: string;
  time: string;
  label: string;
  emoji: string;
  category: string;
  enabled: boolean;
}

interface RemindersProps {
  reminders: Reminder[];
  onUpdateReminders: (reminders: Reminder[]) => void;
}

const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'wake', time: '06:30', label: 'Time to wake up! Start with lemon water 🍋', emoji: '☀️', category: 'personal', enabled: true },
  { id: 'morning-exercise', time: '07:15', label: 'Morning stretch / yoga time!', emoji: '🧘', category: 'exercise', enabled: true },
  { id: 'breakfast', time: '07:45', label: 'Breakfast time! Fuel your body 🍳', emoji: '🌅', category: 'meal', enabled: true },
  { id: 'work-start', time: '08:30', label: 'Time to start work', emoji: '💻', category: 'work', enabled: true },
  { id: 'desk-stretch', time: '10:30', label: 'Desk stretch break! Move your body 🤸', emoji: '🙆', category: 'exercise', enabled: true },
  { id: 'morning-snack', time: '11:00', label: 'Mid-morning snack — nuts + green tea', emoji: '🍵', category: 'meal', enabled: true },
  { id: 'lunch-prep', time: '12:30', label: 'Start preparing lunch! 🧑‍🍳', emoji: '🍳', category: 'meal', enabled: true },
  { id: 'lunch', time: '13:00', label: 'Lunch time! Don\'t skip it 🍛', emoji: '☀️', category: 'meal', enabled: true },
  { id: 'post-lunch-walk', time: '13:45', label: 'Quick 10 min walk after lunch', emoji: '🚶', category: 'exercise', enabled: true },
  { id: 'water-check', time: '14:30', label: 'Hydration check! Have you had enough water? 💧', emoji: '💧', category: 'personal', enabled: true },
  { id: 'evening-snack', time: '16:00', label: 'Evening snack time — yogurt + fruits', emoji: '🍎', category: 'meal', enabled: true },
  { id: 'study', time: '16:30', label: 'Study / Interview prep time 📚', emoji: '📖', category: 'study', enabled: true },
  { id: 'evening-exercise', time: '18:00', label: 'Exercise time! Today\'s workout 💪', emoji: '🏋️', category: 'exercise', enabled: true },
  { id: 'dinner-prep', time: '19:30', label: 'Start preparing dinner', emoji: '🧑‍🍳', category: 'meal', enabled: true },
  { id: 'dinner', time: '20:00', label: 'Dinner time! Light and healthy 🥗', emoji: '🌙', category: 'meal', enabled: true },
  { id: 'wind-down', time: '21:30', label: 'Start winding down — no screens soon! 📵', emoji: '🌅', category: 'personal', enabled: true },
  { id: 'log-reminder', time: '21:45', label: 'Log your day! Meals, exercise, water, weight 📊', emoji: '📝', category: 'personal', enabled: true },
  { id: 'sleep-prep', time: '22:00', label: 'Dim lights, prepare for sleep 💤', emoji: '🕯️', category: 'personal', enabled: true },
  { id: 'sleep', time: '23:00', label: 'Bedtime! Get your 7-8 hours 🌙', emoji: '😴', category: 'sleep', enabled: true },
];

function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export { DEFAULT_REMINDERS };
export type { Reminder };

export default function Reminders({ reminders, onUpdateReminders }: RemindersProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showSettings, setShowSettings] = useState(false);
  const [nextReminder, setNextReminder] = useState<Reminder | null>(null);
  const [lastNotified, setLastNotified] = useState<Set<string>>(new Set());
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const toggleReminder = (id: string) => {
    onUpdateReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const updateTime = (id: string, newTime: string) => {
    onUpdateReminders(reminders.map(r => r.id === id ? { ...r, time: newTime } : r));
  };

  const toggleAll = (enabled: boolean) => {
    onUpdateReminders(reminders.map(r => ({ ...r, enabled })));
  };

  const sendNotification = useCallback((reminder: Reminder) => {
    if (permission !== 'granted') return;
    try {
      new Notification(`${reminder.emoji} ${reminder.label}`, {
        icon: '/tanwi-health-tracker/icons/icon-192.svg',
        badge: '/tanwi-health-tracker/icons/icon-192.svg',
        tag: reminder.id,
      });
    } catch {
      // Notification failed silently
    }
  }, [permission]);

  // Check reminders every 30 seconds
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayKey = now.toISOString().split('T')[0];

      const activeReminders = reminders.filter(r => r.enabled);

      // Find next upcoming reminder
      const upcoming = activeReminders
        .filter(r => r.time > currentTime)
        .sort((a, b) => a.time.localeCompare(b.time));
      setNextReminder(upcoming[0] || null);

      // Check if any reminder should fire now
      for (const reminder of activeReminders) {
        const notifKey = `${todayKey}-${reminder.id}`;
        if (reminder.time === currentTime && !lastNotified.has(notifKey)) {
          sendNotification(reminder);
          setLastNotified(prev => new Set([...prev, notifKey]));
        }
      }
    };

    checkReminders();
    intervalRef.current = window.setInterval(checkReminders, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reminders, permission, lastNotified, sendNotification]);

  const categoryColors: Record<string, string> = {
    personal: 'border-gray-200 bg-gray-50',
    exercise: 'border-orange-200 bg-orange-50',
    meal: 'border-emerald-200 bg-emerald-50',
    work: 'border-blue-200 bg-blue-50',
    study: 'border-purple-200 bg-purple-50',
    sleep: 'border-indigo-200 bg-indigo-50',
  };

  const enabledCount = reminders.filter(r => r.enabled).length;

  return (
    <div className="space-y-4 pb-24">
      {/* Hero */}
      <div className="hero-shimmer rounded-3xl p-6 text-white shadow-lg shadow-amber-200" style={{
        background: 'linear-gradient(135deg, #b45309 0%, #d97706 30%, #f59e0b 60%, #fbbf24 100%)',
      }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Bell size={18} />
          </div>
          <h1 className="text-xl font-black">Reminders 🔔</h1>
        </div>
        <p className="text-sm opacity-90 mt-1">
          Stay on track with timely nudges for meals, exercise & sleep
        </p>
      </div>

      {/* Permission Status */}
      {permission !== 'granted' && (
        <div className="card p-4 border-2 border-amber-200 bg-amber-50/50 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <BellOff size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">Enable Notifications</p>
              <p className="text-xs text-amber-600">
                {permission === 'unsupported'
                  ? 'Your browser doesn\'t support notifications'
                  : 'Allow notifications to get reminders throughout the day'}
              </p>
            </div>
            {permission !== 'unsupported' && (
              <button
                onClick={requestPermission}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform shadow-md"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      )}

      {permission === 'granted' && (
        <div className="card p-4 border-2 border-emerald-200 bg-emerald-50/50 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Check size={20} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800">Notifications Active ✓</p>
              <p className="text-xs text-emerald-600">{enabledCount} reminders enabled · keep this tab open</p>
            </div>
          </div>
        </div>
      )}

      {/* Next Reminder */}
      {nextReminder && (
        <div className="card p-4 bg-gradient-to-r from-violet-50/80 to-purple-50/80 border border-violet-200 animate-fade-in">
          <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">Next Reminder</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{nextReminder.emoji}</span>
            <div>
              <p className="text-sm font-bold text-gray-800">{nextReminder.label}</p>
              <p className="text-xs text-violet-500 font-semibold flex items-center gap-1">
                <Clock size={11} /> {nextReminder.time}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => toggleAll(true)}
          className="flex-1 card py-2.5 text-center text-xs font-bold text-emerald-600 active:scale-95 transition-transform"
        >
          ✓ Enable All
        </button>
        <button
          onClick={() => toggleAll(false)}
          className="flex-1 card py-2.5 text-center text-xs font-bold text-gray-400 active:scale-95 transition-transform"
        >
          ✗ Disable All
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`card px-4 py-2.5 text-xs font-bold active:scale-95 transition-transform ${showSettings ? 'text-violet-600' : 'text-gray-500'}`}
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-2">
        {reminders.map(reminder => (
          <div
            key={reminder.id}
            className={`card p-3.5 border transition-all ${
              reminder.enabled ? categoryColors[reminder.category] : 'opacity-50 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleReminder(reminder.id)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  reminder.enabled
                    ? 'bg-violet-500 border-violet-500'
                    : 'border-gray-300'
                }`}
              >
                {reminder.enabled && <Check size={14} className="text-white" />}
              </button>
              <span className="text-lg flex-shrink-0">{reminder.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${reminder.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                  {reminder.label}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold">{reminder.time}</p>
              </div>
              {showSettings && (
                <input
                  type="time"
                  value={reminder.time}
                  onChange={e => updateTime(reminder.id, e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold w-24 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="card p-4 bg-gradient-to-br from-amber-50/60 to-yellow-50/60 border border-amber-100">
        <h3 className="font-black text-amber-800 text-sm mb-2">💡 How Reminders Work</h3>
        <div className="space-y-1.5 text-xs text-amber-700">
          <p>• Notifications pop up on your phone/desktop at the set times</p>
          <p>• You need to <strong>allow notifications</strong> when prompted</p>
          <p>• On phone: add app to home screen → notifications work in background</p>
          <p>• Tap ⚙️ to customize reminder times to match your schedule</p>
          <p>• Toggle individual reminders on/off as needed</p>
        </div>
      </div>
    </div>
  );
}
