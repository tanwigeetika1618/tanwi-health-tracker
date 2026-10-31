import { useState } from 'react';
import { ChefHat, Clock, Flame, Beef, LeafyGreen, Lightbulb } from 'lucide-react';
import { weeklyMealPlan } from '../data/mealPlans';

const mealTypeConfig: Record<string, { emoji: string; color: string; bg: string }> = {
  morning_ritual: { emoji: '🌅', color: 'text-amber-400', bg: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20' },
  breakfast: { emoji: '🍳', color: 'text-orange-400', bg: 'from-orange-500/10 to-red-500/10 border-orange-500/20' },
  snack: { emoji: '🍎', color: 'text-pink-400', bg: 'from-pink-500/10 to-rose-500/10 border-pink-500/20' },
  lunch: { emoji: '🍛', color: 'text-emerald-400', bg: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20' },
  pre_workout: { emoji: '⚡', color: 'text-yellow-400', bg: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20' },
  dinner: { emoji: '🌙', color: 'text-violet-400', bg: 'from-violet-500/10 to-indigo-500/10 border-violet-500/20' },
};

export default function MealPlan() {
  const days = weeklyMealPlan.map(d => d.day);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayIndex = days.indexOf(today);
  const [selectedDay, setSelectedDay] = useState(todayIndex >= 0 ? today : days[0]);

  const plan = weeklyMealPlan.find(d => d.day === selectedDay);
  if (!plan) return null;

  return (
    <div className="space-y-4 pb-24">
      {/* Hero */}
      <div className="hero-shimmer rounded-3xl p-6 text-white shadow-lg shadow-emerald-900/30" style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #059669 30%, #10b981 60%, #34d399 100%)',
      }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <ChefHat size={18} />
          </div>
          <h1 className="text-xl font-black">Meal Plan 🥗</h1>
        </div>
        <p className="text-sm opacity-90 mt-1">
          What to eat today — hitting your calorie, protein & fiber goals
        </p>
      </div>

      {/* Day Selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedDay === day
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                : day === today
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'card text-gray-500'
            }`}
          >
            {day.slice(0, 3)}
            {day === today && selectedDay !== day && ' •'}
          </button>
        ))}
      </div>

      {/* Day Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <Flame className="text-orange-400 mx-auto mb-1" size={18} />
          <p className="text-lg font-black text-white stat-number">{plan.totalCalories}</p>
          <p className="text-[9px] text-gray-500 font-bold uppercase">kcal</p>
        </div>
        <div className="card p-3 text-center">
          <Beef className="text-violet-400 mx-auto mb-1" size={18} />
          <p className="text-lg font-black text-white stat-number">{plan.totalProtein}g</p>
          <p className="text-[9px] text-gray-500 font-bold uppercase">protein</p>
        </div>
        <div className="card p-3 text-center">
          <LeafyGreen className="text-emerald-400 mx-auto mb-1" size={18} />
          <p className="text-lg font-black text-white stat-number">{plan.totalFiber}g</p>
          <p className="text-[9px] text-gray-500 font-bold uppercase">fiber</p>
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-3">
        {plan.meals.map((meal, i) => {
          const config = mealTypeConfig[meal.type] || mealTypeConfig.snack;
          return (
            <div key={i} className={`card p-4 border bg-gradient-to-r ${config.bg} animate-fade-in`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{config.emoji}</span>
                  <div>
                    <p className="text-sm font-black text-gray-200">{meal.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-gray-500" />
                      <span className="text-[10px] text-gray-500 font-semibold">{meal.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-300 stat-number">{meal.calories}</p>
                  <p className="text-[9px] text-gray-500">kcal</p>
                </div>
              </div>

              <div className="ml-8 space-y-1 mb-2">
                {meal.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <span className="text-violet-500 mt-1 text-[8px]">●</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>

              <div className="ml-8 flex gap-3 text-[10px]">
                <span className="text-violet-400 font-bold">P: {meal.protein}g</span>
                <span className="text-emerald-400 font-bold">F: {meal.fiber}g</span>
              </div>

              {meal.prepTip && (
                <div className="ml-8 mt-2 flex items-start gap-1.5 bg-white/5 rounded-xl p-2.5">
                  <Lightbulb size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-amber-300/80 leading-relaxed">{meal.prepTip}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grocery hint */}
      <div className="card p-4 bg-emerald-500/5 border border-emerald-500/15">
        <h3 className="font-black text-emerald-400 text-sm mb-2">🛒 Grocery Tips</h3>
        <div className="space-y-1.5 text-xs text-gray-500">
          <p>• <strong className="text-gray-400">Sunday</strong> = Meal prep day! Cook dal, soak legumes, chop veggies</p>
          <p>• <strong className="text-gray-400">Batch cook:</strong> Dal keeps 3-4 days in fridge. Make a big pot!</p>
          <p>• <strong className="text-gray-400">Always keep:</strong> Eggs, oats, milk, seeds, curd, seasonal veggies</p>
          <p>• <strong className="text-gray-400">Iron foods:</strong> Palak, beetroot, moong sprouts, poha + lemon 🍋</p>
          <p>• <strong className="text-gray-400">Hair foods:</strong> Pumpkin seeds, eggs, spinach, amla, walnuts 💇</p>
        </div>
      </div>
    </div>
  );
}
