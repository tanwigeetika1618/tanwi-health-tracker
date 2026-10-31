import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Sparkles, X, Check, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { parseFoodInput, parsedToLoggedFoods, parseExerciseInput, parsedToLoggedExercises } from '../utils/foodParser';
import type { FoodItem, LoggedFood, LoggedExercise } from '../types';

interface QuickLogProps {
  onAddFoods: (foods: LoggedFood[]) => void;
  onAddExercises: (exercises: LoggedExercise[]) => void;
  customFoods: FoodItem[];
}

type LogMode = 'food' | 'exercise';

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export default function QuickLog({ onAddFoods, onAddExercises, customFoods }: QuickLogProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState<LogMode>('food');
  const [showResults, setShowResults] = useState(false);
  const [parsedFoods, setParsedFoods] = useState<ReturnType<typeof parseFoodInput>>([]);
  const [parsedExercises, setParsedExercises] = useState<ReturnType<typeof parseExerciseInput>>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i] && 'isFinal' in event.results[i] && (event.results[i] as unknown as { isFinal: boolean }).isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript = transcript;
        }
      }

      if (finalTranscript) {
        setText(prev => (prev ? prev + ', ' : '') + finalTranscript.trim());
      } else if (interimTranscript) {
        // Show interim in a visual way
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const handleParse = () => {
    if (!text.trim()) return;

    if (mode === 'food') {
      const results = parseFoodInput(text, customFoods);
      setParsedFoods(results);
    } else {
      const results = parseExerciseInput(text);
      setParsedExercises(results);
    }
    setShowResults(true);
  };

  const handleConfirm = () => {
    if (mode === 'food' && parsedFoods.length > 0) {
      onAddFoods(parsedToLoggedFoods(parsedFoods));
    } else if (mode === 'exercise' && parsedExercises.length > 0) {
      onAddExercises(parsedToLoggedExercises(parsedExercises));
    }
    setText('');
    setShowResults(false);
    setParsedFoods([]);
    setParsedExercises([]);
  };

  const removeParsedFood = (index: number) => {
    setParsedFoods(prev => prev.filter((_, i) => i !== index));
  };

  const removeParsedExercise = (index: number) => {
    setParsedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateFoodQuantity = (index: number, newQty: number) => {
    setParsedFoods(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: newQty } : item
    ));
    setEditingIndex(null);
  };

  const totalCals = parsedFoods.reduce((sum, f) => sum + f.food.calories * f.quantity, 0);
  const totalProtein = parsedFoods.reduce((sum, f) => sum + f.food.protein * f.quantity, 0);
  const totalFiber = parsedFoods.reduce((sum, f) => sum + f.food.fiber * f.quantity, 0);
  const totalExCals = parsedExercises.reduce((sum, e) => sum + e.exercise.caloriesPerMinute * e.duration, 0);

  const mealIcons = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' };

  const foodExamples = [
    'breakfast: 2 boiled eggs, 1 banana, glass of milk, 1 tbsp chia seeds',
    'had oats with milk and almonds for breakfast, then for lunch 2 roti dal sabzi with curd',
    'smoothie with banana strawberry milk and oats, plus greek yogurt with pumpkin seeds',
    'evening snack: green tea, handful of walnuts and cashews. dinner: khichdi with papad',
  ];

  const exerciseExamples = [
    '30 min yoga, 10 min stretching',
    '20 min walking, 15 min resistance band squats and glute bridges',
    'surya namaskar 15 min, plank 5 min, jumping jacks 10 min',
    'did 30 min swimming and then 10 min stretching',
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} />
          <h1 className="text-xl font-bold">Quick Log</h1>
        </div>
        <p className="text-sm opacity-90">
          Just type or speak what you had — I'll figure out the rest!
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setMode('food'); setShowResults(false); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === 'food'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-white text-gray-600 shadow-sm'
          }`}
        >
          🍽️ Log Food
        </button>
        <button
          onClick={() => { setMode('exercise'); setShowResults(false); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === 'exercise'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-white text-gray-600 shadow-sm'
          }`}
        >
          🏋️ Log Exercise
        </button>
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setShowResults(false); }}
          placeholder={mode === 'food'
            ? 'Type or speak: "breakfast: 2 eggs, banana, oats with milk. lunch: dal roti sabzi..."'
            : 'Type or speak: "30 min yoga, 10 min walking, 15 min squats..."'
          }
          className="w-full p-4 text-sm resize-none focus:outline-none min-h-[100px]"
          rows={4}
        />
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t">
          <div className="flex gap-2">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
              }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              {isListening ? 'Stop' : 'Speak'}
            </button>
            {text && (
              <button
                onClick={() => { setText(''); setShowResults(false); setParsedFoods([]); setParsedExercises([]); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-gray-100 text-gray-600"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
          <button
            onClick={handleParse}
            disabled={!text.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white disabled:opacity-40"
          >
            <Send size={14} /> Parse
          </button>
        </div>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-1.5 h-4 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-4 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <div className="w-1.5 h-5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
          </div>
          <p className="text-sm text-red-700">Listening... speak naturally in English or Hinglish</p>
        </div>
      )}

      {/* Examples */}
      <button
        onClick={() => setShowExamples(!showExamples)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-gray-500"
      >
        <span>💡 See examples of what to type/say</span>
        {showExamples ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showExamples && (
        <div className="bg-violet-50 rounded-xl p-3 space-y-2">
          {(mode === 'food' ? foodExamples : exerciseExamples).map((ex, i) => (
            <button
              key={i}
              onClick={() => { setText(ex); setShowResults(false); }}
              className="block w-full text-left text-xs text-violet-700 bg-white rounded-lg p-2.5 active:bg-violet-100"
            >
              "{ex}"
            </button>
          ))}
        </div>
      )}

      {/* Parsed Results - Food */}
      {showResults && mode === 'food' && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm text-gray-700">
              🔍 Found {parsedFoods.length} food{parsedFoods.length !== 1 ? 's' : ''}
            </h3>
            {parsedFoods.length > 0 && (
              <div className="text-xs text-gray-500">
                {Math.round(totalCals)} kcal · {Math.round(totalProtein)}g P · {Math.round(totalFiber)}g F
              </div>
            )}
          </div>

          {parsedFoods.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Couldn't match any foods. Try being more specific!</p>
              <p className="text-xs text-gray-400 mt-1">Example: "2 boiled eggs, 1 banana, glass of milk"</p>
            </div>
          ) : (
            <>
              {parsedFoods.map((entry, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-3 border ${
                    entry.confidence === 'high' ? 'bg-emerald-50 border-emerald-200' :
                    entry.confidence === 'medium' ? 'bg-amber-50 border-amber-200' :
                    'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{mealIcons[entry.mealType]}</span>
                        <span className="text-sm font-medium">{entry.food.name}</span>
                        {entry.confidence !== 'high' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            entry.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {entry.confidence === 'medium' ? '~match' : '?'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {entry.quantity} × {entry.food.servingUnit} ·{' '}
                        <span className="font-medium">{Math.round(entry.food.calories * entry.quantity)} kcal</span> ·{' '}
                        P:{(entry.food.protein * entry.quantity).toFixed(1)}g ·{' '}
                        Fiber:{(entry.food.fiber * entry.quantity).toFixed(1)}g
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">matched: "{entry.matchedText}"</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => { setEditingIndex(i); setEditQty(String(entry.quantity)); }}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white"
                      >
                        <Pencil size={12} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => removeParsedFood(i)}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white"
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  {editingIndex === i && (
                    <div className="flex items-center gap-2 mt-2">
                      <label className="text-xs text-gray-500">Qty:</label>
                      <input
                        type="number"
                        value={editQty}
                        onChange={e => setEditQty(e.target.value)}
                        className="w-16 border rounded-lg px-2 py-1 text-xs"
                        step="0.25"
                        autoFocus
                      />
                      <button
                        onClick={() => updateFoodQuantity(i, parseFloat(editQty) || 1)}
                        className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-lg"
                      >
                        Update
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Summary + Confirm */}
              <div className="bg-violet-50 rounded-xl p-3 border border-violet-200">
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div>
                    <p className="text-lg font-bold text-violet-700">{Math.round(totalCals)}</p>
                    <p className="text-[10px] text-violet-500">kcal</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-violet-700">{Math.round(totalProtein)}g</p>
                    <p className="text-[10px] text-violet-500">protein</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-violet-700">{Math.round(totalFiber)}g</p>
                    <p className="text-[10px] text-violet-500">fiber</p>
                  </div>
                </div>
                <button
                  onClick={handleConfirm}
                  className="w-full bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:bg-violet-700"
                >
                  <Check size={16} /> Log All ({parsedFoods.length} items)
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Parsed Results - Exercise */}
      {showResults && mode === 'exercise' && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm text-gray-700">
              🔍 Found {parsedExercises.length} exercise{parsedExercises.length !== 1 ? 's' : ''}
            </h3>
            {parsedExercises.length > 0 && (
              <span className="text-xs text-gray-500">~{Math.round(totalExCals)} kcal burned</span>
            )}
          </div>

          {parsedExercises.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Couldn't match any exercises. Try being more specific!</p>
              <p className="text-xs text-gray-400 mt-1">Example: "30 min yoga, 10 min walking"</p>
            </div>
          ) : (
            <>
              {parsedExercises.map((entry, i) => (
                <div key={i} className="bg-orange-50 rounded-xl p-3 border border-orange-200 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{entry.exercise.name}</p>
                    <p className="text-xs text-orange-600">
                      {entry.duration} min · ~{Math.round(entry.exercise.caloriesPerMinute * entry.duration)} kcal burned
                    </p>
                    <p className="text-[10px] text-gray-400">"{entry.matchedText}"</p>
                  </div>
                  <button
                    onClick={() => removeParsedExercise(i)}
                    className="p-1.5 rounded-lg bg-white/80"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))}

              <button
                onClick={handleConfirm}
                className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:bg-orange-600"
              >
                <Check size={16} /> Log All ({parsedExercises.length} exercises)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
