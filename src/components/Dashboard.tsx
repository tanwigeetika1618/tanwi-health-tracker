import { useMemo } from 'react';
import { Droplets, Flame, Beef, LeafyGreen, TrendingDown, Plus, Minus } from 'lucide-react';
import type { DailyLog, UserProfile } from '../types';
import { calculateDailyTotals, calculateExerciseCalories, getCalorieStatus, calculateBMI, getBMICategory, getMacroPercentages } from '../utils/calculations';

interface DashboardProps {
  dailyLog: DailyLog;
  profile: UserProfile;
  onUpdateWater: (delta: number) => void;
}

function CircularProgress({ value, max, label, unit, color, size = 120 }: {
  value: number; max: number; label: string; unit: string; color: string; size?: number;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-bold">{Math.round(value)}</span>
        <span className="text-xs text-gray-500">/ {max} {unit}</span>
      </div>
      <span className="text-xs font-medium text-gray-600 mt-1">{label}</span>
    </div>
  );
}

function MacroBar({ label, value, target, color, unit = 'g' }: {
  label: string; value: number; target: number; color: string; unit?: string;
}) {
  const percentage = Math.min((value / target) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-600 w-16">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold w-20 text-right">
        {Math.round(value)}/{target}{unit}
      </span>
    </div>
  );
}

export default function Dashboard({ dailyLog, profile, onUpdateWater }: DashboardProps) {
  const totals = useMemo(() => calculateDailyTotals(dailyLog.foods), [dailyLog.foods]);
  const exerciseCals = useMemo(() => calculateExerciseCalories(dailyLog.exercises), [dailyLog.exercises]);
  const netCalories = totals.calories - exerciseCals;
  const calorieStatus = getCalorieStatus(totals.calories, profile.targetCalories);
  const bmi = calculateBMI(profile.currentWeightKg, profile.heightCm);
  const bmiCategory = getBMICategory(bmi);
  const macroPercent = getMacroPercentages(totals.protein, totals.carbs, totals.fat);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white">
        <p className="text-sm opacity-80">{dayName}, {dateStr}</p>
        <h1 className="text-2xl font-bold mt-1">Hey {profile.name}! 💪</h1>
        <p className="text-sm opacity-90 mt-1">
          {dailyLog.foods.length === 0
            ? "Let's start logging your meals today!"
            : calorieStatus.message}
        </p>
      </div>

      {/* Calorie Ring */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">TODAY'S CALORIES</h2>
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-3xl font-bold text-violet-600">{Math.round(totals.calories)}</p>
            <p className="text-xs text-gray-500">Eaten</p>
          </div>
          <div className="relative">
            <CircularProgress
              value={totals.calories}
              max={profile.targetCalories}
              label=""
              unit="kcal"
              color={totals.calories > profile.targetCalories ? '#ef4444' : '#8b5cf6'}
            />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-500">{exerciseCals}</p>
            <p className="text-xs text-gray-500">Burned</p>
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-500">
            Net: <span className="font-bold text-gray-700">{Math.round(netCalories)} kcal</span>
            {' '}| Remaining: <span className="font-bold text-violet-600">{Math.max(0, Math.round(profile.targetCalories - totals.calories))} kcal</span>
          </p>
        </div>
      </div>

      {/* Macros */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-500">MACROS</h2>
        <MacroBar label="Protein" value={totals.protein} target={profile.targetProtein} color="#8b5cf6" />
        <MacroBar label="Carbs" value={totals.carbs} target={profile.targetCarbs} color="#f59e0b" />
        <MacroBar label="Fat" value={totals.fat} target={profile.targetFat} color="#ef4444" />
        <MacroBar label="Fiber" value={totals.fiber} target={profile.targetFiber} color="#10b981" />
        <div className="flex gap-2 pt-2 justify-center">
          <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full">P {macroPercent.protein}%</span>
          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">C {macroPercent.carbs}%</span>
          <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">F {macroPercent.fat}%</span>
        </div>
      </div>

      {/* Water Tracker */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">WATER INTAKE</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="text-blue-500" size={24} />
            <div>
              <p className="text-2xl font-bold text-blue-600">{dailyLog.water} ml</p>
              <p className="text-xs text-gray-500">Target: {profile.targetWater} ml</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateWater(-250)}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200"
            >
              <Minus size={18} />
            </button>
            <button
              onClick={() => onUpdateWater(250)}
              className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center active:bg-blue-600"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        <div className="mt-3 h-3 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((dailyLog.water / profile.targetWater) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">
          {Math.round((dailyLog.water / profile.targetWater) * 100)}% — each tap adds 250ml (1 glass)
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <Flame className="text-orange-500 mx-auto mb-1" size={22} />
          <p className="text-xs text-gray-500">Meals Today</p>
          <p className="text-xl font-bold">{dailyLog.foods.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <Beef className="text-violet-500 mx-auto mb-1" size={22} />
          <p className="text-xs text-gray-500">Exercises</p>
          <p className="text-xl font-bold">{dailyLog.exercises.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <TrendingDown className="text-green-500 mx-auto mb-1" size={22} />
          <p className="text-xs text-gray-500">Current BMI</p>
          <p className="text-xl font-bold">{bmi}</p>
          <p className="text-xs text-gray-400">{bmiCategory}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <LeafyGreen className="text-emerald-500 mx-auto mb-1" size={22} />
          <p className="text-xs text-gray-500">Weight Goal</p>
          <p className="text-xl font-bold">{profile.currentWeightKg}→{profile.targetWeightKg}</p>
          <p className="text-xs text-gray-400">kg</p>
        </div>
      </div>

      {/* Today's Logged Meals Summary */}
      {dailyLog.foods.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">TODAY'S MEALS</h2>
          {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(mealType => {
            const mealFoods = dailyLog.foods.filter(f => f.mealType === mealType);
            if (mealFoods.length === 0) return null;
            const mealCals = mealFoods.reduce((sum, f) => sum + f.calories, 0);
            const mealIcons = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' };
            return (
              <div key={mealType} className="mb-3 last:mb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium capitalize">
                    {mealIcons[mealType]} {mealType}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{Math.round(mealCals)} kcal</span>
                </div>
                {mealFoods.map(food => (
                  <p key={food.id} className="text-xs text-gray-500 ml-6">
                    {food.name} ({food.quantity} {food.servingUnit}) — {Math.round(food.calories)} kcal
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
