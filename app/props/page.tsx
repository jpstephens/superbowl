'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PropBet } from '@/lib/supabase/types';
import Header from '@/components/Header';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function PropsPage() {
  const [props, setProps] = useState<PropBet[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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

      const { data: propsData } = await supabase
        .from('prop_bets')
        .select('*')
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
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const handleAnswer = async (propId: string, answer: string) => {
    if (!userId) {
      setShowLoginPrompt(true);
      return;
    }

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

  const answeredCount = Object.keys(answers).length;
  const totalProps = props.filter(p => p.status === 'open').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600" />
        </div>
      </div>
    );
  }

  if (props.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <p className="text-gray-500 text-center">No props available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0">
      <Header />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign in to play</h3>
            <p className="text-gray-500 text-sm mb-4">You need to be logged in to save your answers.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <Link
                href="/auth/login"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 text-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Prop Bets</h1>
          <span className="text-sm text-gray-500">{answeredCount}/{totalProps} answered</span>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                  Question
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 w-40">
                  Your Pick
                </th>
              </tr>
            </thead>
            <tbody>
              {props.map((prop, index) => {
                const currentAnswer = answers[prop.id];
                const isLocked = prop.status !== 'open';

                const getOptions = () => {
                  if (prop.answer_type === 'yes_no') return ['Yes', 'No'];
                  if (prop.answer_type === 'over_under') return ['Over', 'Under'];
                  if (prop.answer_type === 'multiple_choice' && prop.options) return prop.options;
                  return ['Yes', 'No'];
                };

                const options = getOptions();

                return (
                  <tr
                    key={prop.id}
                    className={cn(
                      "border-b border-gray-100 last:border-b-0",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50",
                      isLocked && "opacity-50"
                    )}
                  >
                    <td className="px-4 py-4">
                      <span className="text-[15px] text-gray-900">
                        {prop.question}
                        {prop.answer_type === 'over_under' && prop.over_under_line && (
                          <span className="text-gray-400 ml-1">
                            ({prop.over_under_line}{prop.over_under_unit ? ` ${prop.over_under_unit}` : ''})
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        {options.map((option) => {
                          const optionValue = option.toLowerCase();
                          const isSelected = currentAnswer === optionValue;

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                if (!isLocked) {
                                  handleAnswer(prop.id, optionValue);
                                }
                              }}
                              disabled={isLocked}
                              className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded transition-all",
                                isSelected
                                  ? "bg-[#232842] text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                isLocked && "cursor-not-allowed"
                              )}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Answers save automatically
        </p>
      </div>
    </div>
  );
}
