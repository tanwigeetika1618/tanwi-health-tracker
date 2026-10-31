import { useState, useCallback } from 'react';
import { LayoutDashboard, UtensilsCrossed, Dumbbell, Calendar, TrendingUp } from 'lucide-react';
import Dashboard from './components/Dashboard';
import FoodLogger from './components/FoodLogger';
import ExerciseTracker from './components/ExerciseTracker';
import Schedule from './components/Schedule';
import Progress from './components/Progress';
import { useLocalStorage, getTodayKey } from './hooks/useLocalStorage';
import { DEFAULT_PROFILE } from './utils/calculations';
import type { DailyLog, LoggedFood, LoggedExercise, UserProfile, FoodItem, WeightEntry } from './types';

type Tab = 'dashboard' | 'food' | 'exercise' | 'schedule' | 'progress';

const emptyDailyLog: DailyLog = {
  date: getTodayKey(),
  foods: [],
  exercises: [],
  water: 0,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useLocalStorage<UserProfile>('tanvi-profile', DEFAULT_PROFILE);
  const [dailyLogs, setDailyLogs] = useLocalStorage<Record<string, DailyLog>>('tanvi-daily-logs', {});
  const [weightEntries, setWeightEntries] = useLocalStorage<WeightEntry[]>('tanvi-weight-entries', []);
  const [customFoods, setCustomFoods] = useLocalStorage<FoodItem[]>('tanvi-custom-foods', []);

  const todayKey = getTodayKey();
  const todayLog = dailyLogs[todayKey] || { ...emptyDailyLog, date: todayKey };

  const updateTodayLog = useCallback((updater: (log: DailyLog) => DailyLog) => {
    setDailyLogs(prev => ({
      ...prev,
      [todayKey]: updater(prev[todayKey] || { ...emptyDailyLog, date: todayKey }),
    }));
  }, [todayKey, setDailyLogs]);

  const handleAddFood = useCallback((food: LoggedFood) => {
    updateTodayLog(log => ({ ...log, foods: [...log.foods, food] }));
  }, [updateTodayLog]);

  const handleAddExercise = useCallback((exercise: LoggedExercise) => {
    updateTodayLog(log => ({ ...log, exercises: [...log.exercises, exercise] }));
  }, [updateTodayLog]);

  const handleUpdateWater = useCallback((delta: number) => {
    updateTodayLog(log => ({
      ...log,
      water: Math.max(0, (log.water || 0) + delta),
    }));
  }, [updateTodayLog]);

  const handleAddWeight = useCallback((entry: WeightEntry) => {
    setWeightEntries(prev => {
      const filtered = prev.filter(e => e.date !== entry.date);
      return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, [setWeightEntries]);

  const handleUpdateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, [setProfile]);

  const handleAddCustomFood = useCallback((food: FoodItem) => {
    setCustomFoods(prev => [...prev, food]);
  }, [setCustomFoods]);

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { id: 'food', icon: <UtensilsCrossed size={20} />, label: 'Food' },
    { id: 'exercise', icon: <Dumbbell size={20} />, label: 'Exercise' },
    { id: 'schedule', icon: <Calendar size={20} />, label: 'Schedule' },
    { id: 'progress', icon: <TrendingUp size={20} />, label: 'Progress' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 pt-4">
        {activeTab === 'dashboard' && (
          <Dashboard
            dailyLog={todayLog}
            profile={profile}
            onUpdateWater={handleUpdateWater}
          />
        )}
        {activeTab === 'food' && (
          <FoodLogger
            onAddFood={handleAddFood}
            onAddCustomFood={handleAddCustomFood}
            customFoods={customFoods}
          />
        )}
        {activeTab === 'exercise' && (
          <ExerciseTracker onAddExercise={handleAddExercise} />
        )}
        {activeTab === 'schedule' && <Schedule />}
        {activeTab === 'progress' && (
          <Progress
            weightEntries={weightEntries}
            profile={profile}
            dailyLogs={dailyLogs}
            onAddWeight={handleAddWeight}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 pt-3 transition-colors ${
                activeTab === tab.id
                  ? 'text-violet-600'
                  : 'text-gray-400'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
