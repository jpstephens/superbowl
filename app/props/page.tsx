'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  Check,
  Shuffle,
  Trophy,
  Flag,
  Music,
  Tv,
  TrendingUp,
  Target,
  Sparkles,
  AlertCircle,
  ChevronLeft,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { PropBet, PropCategory } from '@/lib/supabase/types';
import Link from 'next/link';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Flag: Flag,
  Music: Music,
  Tv: Tv,
  TrendingUp: TrendingUp,
  Target: Target,
  Sparkles: Sparkles,
};

/**
 * Props Page - Grid Layout with Categories
 * All props visible at once, grouped by category, live updates
 */
export default function PropsPage() {
  const [props, setProps] = useState<PropBet[]>([]);
  const [categories, setCategories] = useState<PropCategory[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [propPrice, setPropPrice] = useState<number>(0); // One-time entry fee for all props

  useEffect(() => {
    loadData();
    setupRealtime();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        const { data: existingAnswers } = await supabase
          .from('prop_answers')
          .select('prop_id, answer')
          .eq('user_id', user.id);

        if (existingAnswers) {
          const answersMap: Record<string, string> = {};
          existingAnswers.forEach((a) => {
            answersMap[a.prop_id] = a.answer;
          });
          setAnswers(answersMap);
        }
      }

      // Load settings
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .eq('key', 'prop_price');

      if (settings?.[0]?.value) {
        setPropPrice(parseFloat(settings[0].value) || 0);
      }

      // Load categories
      const { data: catData } = await supabase
        .from('prop_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (catData) setCategories(catData);

      // Load props
      const { data: propsData } = await supabase
        .from('prop_bets')
        .select(`*, category:prop_categories(*)`)
        .in('status', ['open', 'locked', 'graded'])
        .order('display_order');

      if (propsData) setProps(propsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const supabase = createClient();

    const channel = supabase
      .channel('props_updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'prop_bets' },
        () => loadData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'prop_categories' },
        () => loadData()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const filteredProps = useMemo(() => {
    if (!selectedCategory) return props;
    return props.filter((p) => p.category_id === selectedCategory);
  }, [props, selectedCategory]);

  const answeredCount = Object.keys(answers).length;
  const totalOpenProps = props.filter((p) => p.status === 'open').length;
  const progress = totalOpenProps > 0 ? (answeredCount / totalOpenProps) * 100 : 0;

  const handleAnswer = async (propId: string, answer: string) => {
    if (!userId) return;
    setAnswers((prev) => ({ ...prev, [propId]: answer }));

    try {
      const supabase = createClient();
      await supabase.from('prop_answers').upsert(
        {
          user_id: userId,
          prop_id: propId,
          answer,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,prop_id' }
      );
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleQuickPick = () => {
    const newAnswers = { ...answers };
    const openProps = props.filter(p => p.status === 'open');

    openProps.forEach((prop) => {
      if (!newAnswers[prop.id]) {
        if (prop.answer_type === 'yes_no') {
          newAnswers[prop.id] = Math.random() > 0.5 ? 'yes' : 'no';
        } else if (prop.answer_type === 'over_under') {
          newAnswers[prop.id] = Math.random() > 0.5 ? 'over' : 'under';
        } else if (prop.answer_type === 'multiple_choice' && prop.options) {
          const randomIndex = Math.floor(Math.random() * prop.options.length);
          newAnswers[prop.id] = prop.options[randomIndex];
        }
      }
    });

    setAnswers(newAnswers);
    Object.entries(newAnswers).forEach(([propId, answer]) => {
      handleAnswer(propId, answer);
    });
  };

  const renderPropRow = (prop: PropBet, index: number) => {
    const currentAnswer = answers[prop.id];
    const isLocked = prop.status !== 'open';
    const isGraded = prop.status === 'graded';
    const isCorrect = isGraded && currentAnswer?.toLowerCase() === prop.correct_answer?.toLowerCase();

    return (
      <motion.tr
        key={prop.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.02 }}
        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
          isLocked ? 'opacity-60' : ''
        } ${isGraded && isCorrect ? 'bg-green-50/50' : ''} ${isGraded && currentAnswer && !isCorrect ? 'bg-red-50/30' : ''}`}
      >
        {/* Number */}
        <td className="py-4 px-4 text-center text-base text-gray-400 font-semibold w-14">
          {index + 1}
        </td>

        {/* Question */}
        <td className="py-4 px-4">
          <div className="text-base font-semibold text-[#232842] leading-snug">
            {prop.question}
          </div>
          {prop.description && (
            <div className="text-sm text-gray-500 mt-1">{prop.description}</div>
          )}
          {prop.answer_type === 'over_under' && (
            <div className="text-sm text-[#d4af37] font-semibold mt-1">
              Line: {prop.over_under_line} {prop.over_under_unit}
            </div>
          )}
        </td>

        {/* Category - hidden on mobile */}
        <td className="py-4 px-4 hidden md:table-cell">
          <span className="text-sm text-gray-500 font-medium">
            {prop.category?.name || 'General'}
          </span>
        </td>

        {/* Points */}
        <td className="py-4 px-4 text-center hidden sm:table-cell">
          <span className="text-base font-bold text-[#d4af37]">
            {prop.point_value}
          </span>
        </td>

        {/* Answer Options */}
        <td className="py-4 px-4">
          <div className="flex gap-2 justify-end flex-wrap">
            {prop.answer_type === 'yes_no' && (
              <>
                {['yes', 'no'].map((option) => (
                  <button
                    key={option}
                    onClick={() => !isLocked && handleAnswer(prop.id, option)}
                    disabled={isLocked}
                    className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all min-w-[70px] ${
                      currentAnswer === option
                        ? 'bg-[#d4af37] text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-[#232842]'
                    } ${isLocked ? 'cursor-not-allowed' : ''}`}
                  >
                    {option === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </>
            )}

            {prop.answer_type === 'over_under' && (
              <>
                {['over', 'under'].map((option) => (
                  <button
                    key={option}
                    onClick={() => !isLocked && handleAnswer(prop.id, option)}
                    disabled={isLocked}
                    className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all min-w-[70px] ${
                      currentAnswer === option
                        ? 'bg-[#d4af37] text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-[#232842]'
                    } ${isLocked ? 'cursor-not-allowed' : ''}`}
                  >
                    {option === 'over' ? 'Over' : 'Under'}
                  </button>
                ))}
              </>
            )}

            {prop.answer_type === 'multiple_choice' && prop.options && (
              <div className="flex flex-wrap gap-2 justify-end max-w-[280px]">
                {prop.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => !isLocked && handleAnswer(prop.id, option)}
                    disabled={isLocked}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      currentAnswer === option
                        ? 'bg-[#d4af37] text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-[#232842]'
                    } ${isLocked ? 'cursor-not-allowed' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="py-4 px-4 text-center w-24">
          {currentAnswer ? (
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
              isGraded
                ? (isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500')
                : 'bg-[#d4af37]/10 text-[#d4af37]'
            }`}>
              {isGraded ? (
                isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
              ) : (
                <Check className="w-5 h-5" />
              )}
            </span>
          ) : (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-current" />
            </span>
          )}
        </td>
      </motion.tr>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="rounded-full h-12 w-12 border-2 border-[#d4af37] border-t-transparent mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-gray-500 text-lg">Loading props...</p>
        </div>
      </div>
    );
  }

  if (props.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 border-b border-[#1a1f33] bg-[#232842] shadow-lg">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2 text-gray-300 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-base font-medium">Back</span>
            </Link>
          </div>
        </header>
        <main className="flex items-center justify-center p-4 min-h-[80vh]">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center max-w-md">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-[#232842] mb-2">No Props Available</h2>
            <p className="text-gray-500 text-lg mb-6">
              Prop bets haven't been set up yet. Check back closer to game time!
            </p>
            <Link href="/" className="inline-flex items-center gap-2 bg-[#d4af37] text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-[#e5c65c] transition-colors shadow-md">
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#1a1f33] bg-[#232842] shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-base font-medium">Back</span>
            </Link>
            <h1 className="font-bold text-xl text-white">Prop Bets</h1>
            <button
              onClick={handleQuickPick}
              className="flex items-center gap-2 px-4 py-2 bg-[#d4af37] hover:bg-[#e5c65c] text-[#232842] rounded-lg text-sm font-bold transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline">Random</span>
            </button>
          </div>
        </div>
      </header>

      {/* Progress & Stats Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Entry Fee Info */}
          {propPrice > 0 && (
            <div className="mb-4 p-3 bg-[#d4af37]/10 rounded-lg border border-[#d4af37]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-sm font-medium text-[#232842]">
                    ${propPrice} one-time entry fee for all {props.length} props
                  </span>
                </div>
                <span className="text-xs text-gray-500">Points = Prizes!</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-500 font-medium">Your Progress</div>
              <div className="text-2xl font-bold text-[#232842]">
                {answeredCount} <span className="text-lg text-gray-400 font-normal">/ {totalOpenProps}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 font-medium">Total Props</div>
              <div className="text-2xl font-bold text-[#232842]">{props.length}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 font-medium">Completion</div>
              <div className="text-2xl font-bold text-[#d4af37]">{Math.round(progress)}%</div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#d4af37] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-[#d4af37] text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-[#232842] hover:bg-gray-200'
              }`}
            >
              All ({props.length})
            </button>
            {categories.map((cat) => {
              const IconComponent = CATEGORY_ICONS[cat.icon || 'Sparkles'] || Sparkles;
              const count = props.filter(p => p.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#d4af37] text-white'
                      : 'bg-gray-100 text-gray-600 hover:text-[#232842] hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Props Table */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#232842] border-b border-[#1a1f33]">
                <tr>
                  <th className="py-4 px-4 text-left text-sm font-bold text-white uppercase tracking-wider w-14">
                    #
                  </th>
                  <th className="py-4 px-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    Question
                  </th>
                  <th className="py-4 px-4 text-left text-sm font-bold text-white uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-bold text-white uppercase tracking-wider hidden sm:table-cell w-20">
                    Pts
                  </th>
                  <th className="py-4 px-4 text-right text-sm font-bold text-white uppercase tracking-wider">
                    Your Answer
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-bold text-white uppercase tracking-wider w-24">
                    Saved
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredProps.map((prop, index) => renderPropRow(prop, index))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filteredProps.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500">No props in this category</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#d4af37]/10 flex items-center justify-center">
              <Check className="w-4 h-4 text-[#d4af37]" />
            </span>
            <span className="font-medium">Saved</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </span>
            <span className="font-medium">Correct</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500" />
            </span>
            <span className="font-medium">Wrong</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            </span>
            <span className="font-medium">Not answered</span>
          </div>
        </div>

        {/* Auto-save notice */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 font-medium">
            Your answers are automatically saved when you select them
          </p>
        </div>
      </main>

      {/* Entry Fee Banner - One-time fee for all props */}
      {propPrice > 0 && !userId && (
        <div className="fixed bottom-16 left-0 right-0 lg:bottom-0 bg-white border-t border-gray-200 shadow-lg px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#d4af37]/10 rounded-lg">
                <Trophy className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#232842]">
                  ${propPrice} Entry Fee - Play All {props.length} Props
                </div>
                <div className="text-xs text-gray-500">
                  One-time fee to compete for prizes. Answer all props and win points!
                </div>
              </div>
            </div>
            <Link
              href="/payment?type=props"
              className="px-5 py-2.5 bg-[#d4af37] text-white rounded-xl text-sm font-bold whitespace-nowrap hover:bg-[#e5c65c] transition-colors shadow-md"
            >
              Pay & Play
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
