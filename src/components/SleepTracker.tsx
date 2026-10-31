import { useState, useMemo } from 'react';
import { Moon, Sun, Clock, Plus, Bed, AlarmClock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyLog } from '../types';

interface SleepEntry {
  date: string;
  bedtime: string;
  wakeTime: string;
  duration: number;
  quality: 'great' | 'good' | 'okay' | 'poor';
  notes?: string;
}

interface SleepTrackerProps {
  sleepEntries: SleepEntry[];
  onAddSleep: (entry: SleepEntry) => void;
  todayLog: DailyLog;
}

function calculateDuration(bedtime: string, wakeTime: string): number {
  const [bedH, bedM] = bedtime.split(':').map(Number);
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);

  let bedMinutes = bedH * 60 + bedM;
  let wakeMinutes = wakeH * 60 + wakeM;

  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }

  return (wakeMinutes - bedMinutes) / 60;
}

function getQuality(duration: number): SleepEntry['quality'] {
  if (duration >= 7 && duration <= 9) return 'great';
  if (duration >= 6 && duration < 7) return 'good';
  if (duration >= 5 && duration < 6) return 'okay';
  return 'poor';
}

function getQualityEmoji(quality: string): string {
  const emojis: Record<string, string> = { great: '😴✨', good: '🙂', okay: '😐', poor: '😟' };
  return emojis[quality] || '😴';
}

function getQualityColor(quality: string): string {
  const colors: Record<string, string> = {
    great: 'from-indigo-500 to-purple-500',
    good: 'from-blue-500 to-indigo-500',
    okay: 'from-amber-500 to-orange-500',
    poor: 'from-red-500 to-pink-500',
  };
  return colors[quality] || 'from-gray-400 to-gray-500';
}

export default function SleepTracker({ sleepEntries, onAddSleep }: SleepTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [notes, setNotes] = useState('');

  const previewDuration = calculateDuration(bedtime, wakeTime);
  const previewQuality = getQuality(previewDuration);

  const lastEntry = sleepEntries.length > 0 ? sleepEntries[sleepEntries.length - 1] : null;

  const weekAvg = useMemo(() => {
    const last7 = sleepEntries.slice(-7);
    if (last7.length === 0) return 0;
    return last7.reduce((sum, e) => sum + e.duration, 0) / last7.length;
  }, [sleepEntries]);

  const chartData = useMemo(() => {
    return sleepEntries.slice(-14).map(entry => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: Math.round(entry.duration * 10) / 10,
      target: 7.5,
    }));
  }, [sleepEntries]);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = sleepEntries.length - 1; i >= 0; i--) {
      if (sleepEntries[i].duration >= 7) count++;
      else break;
    }
    return count;
  }, [sleepEntries]);

  const handleLog = () => {
    const duration = calculateDuration(bedtime, wakeTime);
    const entry: SleepEntry = {
      date: new Date().toISOString().split('T')[0],
      bedtime,
      wakeTime,
      duration,
      quality: getQuality(duration),
      notes: notes || undefined,
    };
    onAddSleep(entry);
    setShowForm(false);
    setNotes('');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Hero */}
      <div className="hero-shimmer rounded-3xl p-6 text-white shadow-lg shadow-indigo-200" style={{
        background: 'linear-gradient(135deg, #312e81 0%, #4338ca 30%, #6366f1 60%, #818cf8 100%)',
      }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Moon size={18} />
          </div>
          <h1 className="text-xl font-black">Sleep Tracker 🌙</h1>
        </div>
        <p className="text-sm opacity-90 mt-1">
          Target: 11 PM → 6 AM · 7-8 hours of quality sleep
        </p>
      </div>

      {/* Last Night Summary */}
      {lastEntry ? (
        <div className={`card p-5 bg-gradient-to-br ${
          lastEntry.quality === 'great' ? 'from-indigo-50/80 to-purple-50/80 border-indigo-200' :
          lastEntry.quality === 'good' ? 'from-blue-50/80 to-indigo-50/80 border-blue-200' :
          lastEntry.quality === 'okay' ? 'from-amber-50/80 to-orange-50/80 border-amber-200' :
          'from-red-50/80 to-pink-50/80 border-red-200'
        } border animate-fade-in`}>
          <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">Last Night</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{getQualityEmoji(lastEntry.quality)}</div>
              <div>
                <p className="text-3xl font-black stat-number">{lastEntry.duration.toFixed(1)}<span className="text-sm font-bold text-gray-400 ml-1">hrs</span></p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">Quality: <span className="font-bold">{lastEntry.quality}</span></p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Bed size={12} /> <span className="font-semibold">{lastEntry.bedtime}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <AlarmClock size={12} /> <span className="font-semibold">{lastEntry.wakeTime}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center animate-fade-in">
          <p className="text-3xl mb-2">🌙</p>
          <p className="text-sm font-semibold text-gray-500">No sleep logged yet</p>
          <p className="text-xs text-gray-400 mt-1">Log last night's sleep to get started!</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-1.5">
            <Clock size={16} className="text-indigo-500" />
          </div>
          <p className="text-lg font-black stat-number">{weekAvg ? weekAvg.toFixed(1) : '--'}</p>
          <p className="text-[9px] text-gray-400 font-bold uppercase">Avg hrs/night</p>
        </div>
        <div className="card p-3 text-center">
          <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-1.5">
            <Moon size={16} className="text-purple-500" />
          </div>
          <p className="text-lg font-black stat-number">{sleepEntries.length}</p>
          <p className="text-[9px] text-gray-400 font-bold uppercase">Nights Logged</p>
        </div>
        <div className="card p-3 text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-1.5">
            <Sun size={16} className="text-emerald-500" />
          </div>
          <p className="text-lg font-black stat-number">{streak}</p>
          <p className="text-[9px] text-gray-400 font-bold uppercase">7h+ Streak</p>
        </div>
      </div>

      {/* Log Sleep Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
      >
        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-200">
          <Plus size={20} className="text-white" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold">Log Last Night's Sleep</p>
          <p className="text-xs text-gray-400">When did you sleep and wake up?</p>
        </div>
      </button>

      {/* Sleep Form */}
      {showForm && (
        <div className="card p-5 space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Moon size={12} /> Bedtime
              </label>
              <input
                type="time"
                value={bedtime}
                onChange={e => setBedtime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Sun size={12} /> Wake Up
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={e => setWakeTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
              />
            </div>
          </div>

          {/* Preview */}
          <div className={`p-4 rounded-2xl bg-gradient-to-r ${getQualityColor(previewQuality)} text-white text-center`}>
            <p className="text-3xl font-black">{previewDuration.toFixed(1)} hrs</p>
            <p className="text-sm opacity-90 mt-1">{getQualityEmoji(previewQuality)} {previewQuality === 'great' ? 'Perfect sleep!' : previewQuality === 'good' ? 'Pretty good!' : previewQuality === 'okay' ? 'Could be better' : 'Try sleeping earlier!'}</p>
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any notes? (e.g., slept late due to meeting, woke up feeling refreshed...)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
            rows={2}
          />

          <button
            onClick={handleLog}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg shadow-indigo-300"
          >
            <Moon size={16} /> Log Sleep
          </button>
        </div>
      )}

      {/* Sleep Chart */}
      {chartData.length > 1 && (
        <div className="card p-5 animate-fade-in">
          <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4">Sleep Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} />
              <Line type="monotone" dataKey="target" stroke="#e5e7eb" strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sleep Tips */}
      <div className="card p-5 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100">
        <h3 className="font-black text-indigo-800 text-sm mb-3">💤 Sleep Tips for Better Health</h3>
        <div className="space-y-2">
          {[
            { icon: '📱', tip: 'No screens 30 min before bed — blue light blocks melatonin' },
            { icon: '🌡️', tip: 'Keep room cool (18-22°C) — your body needs to cool down to sleep' },
            { icon: '☕', tip: 'No caffeine (chai/coffee) after 3 PM' },
            { icon: '🕐', tip: 'Same bedtime daily — even weekends — sets your body clock' },
            { icon: '🍽️', tip: 'Finish dinner 2-3 hours before bed — digestion disrupts sleep' },
            { icon: '💡', tip: 'Dim lights after 9 PM — signals your brain it\'s nighttime' },
            { icon: '💇', tip: 'Sleep helps hair growth! Poor sleep worsens telogen effluvium' },
          ].map((item, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="text-sm mt-0.5">{item.icon}</span>
              <p className="text-xs text-indigo-700 leading-relaxed">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { SleepEntry };
