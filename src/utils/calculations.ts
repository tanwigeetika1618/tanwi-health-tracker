import type { UserProfile, LoggedFood, LoggedExercise } from '../types';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Tanvi',
  age: 25,
  gender: 'female',
  heightCm: 155,
  currentWeightKg: 65,
  targetWeightKg: 50,
  activityLevel: 'sedentary',
  targetCalories: 1250,
  targetProtein: 75,
  targetFiber: 28,
  targetFat: 42,
  targetCarbs: 144,
  targetWater: 2500,
  targetMonths: 6,
};

export function calculateBMR(weight: number, height: number, age: number, gender: 'female' | 'male'): number {
  if (gender === 'female') {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.2));
}

export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function calculateDailyTotals(foods: LoggedFood[]) {
  return foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
      fiber: acc.fiber + food.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function calculateExerciseCalories(exercises: LoggedExercise[]): number {
  return exercises.reduce((acc, ex) => acc + ex.caloriesBurned, 0);
}

export function getWeeklyWeightLoss(currentWeight: number, targetWeight: number, months: number): number {
  const totalLoss = currentWeight - targetWeight;
  const weeks = months * 4.33;
  return Math.round((totalLoss / weeks) * 100) / 100;
}

export function getCalorieStatus(consumed: number, target: number): {
  status: 'under' | 'on-track' | 'over';
  message: string;
  color: string;
} {
  const percentage = (consumed / target) * 100;
  if (percentage < 80) {
    return {
      status: 'under',
      message: 'Eat more! Too few calories can slow metabolism & cause hair loss.',
      color: 'text-amber-600',
    };
  }
  if (percentage <= 105) {
    return {
      status: 'on-track',
      message: 'Great job! You\'re right on track! 🎯',
      color: 'text-emerald-600',
    };
  }
  return {
    status: 'over',
    message: `Over by ${Math.round(consumed - target)} kcal. It's okay — move more tomorrow!`,
    color: 'text-red-500',
  };
}

export function getMacroPercentages(protein: number, carbs: number, fat: number) {
  const totalCals = protein * 4 + carbs * 4 + fat * 9;
  if (totalCals === 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((protein * 4 / totalCals) * 100),
    carbs: Math.round((carbs * 4 / totalCals) * 100),
    fat: Math.round((fat * 9 / totalCals) * 100),
  };
}

export function calculateWeightProgress(currentWeight: number, startWeight: number, targetWeight: number): number {
  const totalToLose = startWeight - targetWeight;
  const lostSoFar = startWeight - currentWeight;
  if (totalToLose <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100)));
}
