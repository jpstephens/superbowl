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
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { PropBet, PropCategory } from '@/lib/supabase/types';
import Link from 'next/link';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Flag: Flag,
  Music: Music,
  Tv: Tv,
  TrendingUp: TrendingUp,
  Target: Target,
  Sparkles: Sparkles,
};

/**
 * PropCard Component - Individual prop bet card
 */
interface PropCardProps {
  prop: PropBet;
  index: number;
  currentAnswer?: string;
  onAnswer: (answer: string) => void;
}

function PropCard({ prop, index, currentAnswer, onAnswer }: PropCardProps) {
  const isLocked = prop.status !== 'open';
  const isGraded = prop.status === 'graded';
  const isCorrect = isGraded && currentAnswer?.toLowerCase() === prop.correct_answer?.toLowerCase();

  const renderAnswerButtons = () => {
    if (prop.answer_type === 'yes_no') {
      return ['yes', 'no'].map((option) => (
        <button
          key={option}
          onClick={() => !isLocked && onAnswer(option)}
          disabled={isLocked}
          className={cn(
            "px-5 py-2.5 rounded-lg text-sm font-bold transition-all min-w-[70px]",
            currentAnswer === option
              ? "bg-[#d4af37] text-white shadow-md scale-105"
              : "bg-gray-100 hover:bg-gray-200 text-[#232842]",
            isLocked && "cursor-not-allowed opacity-60"
          )}
        >
          {option === 'yes' ? 'Yes' : 'No'}
        </button>
      ));
    }

    if (prop.answer_type === 'over_under') {
      return ['over', 'under'].map((option) => (
        <button
          key={option}
          onClick={() => !isLocked && onAnswer(option)}
          disabled={isLocked}
          className={cn(
            "px-5 py-2.5 rounded-lg text-sm font-bold transition-all min-w-[70px]",
            currentAnswer === option
              ? "bg-[#d4af37] text-white shadow-md scale-105"
              : "bg-gray-100 hover:bg-gray-200 text-[#232842]",
            isLocked && "cursor-not-allowed opacity-60"
          )}
        >
          {option === 'over' ? 'Over' : 'Under'}
        </button>
      ));
    }

    if (prop.answer_type === 'multiple_choice' && prop.options) {
      return prop.options.map((option) => (
        <button
          key={option}
          onClick={() => !isLocked && onAnswer(option)}
          disabled={isLocked}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            currentAnswer === option
              ? "bg-[#d4af37] text-white shadow-md scale-105"
              : "bg-gray-100 hover:bg-gray-200 text-[#232842]",
            isLocked && "cursor-not-allowed opacity-60"
          )}
        >
          {option}
        </button>
      ));
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-5 shadow-sm transition-all hover:shadow-md",
        isLocked && "opacity-70",
        isGraded && isCorrect && "ring-2 ring-green-500 bg-green-50/30",
        isGraded && currentAnswer && !isCorrect && "ring-2 ring-red-400 bg-red-50/20"
      )}
    >
      {/* Header Row: Category Badge + Points */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {prop.category?.name || 'General'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#d4af37]">{prop.point_value} pts</span>
          {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Question */}
      <h3 className="text-base font-semibold text-[#232842] mb-2 leading-snug">
        {prop.question}
      </h3>

      {/* Description */}
      {prop.description && (
        <p className="text-sm text-gray-500 mb-3">{prop.description}</p>
      )}

      {/* Over/Under Line */}
      {prop.answer_type === 'over_under' && (
        <div className="text-sm font-semibold text-[#d4af37] mb-3">
          Line: {prop.over_under_line} {prop.over_under_unit}
        </div>
      )}

      {/* Answer Options */}
      <div className="flex flex-wrap gap-2">
        {renderAnswerButtons()}
      </div>

      {/* Status Indicator */}
      {currentAnswer && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
          {isGraded ? (
            isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500 font-medium">Incorrect</span>
              </>
            )
          ) : (
            <>
              <Check className="w-4 h-4 text-[#d4af37]" />
              <span className="text-sm text-gray-500">Saved</span>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Props Page - Card-based layout with sidebar
 */
export default function PropsPage() {
  const [props, setProps] = useState<PropBet[]>([]);
  const [categories, setCategories] = useState<PropCategory[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [propPrice, setPropPrice] = useState<number>(0);

  useEffect(() => {
    loadData();
    const cleanup = setupRealtime();
    return cleanup;
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

    return () => { supabase.removeChannel(channel); };
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
      if (!answers[propId]) {
        handleAnswer(propId, answer);
      }
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className="rounded-full h-12 w-12 border-2 border-[#d4af37] border-t-transparent mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-gray-500 text-lg">Loading props...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (props.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-[#232842] mb-2">No Props Available</h2>
            <p className="text-gray-500 text-lg mb-6">
              Prop bets haven&apos;t been set up yet. Check back closer to game time!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#d4af37] text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-[#e5c65c] transition-colors shadow-md"
            >
              Back to Home
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 lg:pb-0">
      <Header />

      <main className="flex-1 py-6">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          {/* Page Title */}
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#232842] mb-1">
              Prop Bets
            </h1>
            <p className="text-sm text-gray-500">
              Make your predictions for the big game
            </p>
          </div>

          {/* Mobile Progress Bar */}
          <div className="lg:hidden mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-gray-500 font-medium">Progress</div>
                <div className="text-lg font-bold text-[#232842]">
                  {answeredCount}<span className="text-gray-400 font-normal">/{totalOpenProps}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 font-medium">Complete</div>
                <div className="text-lg font-bold text-[#d4af37]">{Math.round(progress)}%</div>
              </div>
              <button
                onClick={handleQuickPick}
                className="px-4 py-2 bg-[#232842] text-white rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Fill
              </button>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#d4af37] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all",
                  selectedCategory === null
                    ? "bg-[#d4af37] text-white shadow-md"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
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
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all",
                      selectedCategory === cat.id
                        ? "bg-[#d4af37] text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Props Grid */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredProps.map((prop, index) => (
                    <PropCard
                      key={prop.id}
                      prop={prop}
                      index={index}
                      currentAnswer={answers[prop.id]}
                      onAnswer={(answer) => handleAnswer(prop.id, answer)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Empty Category State */}
              {filteredProps.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <p className="text-gray-500">No props in this category</p>
                </div>
              )}
            </div>

            {/* Sidebar - Desktop Only */}
            <div className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-20 space-y-4">
                {/* Progress Card */}
                <Card className="p-5 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-[#d4af37]" />
                    <h3 className="font-semibold text-[#232842]">Your Progress</h3>
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-[#232842] mb-1">
                      {answeredCount}
                      <span className="text-lg text-gray-400 font-normal">/{totalOpenProps}</span>
                    </div>
                    <div className="text-sm text-gray-500">props answered</div>
                  </div>

                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#d4af37] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="text-center mt-2 text-sm font-semibold text-[#d4af37]">
                    {Math.round(progress)}% complete
                  </div>
                </Card>

                {/* Entry Fee Card */}
                {propPrice > 0 && (
                  <Card className="p-5 bg-gradient-to-br from-[#d4af37]/5 to-white border-[#d4af37]/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-5 h-5 text-[#d4af37]" />
                      <h3 className="font-semibold text-[#232842]">Entry Fee</h3>
                    </div>
                    <div className="text-2xl font-bold text-[#232842] mb-1">${propPrice}</div>
                    <p className="text-sm text-gray-500">
                      One-time fee for all {props.length} props
                    </p>
                  </Card>
                )}

                {/* Quick Pick Button */}
                <button
                  onClick={handleQuickPick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#232842] text-white rounded-xl font-semibold hover:bg-[#3a4063] transition-colors shadow-md"
                >
                  <Shuffle className="w-5 h-5" />
                  Random Fill
                </button>

                {/* Legend */}
                <Card className="p-5 border-gray-200">
                  <h4 className="text-sm font-semibold text-[#232842] mb-3">Legend</h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#d4af37]/10 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-[#d4af37]" />
                      </span>
                      <span className="text-gray-600">Saved</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      </span>
                      <span className="text-gray-600">Correct</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                      </span>
                      <span className="text-gray-600">Incorrect</span>
                    </div>
                  </div>
                </Card>

                {/* Auto-save Notice */}
                <p className="text-xs text-center text-gray-400">
                  Answers save automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Entry Fee Banner - Show when logged out */}
      {propPrice > 0 && !userId && (
        <div className="fixed bottom-16 left-0 right-0 lg:bottom-0 bg-white border-t border-gray-200 shadow-lg px-4 py-4 z-40">
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
                  One-time fee to compete for prizes
                </div>
              </div>
            </div>
            <Link
              href="/payment?type=props"
              className="px-5 py-2.5 bg-[#d4af37] text-white rounded-xl text-sm font-bold whitespace-nowrap hover:bg-[#e5c65c] transition-colors shadow-md"
            >
              Pay &amp; Play
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
