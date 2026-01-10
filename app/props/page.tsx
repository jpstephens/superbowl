'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, ChevronDown } from 'lucide-react';
import type { PropBet, PropCategory } from '@/lib/supabase/types';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';

export default function PropsPage() {
  const [props, setProps] = useState<PropBet[]>([]);
  const [categories, setCategories] = useState<PropCategory[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const cleanup = setupRealtime();
    return cleanup;
  }, []);

  // Auto-expand first category with unanswered props
  useEffect(() => {
    if (categories.length > 0 && expandedCategory === null) {
      const firstWithUnanswered = categories.find(cat => {
        const catProps = props.filter(p => p.category_id === cat.id && p.status === 'open');
        return catProps.some(p => !answers[p.id]);
      });
      setExpandedCategory(firstWithUnanswered?.id || categories[0]?.id || null);
    }
  }, [categories, props, answers, expandedCategory]);

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

  const propsByCategory = useMemo(() => {
    const grouped: Record<string, PropBet[]> = {};
    props.forEach(prop => {
      const catId = prop.category_id || 'uncategorized';
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push(prop);
    });
    return grouped;
  }, [props]);

  const answeredCount = Object.keys(answers).length;
  const totalOpenProps = props.filter((p) => p.status === 'open').length;

  const handleAnswer = async (propId: string, answer: string) => {
    if (!userId) return;

    // Toggle off if clicking same answer
    const currentAnswer = answers[propId];
    const newAnswer = currentAnswer === answer ? '' : answer;

    if (newAnswer) {
      setAnswers((prev) => ({ ...prev, [propId]: newAnswer }));
    } else {
      setAnswers((prev) => {
        const updated = { ...prev };
        delete updated[propId];
        return updated;
      });
    }

    try {
      const supabase = createClient();
      if (newAnswer) {
        await supabase.from('prop_answers').upsert(
          { user_id: userId, prop_id: propId, answer: newAnswer, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,prop_id' }
        );
      } else {
        await supabase.from('prop_answers')
          .delete()
          .eq('user_id', userId)
          .eq('prop_id', propId);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600" />
        </div>
      </div>
    );
  }

  if (props.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <p className="text-gray-500 text-center">No props available yet.<br />Check back closer to game time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-20 lg:pb-0">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Prop Bets</h1>
            <p className="text-sm text-gray-500">{answeredCount} of {totalOpenProps} answered</p>
          </div>
          {answeredCount === totalOpenProps && totalOpenProps > 0 && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <Check className="w-4 h-4" />
              Complete
            </div>
          )}
        </div>

        {/* Categories with Props */}
        <div className="space-y-3">
          {categories.map((category) => {
            const categoryProps = propsByCategory[category.id] || [];
            if (categoryProps.length === 0) return null;

            const isExpanded = expandedCategory === category.id;
            const answeredInCategory = categoryProps.filter(p => answers[p.id]).length;
            const openInCategory = categoryProps.filter(p => p.status === 'open').length;

            return (
              <div key={category.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <span className="text-xs text-gray-400">
                      {answeredInCategory}/{openInCategory}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-gray-400 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* Props List */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {categoryProps.map((prop) => {
                      const currentAnswer = answers[prop.id];
                      const isLocked = prop.status !== 'open';

                      return (
                        <div
                          key={prop.id}
                          className={cn(
                            "flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-50 last:border-b-0",
                            isLocked && "opacity-50"
                          )}
                        >
                          {/* Question */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] text-gray-800 leading-snug">
                              {prop.question}
                              {prop.answer_type === 'over_under' && prop.over_under_line && (
                                <span className="text-gray-400 ml-1">
                                  ({prop.over_under_line}{prop.over_under_unit ? ` ${prop.over_under_unit}` : ''})
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Toggle Buttons */}
                          <div className="flex-shrink-0">
                            {prop.answer_type === 'yes_no' && (
                              <div className="inline-flex rounded-full bg-gray-100 p-0.5">
                                <button
                                  onClick={() => !isLocked && handleAnswer(prop.id, 'yes')}
                                  disabled={isLocked}
                                  className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-full transition-all",
                                    currentAnswer === 'yes'
                                      ? "bg-gray-900 text-white shadow-sm"
                                      : "text-gray-500 hover:text-gray-700"
                                  )}
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => !isLocked && handleAnswer(prop.id, 'no')}
                                  disabled={isLocked}
                                  className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-full transition-all",
                                    currentAnswer === 'no'
                                      ? "bg-gray-900 text-white shadow-sm"
                                      : "text-gray-500 hover:text-gray-700"
                                  )}
                                >
                                  No
                                </button>
                              </div>
                            )}

                            {prop.answer_type === 'over_under' && (
                              <div className="inline-flex rounded-full bg-gray-100 p-0.5">
                                <button
                                  onClick={() => !isLocked && handleAnswer(prop.id, 'over')}
                                  disabled={isLocked}
                                  className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-full transition-all",
                                    currentAnswer === 'over'
                                      ? "bg-gray-900 text-white shadow-sm"
                                      : "text-gray-500 hover:text-gray-700"
                                  )}
                                >
                                  Over
                                </button>
                                <button
                                  onClick={() => !isLocked && handleAnswer(prop.id, 'under')}
                                  disabled={isLocked}
                                  className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-full transition-all",
                                    currentAnswer === 'under'
                                      ? "bg-gray-900 text-white shadow-sm"
                                      : "text-gray-500 hover:text-gray-700"
                                  )}
                                >
                                  Under
                                </button>
                              </div>
                            )}

                            {prop.answer_type === 'multiple_choice' && prop.options && (
                              <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                                {prop.options.map((option) => (
                                  <button
                                    key={option}
                                    onClick={() => !isLocked && handleAnswer(prop.id, option)}
                                    disabled={isLocked}
                                    className={cn(
                                      "px-2.5 py-1 text-xs font-medium rounded-full transition-all",
                                      currentAnswer === option
                                        ? "bg-gray-900 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    )}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized props */}
          {propsByCategory['uncategorized']?.length > 0 && (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100">
                <span className="font-medium text-gray-900">Other</span>
              </div>
              <div>
                {propsByCategory['uncategorized'].map((prop) => {
                  const currentAnswer = answers[prop.id];
                  const isLocked = prop.status !== 'open';

                  return (
                    <div
                      key={prop.id}
                      className={cn(
                        "flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-50 last:border-b-0",
                        isLocked && "opacity-50"
                      )}
                    >
                      <p className="flex-1 text-[14px] text-gray-800 leading-snug">{prop.question}</p>
                      <div className="inline-flex rounded-full bg-gray-100 p-0.5">
                        <button
                          onClick={() => !isLocked && handleAnswer(prop.id, 'yes')}
                          disabled={isLocked}
                          className={cn(
                            "px-3 py-1 text-xs font-medium rounded-full transition-all",
                            currentAnswer === 'yes' ? "bg-gray-900 text-white shadow-sm" : "text-gray-500"
                          )}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => !isLocked && handleAnswer(prop.id, 'no')}
                          disabled={isLocked}
                          className={cn(
                            "px-3 py-1 text-xs font-medium rounded-full transition-all",
                            currentAnswer === 'no' ? "bg-gray-900 text-white shadow-sm" : "text-gray-500"
                          )}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Auto-save notice */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Answers save automatically
        </p>
      </div>
    </div>
  );
}
