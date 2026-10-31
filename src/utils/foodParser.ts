import { foodDatabase } from '../data/foods';
import { exerciseDatabase } from '../data/exercises';
import type { FoodItem, LoggedFood, MealType, LoggedExercise } from '../types';

interface ParsedFoodEntry {
  food: FoodItem;
  quantity: number;
  mealType: MealType;
  matchedText: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ParsedExerciseEntry {
  exercise: typeof exerciseDatabase[0];
  duration: number;
  matchedText: string;
  reps?: number;
  sets?: number;
}

const MEAL_KEYWORDS: Record<MealType, string[]> = {
  breakfast: ['breakfast', 'morning', 'subah', 'nashta', 'brekkie'],
  lunch: ['lunch', 'dopahar', 'afternoon'],
  snack: ['snack', 'evening snack', 'shaam', 'mid-morning', 'mid morning', 'tea time', 'chai time'],
  dinner: ['dinner', 'raat', 'night', 'khaana'],
};

const QUANTITY_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*(?:cup|cups)/i,
  /(\d+(?:\.\d+)?)\s*(?:glass|glasses)/i,
  /(\d+(?:\.\d+)?)\s*(?:bowl|bowls)/i,
  /(\d+(?:\.\d+)?)\s*(?:tbsp|tablespoon|tablespoons)/i,
  /(\d+(?:\.\d+)?)\s*(?:tsp|teaspoon|teaspoons)/i,
  /(\d+(?:\.\d+)?)\s*(?:scoop|scoops)/i,
  /(\d+(?:\.\d+)?)\s*(?:piece|pieces|pcs)/i,
  /(\d+(?:\.\d+)?)\s*(?:slice|slices)/i,
  /(\d+(?:\.\d+)?)\s*(?:plate|plates)/i,
  /(\d+(?:\.\d+)?)\s*(?:serving|servings)/i,
  /(\d+(?:\.\d+)?)\s*(?:roti|rotis|chapati|chapatis)/i,
  /(\d+(?:\.\d+)?)\s*(?:idli|idlis)/i,
  /(\d+(?:\.\d+)?)\s*(?:dosa|dosas)/i,
  /(\d+(?:\.\d+)?)\s*(?:egg|eggs)/i,
  /(\d+(?:\.\d+)?)\s*g(?:ram|rams)?(?:\s|$|,)/i,
  /(\d+(?:\.\d+)?)\s*ml/i,
  /(\d+(?:\.\d+)?)\s*li(?:ter|tre|ters|tres)/i,
  /half\s+(?:a\s+)?/i,
  /(\d+(?:\.\d+)?)/,
];

const FOOD_ALIASES: Record<string, string[]> = {
  'chia-seeds': ['chia', 'chia seeds'],
  'basil-seeds': ['basil seeds', 'sabja', 'sabja seeds', 'tukmaria'],
  'pumpkin-seeds': ['pumpkin seeds', 'pumpkin'],
  'sunflower-seeds': ['sunflower seeds', 'sunflower'],
  'almonds': ['almonds', 'almond', 'badam'],
  'walnuts': ['walnuts', 'walnut', 'akhrot'],
  'cashews': ['cashews', 'cashew', 'kaju'],
  'banana': ['banana', 'kela'],
  'strawberries': ['strawberry', 'strawberries'],
  'apple': ['apple', 'seb'],
  'milk-whole': ['full cream milk', 'whole milk', 'full fat milk'],
  'milk-toned': ['toned milk', 'milk', 'doodh'],
  'milk-skimmed': ['skimmed milk', 'double toned milk', 'low fat milk'],
  'greek-yogurt': ['greek yogurt', 'greek curd', 'protein yogurt'],
  'curd-dahi': ['curd', 'dahi', 'yogurt', 'raita'],
  'paneer': ['paneer', 'cottage cheese', 'paneer bhurji'],
  'buttermilk': ['buttermilk', 'chaas', 'chaach', 'lassi'],
  'oats': ['oats', 'oatmeal', 'porridge'],
  'roti-wheat': ['roti', 'chapati', 'chapatti', 'phulka', 'rotis'],
  'brown-rice': ['brown rice'],
  'white-rice': ['rice', 'chawal', 'white rice'],
  'multigrain-bread': ['bread', 'toast', 'multigrain bread'],
  'poha': ['poha', 'flattened rice'],
  'egg-boiled': ['boiled egg', 'boiled eggs', 'anda'],
  'egg-white': ['egg white', 'egg whites'],
  'egg-omelette': ['omelette', 'omelet', 'anda omelette'],
  'egg-scrambled': ['scrambled egg', 'scrambled eggs'],
  'chickpeas-cooked': ['chickpea', 'chickpeas', 'chole', 'chana', 'chhole'],
  'moong-dal': ['moong dal', 'moong', 'green gram'],
  'toor-dal': ['toor dal', 'arhar dal', 'arhar', 'toor'],
  'masoor-dal': ['masoor dal', 'masoor', 'red lentil', 'red lentils'],
  'rajma': ['rajma', 'kidney beans', 'rajmah'],
  'sprouts-moong': ['sprouts', 'moong sprouts', 'ankurit'],
  'soybean-chunks': ['soya chunks', 'soya', 'soy chunks', 'meal maker', 'nutrela'],
  'spinach': ['spinach', 'palak'],
  'broccoli': ['broccoli'],
  'sweet-potato': ['sweet potato', 'shakarkandi'],
  'cucumber': ['cucumber', 'kheera'],
  'tomato': ['tomato', 'tamatar'],
  'carrot': ['carrot', 'gajar'],
  'beetroot': ['beetroot', 'beet', 'chukandar'],
  'green-tea': ['green tea'],
  'black-coffee': ['black coffee', 'coffee'],
  'chai': ['chai', 'tea', 'milk tea'],
  'coconut-water': ['coconut water', 'nariyal pani'],
  'lemon-water': ['lemon water', 'nimbu pani', 'lime water'],
  'whey-isolate': ['protein shake', 'whey', 'protein powder', 'protein scoop', 'shake'],
  'overnight-oats': ['overnight oats'],
  'smoothie-berry': ['smoothie', 'berry smoothie', 'fruit smoothie'],
  'seed-mix': ['seed mix', 'mixed seeds', 'seeds mix'],
  'egg-toast': ['egg toast', 'egg on toast', 'eggs on toast'],
  'dal-sabzi-roti': ['dal roti', 'dal sabzi roti', 'dal sabzi', 'sabzi roti', 'dal chawal roti'],
  'khichdi': ['khichdi', 'khichri'],
  'curd-rice': ['curd rice', 'dahi chawal'],
  'upma': ['upma', 'uppma'],
  'idli': ['idli', 'idlis'],
  'dosa-plain': ['dosa', 'plain dosa', 'sada dosa'],
  'peanut-butter': ['peanut butter', 'pb'],
  'honey': ['honey', 'shahad'],
  'jaggery': ['jaggery', 'gur', 'gud'],
  'guava': ['guava', 'amrud'],
  'papaya': ['papaya', 'papita'],
  'muesli': ['muesli', 'granola'],
};

function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectMealType(text: string): MealType {
  const lower = text.toLowerCase();
  for (const [meal, keywords] of Object.entries(MEAL_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return meal as MealType;
    }
  }
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'snack';
  return 'dinner';
}

function extractQuantity(text: string, _foodName: string): number {
  const nearbyText = text.toLowerCase();

  if (/\bhalf\b/i.test(nearbyText)) return 0.5;
  if (/\bquarter\b/i.test(nearbyText)) return 0.25;
  if (/\bdouble\b|two\b|2\b/i.test(nearbyText)) return 2;
  if (/\btriple\b|three\b|3\b/i.test(nearbyText)) return 3;

  for (const pattern of QUANTITY_PATTERNS) {
    const match = nearbyText.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }

  return 1;
}

function findFoodMatch(segment: string, allFoods: FoodItem[]): { food: FoodItem; confidence: 'high' | 'medium' | 'low' } | null {
  const normalized = normalizeText(segment);

  for (const [foodId, aliases] of Object.entries(FOOD_ALIASES)) {
    for (const alias of aliases) {
      if (normalized.includes(alias)) {
        const food = allFoods.find(f => f.id === foodId);
        if (food) {
          const exactMatch = aliases.some(a => normalized.includes(a) && a.length > 3);
          return { food, confidence: exactMatch ? 'high' : 'medium' };
        }
      }
    }
  }

  for (const food of allFoods) {
    const foodNameLower = food.name.toLowerCase();
    const foodWords = foodNameLower.split(/[\s/()]+/).filter(w => w.length > 2);
    const matchedWords = foodWords.filter(w => normalized.includes(w));
    if (matchedWords.length >= 2 || (matchedWords.length === 1 && matchedWords[0].length > 4)) {
      return { food, confidence: matchedWords.length >= 2 ? 'medium' : 'low' };
    }
  }

  return null;
}

export function parseFoodInput(text: string, customFoods: FoodItem[] = []): ParsedFoodEntry[] {
  const allFoods = [...foodDatabase, ...customFoods];
  const results: ParsedFoodEntry[] = [];
  const usedFoodIds = new Set<string>();

  const sections = text.split(/(?:breakfast|lunch|snack|dinner|morning|afternoon|evening|night)[:\s-]*/i);
  const mealMarkers = text.match(/(?:breakfast|lunch|snack|dinner|morning|afternoon|evening|night)/gi) || [];

  if (sections.length <= 1) {
    const mealType = detectMealType(text);
    const segments = text.split(/[,;\n]+|(?:\band\b)|(?:\bwith\b)|(?:\bplus\b)|(?:\balso\b)/i);

    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed || trimmed.length < 2) continue;

      const match = findFoodMatch(trimmed, allFoods);
      if (match && !usedFoodIds.has(match.food.id)) {
        const quantity = extractQuantity(trimmed, match.food.name);
        usedFoodIds.add(match.food.id);
        results.push({
          food: match.food,
          quantity,
          mealType,
          matchedText: trimmed,
          confidence: match.confidence,
        });
      }
    }
  } else {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section.trim()) continue;

      let mealType: MealType;
      if (i > 0 && mealMarkers[i - 1]) {
        mealType = detectMealType(mealMarkers[i - 1]);
      } else {
        mealType = detectMealType(section);
      }

      const segments = section.split(/[,;\n]+|(?:\band\b)|(?:\bwith\b)|(?:\bplus\b)|(?:\balso\b)/i);

      for (const segment of segments) {
        const trimmed = segment.trim();
        if (!trimmed || trimmed.length < 2) continue;

        const match = findFoodMatch(trimmed, allFoods);
        if (match && !usedFoodIds.has(match.food.id)) {
          const quantity = extractQuantity(trimmed, match.food.name);
          usedFoodIds.add(match.food.id);
          results.push({
            food: match.food,
            quantity,
            mealType,
            matchedText: trimmed,
            confidence: match.confidence,
          });
        }
      }
    }
  }

  return results;
}

export function parsedToLoggedFoods(parsed: ParsedFoodEntry[]): LoggedFood[] {
  return parsed.map(entry => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    foodId: entry.food.id,
    name: entry.food.name,
    quantity: entry.quantity,
    servingUnit: entry.food.servingUnit,
    calories: entry.food.calories * entry.quantity,
    protein: entry.food.protein * entry.quantity,
    carbs: entry.food.carbs * entry.quantity,
    fat: entry.food.fat * entry.quantity,
    fiber: entry.food.fiber * entry.quantity,
    mealType: entry.mealType,
    timestamp: new Date().toISOString(),
  }));
}

export function parseExerciseInput(text: string): ParsedExerciseEntry[] {
  const results: ParsedExerciseEntry[] = [];
  const usedIds = new Set<string>();
  const normalized = normalizeText(text);

  const EXERCISE_ALIASES: Record<string, string[]> = {
    'walking-brisk': ['walk', 'walked', 'walking', 'brisk walk'],
    'walking-indoor': ['walk at home', 'indoor walk', 'walking in place'],
    'yoga-flow': ['yoga', 'yoga session'],
    'surya-namaskar': ['surya namaskar', 'sun salutation', 'suryanamaskar'],
    'stretching': ['stretch', 'stretching', 'stretched'],
    'pushup': ['pushup', 'push up', 'push-up', 'pushups', 'push ups'],
    'plank': ['plank', 'planks', 'plank hold'],
    'lunges': ['lunge', 'lunges'],
    'squats-bodyweight': ['squat', 'squats', 'bodyweight squat'],
    'crunches': ['crunch', 'crunches', 'abs'],
    'leg-raises': ['leg raise', 'leg raises'],
    'jumping-jacks': ['jumping jack', 'jumping jacks', 'star jumps'],
    'high-knees': ['high knees', 'high knee'],
    'mountain-climbers': ['mountain climber', 'mountain climbers'],
    'burpees': ['burpee', 'burpees'],
    'skipping': ['skipping', 'jump rope', 'jumping rope'],
    'dancing': ['dance', 'danced', 'dancing', 'dance workout', 'zumba'],
    'swimming': ['swim', 'swimming', 'swam', 'pool'],
    'rb-squat': ['banded squat', 'band squat', 'resistance band squat'],
    'rb-glute-bridge': ['glute bridge', 'hip raise', 'bridge'],
    'rb-lateral-walk': ['lateral walk', 'side walk', 'band walk'],
    'rb-bicep-curl': ['bicep curl', 'bicep curls', 'arm curl'],
    'rb-overhead-press': ['overhead press', 'shoulder press'],
    'rb-row': ['row', 'rowing', 'seated row'],
    'rb-chest-press': ['chest press'],
    'rb-deadlift': ['deadlift', 'dead lift'],
    'rb-pull-apart': ['pull apart', 'band pull'],
    'rb-kickback': ['kickback', 'glute kickback'],
    'rb-clamshell': ['clamshell', 'clam shell'],
    'rb-tricep-extension': ['tricep extension', 'tricep'],
    'hip-flexor-stretch': ['hip flexor', 'hip stretch'],
    'neck-shoulder-stretch': ['neck stretch', 'shoulder stretch'],
    'wall-sit': ['wall sit'],
    'superman': ['superman', 'back extension'],
    'cycling-stationary': ['cycling', 'cycle', 'bike', 'stationary bike'],
  };

  const segments = normalized.split(/[,;\n]+|(?:\band\b)|(?:\bthen\b)|(?:\bplus\b)|(?:\balso\b)|(?:\bdid\b)|(?:\bi did\b)/i);

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed || trimmed.length < 2) continue;

    for (const [exId, aliases] of Object.entries(EXERCISE_ALIASES)) {
      if (usedIds.has(exId)) continue;
      const matched = aliases.some(a => trimmed.includes(a));
      if (matched) {
        const exercise = exerciseDatabase.find(e => e.id === exId);
        if (exercise) {
          // Check for duration in minutes
          const durMatch = trimmed.match(/(\d+)\s*(?:min|mins|minutes|minute)/i);
          // Check for reps like "20 squats" or "squats 20"
          const repsMatchBefore = trimmed.match(/(\d+)\s+(?:reps?\s+)?(?:of\s+)?/i);
          const repsMatchAfter = trimmed.match(/(?:for\s+)?(\d+)\s*(?:reps?|times|repetitions)/i);
          // Check for seconds
          const secMatch = trimmed.match(/(\d+)\s*(?:sec|secs|seconds|second)/i);

          let duration: number;
          let reps: number | undefined;
          let sets: number | undefined;

          if (durMatch) {
            duration = parseInt(durMatch[1]);
          } else if (secMatch) {
            duration = Math.ceil(parseInt(secMatch[1]) / 60);
          } else if (repsMatchAfter) {
            reps = parseInt(repsMatchAfter[1]);
            duration = Math.max(2, Math.ceil(reps / 10));
          } else if (repsMatchBefore && !trimmed.match(/(\d+)\s*(?:min|sec|hour)/i)) {
            const num = parseInt(repsMatchBefore[1]);
            if (num <= 200) {
              reps = num;
              duration = Math.max(2, Math.ceil(reps / 10));
            } else {
              duration = 15;
            }
          } else {
            duration = 10;
          }

          // Check for sets
          const setsMatch = trimmed.match(/(\d+)\s*(?:set|sets)/i);
          if (setsMatch) {
            sets = parseInt(setsMatch[1]);
            if (!durMatch && reps) {
              duration = Math.max(2, Math.ceil((reps * sets) / 8));
            }
          }

          usedIds.add(exId);
          results.push({ exercise, duration, matchedText: trimmed, reps, sets });
        }
      }
    }
  }

  return results;
}

export function parsedToLoggedExercises(parsed: ParsedExerciseEntry[]): LoggedExercise[] {
  return parsed.map(entry => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    exerciseId: entry.exercise.id,
    name: entry.exercise.name,
    duration: entry.duration,
    caloriesBurned: Math.round(entry.exercise.caloriesPerMinute * entry.duration),
    sets: entry.sets,
    reps: entry.reps,
    timestamp: new Date().toISOString(),
  }));
}
