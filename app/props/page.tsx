'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Check, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { PropBet, PropCategory } from '@/lib/supabase/types';
import Link from 'next/link';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';

export default function PropsPage() {
  const [props, setProps] = useState<PropBet[]>([]);
  const [categories, setCategories] = useState<PropCategory[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const cleanup = setupRealtime();
    return cleanup;
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data: existingAnswers } = await supabase
          .from('prop_answers')
          .select('prop_id, answer')
          .eq('user_id', user.id);
        if (existingAnswers) {
          const answersMap: Record<string, string> = {};
          existingAnswers.forEach((a) => { answersMap[a.prop_id] = a.answer; });
          setAnswers(answersMap);
        }
      }

      const { data: catData } = await supabase
        .from('prop_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (catData) setCategories(catData);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prop_bets' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prop_categories' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const filteredProps = useMemo(() => {
    if (!selectedCategory) return props;
    return props.filter((p) => p.category_id === selectedCategory);
  }, [props, selectedCategory]);

  const answeredCount = Object.keys(answers).length;
  const totalOpenProps = props.filter((p) => p.status === 'open').length;

  const handleAnswer = async (propId: string, answer: string) => {
    if (!userId) return;
    setAnswers((prev) => ({ ...prev, [propId]: answer }));
    try {
      const supabase = createClient();
      await supabase.from('prop_answers').upsert(
        { user_id: userId, prop_id: propId, answer, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,prop_id' }
      );
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-[#232842] mx-auto mb-3" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (props.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Props Available</h2>
            <p className="text-gray-500 mb-6">Check back closer to game time.</p>
            <Link href="/" className="text-[#d4af37] font-medium hover:underline">
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20 lg:pb-0">
      <Header />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Prop Bets</h1>
            <p className="text-gray-500 mt-1">
              {answeredCount} of {totalOpenProps} answered
            </p>
          </div>

          {/* Category Tabs */}
          {categories.length > 0 && (
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 border-b border-gray-100">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "text-sm font-medium pb-2 whitespace-nowrap transition-colors",
                  selectedCategory === null
                    ? "text-gray-900 border-b-2 border-gray-900 -mb-[2px]"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "text-sm font-medium pb-2 whitespace-nowrap transition-colors",
                    selectedCategory === cat.id
                      ? "text-gray-900 border-b-2 border-gray-900 -mb-[2px]"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Props List */}
          <div className="space-y-0">
            {filteredProps.map((prop, index) => {
              const currentAnswer = answers[prop.id];
              const isLocked = prop.status !== 'open';
              const isGraded = prop.status === 'graded';
              const isCorrect = isGraded && currentAnswer?.toLowerCase() === prop.correct_answer?.toLowerCase();

              return (
                <motion.div
                  key={prop.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "py-5 border-b border-gray-100",
                    isLocked && "opacity-50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {currentAnswer ? (
                        isGraded ? (
                          isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )
                        ) : (
                          <Check className="w-5 h-5 text-[#d4af37]" />
                        )
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-gray-900 leading-relaxed">
                        {prop.question}
                        {prop.answer_type === 'over_under' && prop.over_under_line && (
                          <span className="text-gray-500 ml-1">
                            ({prop.over_under_line}{prop.over_under_unit ? ` ${prop.over_under_unit}` : ''})
                          </span>
                        )}
                      </p>

                      {/* Answer Buttons */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {prop.answer_type === 'yes_no' && (
                          <>
                            {['yes', 'no'].map((option) => (
                              <button
                                key={option}
                                onClick={() => !isLocked && handleAnswer(prop.id, option)}
                                disabled={isLocked}
                                className={cn(
                                  "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                                  currentAnswer === option
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                  isLocked && "cursor-not-allowed"
                                )}
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
                                className={cn(
                                  "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                                  currentAnswer === option
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                  isLocked && "cursor-not-allowed"
                                )}
                              >
                                {option === 'over' ? 'Over' : 'Under'}
                              </button>
                            ))}
                          </>
                        )}

                        {prop.answer_type === 'multiple_choice' && prop.options && (
                          <>
                            {prop.options.map((option) => (
                              <button
                                key={option}
                                onClick={() => !isLocked && handleAnswer(prop.id, option)}
                                disabled={isLocked}
                                className={cn(
                                  "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                                  currentAnswer === option
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                  isLocked && "cursor-not-allowed"
                                )}
                              >
                                {option}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredProps.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No props in this category
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
