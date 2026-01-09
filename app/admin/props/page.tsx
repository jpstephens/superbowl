'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Flag,
  Music,
  Tv,
  TrendingUp,
  Target,
  Copy,
} from 'lucide-react';
import type { PropBet, PropCategory, PropAnswerType, PropStatus } from '@/lib/supabase/types';
import Logo from '@/components/Logo';
import Link from 'next/link';

// Category icons mapping
const CATEGORY_ICONS: Record<string, any> = {
  Flag: Flag,
  Music: Music,
  Tv: Tv,
  TrendingUp: TrendingUp,
  Target: Target,
  Sparkles: Sparkles,
};

// Default props template for quick setup
const DEFAULT_PROPS_TEMPLATE: Partial<PropBet>[] = [
  // Pre-Game
  { question: 'National anthem length', answer_type: 'over_under', over_under_line: 125, over_under_unit: 'seconds', point_value: 1 },
  { question: 'Coin toss result', answer_type: 'multiple_choice', options: ['Heads', 'Tails'], point_value: 1 },
  { question: 'Which team wins the coin toss?', answer_type: 'multiple_choice', options: ['AFC Champion', 'NFC Champion'], point_value: 1 },
  { question: 'What will the winning team choose?', answer_type: 'multiple_choice', options: ['Kick', 'Receive', 'Defer'], point_value: 1 },
  // Halftime
  { question: 'Number of songs performed at halftime', answer_type: 'over_under', over_under_line: 6.5, over_under_unit: 'songs', point_value: 1 },
  { question: 'Will there be a guest performer at halftime?', answer_type: 'yes_no', point_value: 1 },
  // Commercials
  { question: 'Will there be a cryptocurrency commercial?', answer_type: 'yes_no', point_value: 1 },
  { question: 'Number of car commercials', answer_type: 'over_under', over_under_line: 8.5, over_under_unit: 'commercials', point_value: 1 },
  // Scoring
  { question: 'First scoring play', answer_type: 'multiple_choice', options: ['Touchdown', 'Field Goal', 'Safety'], point_value: 2 },
  { question: 'Total points scored', answer_type: 'over_under', over_under_line: 49.5, over_under_unit: 'points', point_value: 1 },
  { question: 'Will there be a defensive or special teams TD?', answer_type: 'yes_no', point_value: 2 },
  { question: 'Will the game go to overtime?', answer_type: 'yes_no', point_value: 3 },
  // Game Stats
  { question: 'Combined QB passing yards', answer_type: 'over_under', over_under_line: 525.5, over_under_unit: 'yards', point_value: 1 },
  { question: 'Longest touchdown', answer_type: 'over_under', over_under_line: 35.5, over_under_unit: 'yards', point_value: 1 },
  { question: 'Will any player score 3+ TDs?', answer_type: 'yes_no', point_value: 2 },
  // Fun Props
  { question: 'Color of Gatorade dumped on winning coach', answer_type: 'multiple_choice', options: ['Orange', 'Yellow', 'Blue', 'Clear/Water', 'Red', 'Green', 'Purple', 'None'], point_value: 2 },
  { question: 'MVP position', answer_type: 'multiple_choice', options: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Defense', 'Other'], point_value: 2 },
];

/**
 * Admin Props Management Page
 * CRUD interface for creating and managing prop bets
 */
export default function AdminPropsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<PropCategory[]>([]);
  const [props, setProps] = useState<PropBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPropDialog, setShowPropDialog] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [editingProp, setEditingProp] = useState<PropBet | null>(null);
  const [gradingProp, setGradingProp] = useState<PropBet | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for new/edit prop
  const [formData, setFormData] = useState({
    category_id: '',
    question: '',
    description: '',
    answer_type: 'yes_no' as PropAnswerType,
    over_under_line: '',
    over_under_unit: '',
    options: '',
    point_value: '1',
    deadline: '',
    status: 'draft' as PropStatus,
  });

  // Grade form state
  const [gradeData, setGradeData] = useState({
    correct_answer: '',
    result_value: '',
    result_notes: '',
  });

  useEffect(() => {
    // Bypass auth for testing
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Load categories
      const { data: catData } = await supabase
        .from('prop_categories')
        .select('*')
        .order('display_order');

      if (catData) setCategories(catData);

      // Load props with category info
      const { data: propsData } = await supabase
        .from('prop_bets')
        .select(`*, category:prop_categories(*)`)
        .order('display_order');

      if (propsData) setProps(propsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewPropDialog = (categoryId?: string) => {
    setEditingProp(null);
    setFormData({
      category_id: categoryId || categories[0]?.id || '',
      question: '',
      description: '',
      answer_type: 'yes_no',
      over_under_line: '',
      over_under_unit: '',
      options: '',
      point_value: '1',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      status: 'draft',
    });
    setShowPropDialog(true);
  };

  const openEditPropDialog = (prop: PropBet) => {
    setEditingProp(prop);
    setFormData({
      category_id: prop.category_id || '',
      question: prop.question,
      description: prop.description || '',
      answer_type: prop.answer_type,
      over_under_line: prop.over_under_line?.toString() || '',
      over_under_unit: prop.over_under_unit || '',
      options: prop.options?.join(', ') || '',
      point_value: prop.point_value.toString(),
      deadline: prop.deadline ? new Date(prop.deadline).toISOString().slice(0, 16) : '',
      status: prop.status,
    });
    setShowPropDialog(true);
  };

  const openGradeDialog = (prop: PropBet) => {
    setGradingProp(prop);
    setGradeData({
      correct_answer: prop.correct_answer || '',
      result_value: prop.result_value?.toString() || '',
      result_notes: prop.result_notes || '',
    });
    setShowGradeDialog(true);
  };

  const handleSaveProp = async () => {
    setSaving(true);
    try {
      const supabase = createClient();

      const propData = {
        category_id: formData.category_id || null,
        question: formData.question,
        description: formData.description || null,
        answer_type: formData.answer_type,
        over_under_line: formData.over_under_line ? parseFloat(formData.over_under_line) : null,
        over_under_unit: formData.over_under_unit || null,
        options: formData.options ? formData.options.split(',').map((o) => o.trim()) : null,
        point_value: parseInt(formData.point_value) || 1,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : new Date().toISOString(),
        status: formData.status,
      };

      if (editingProp) {
        const { error } = await supabase
          .from('prop_bets')
          .update(propData)
          .eq('id', editingProp.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('prop_bets')
          .insert(propData);

        if (error) throw error;
      }

      await loadData();
      setShowPropDialog(false);
    } catch (error) {
      console.error('Error saving prop:', error);
      alert('Error saving prop');
    } finally {
      setSaving(false);
    }
  };

  const handleGradeProp = async () => {
    if (!gradingProp) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // Update the prop with result
      const { error: propError } = await supabase
        .from('prop_bets')
        .update({
          correct_answer: gradeData.correct_answer,
          result_value: gradeData.result_value ? parseFloat(gradeData.result_value) : null,
          result_notes: gradeData.result_notes || null,
          status: 'graded',
          graded_at: new Date().toISOString(),
        })
        .eq('id', gradingProp.id);

      if (propError) throw propError;

      // Update all answers for this prop
      const { data: answers } = await supabase
        .from('prop_answers')
        .select('id, answer')
        .eq('prop_id', gradingProp.id);

      if (answers) {
        for (const answer of answers) {
          let isCorrect = false;

          if (gradingProp.answer_type === 'over_under') {
            const resultVal = parseFloat(gradeData.result_value);
            const line = gradingProp.over_under_line || 0;
            isCorrect =
              (answer.answer === 'over' && resultVal > line) ||
              (answer.answer === 'under' && resultVal < line);
          } else {
            isCorrect = answer.answer.toLowerCase() === gradeData.correct_answer.toLowerCase();
          }

          await supabase
            .from('prop_answers')
            .update({
              is_correct: isCorrect,
              points_earned: isCorrect ? gradingProp.point_value : 0,
            })
            .eq('id', answer.id);
        }
      }

      await loadData();
      setShowGradeDialog(false);
    } catch (error) {
      console.error('Error grading prop:', error);
      alert('Error grading prop');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProp = async (propId: string) => {
    if (!confirm('Are you sure you want to delete this prop?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('prop_bets').delete().eq('id', propId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting prop:', error);
      alert('Error deleting prop');
    }
  };

  const handleLoadTemplate = async () => {
    if (!confirm('This will add default Super Bowl props. Continue?')) return;

    try {
      const supabase = createClient();
      const gameDate = new Date('2025-02-09T18:30:00-05:00');

      // Map categories
      const categoryMap: Record<string, string> = {};
      categories.forEach((cat) => {
        if (cat.name.includes('Pre-Game')) categoryMap['pre'] = cat.id;
        if (cat.name.includes('Halftime')) categoryMap['half'] = cat.id;
        if (cat.name.includes('Commercial')) categoryMap['comm'] = cat.id;
        if (cat.name.includes('Scoring')) categoryMap['score'] = cat.id;
        if (cat.name.includes('Game Stats')) categoryMap['stats'] = cat.id;
        if (cat.name.includes('Fun')) categoryMap['fun'] = cat.id;
      });

      const propsToInsert = DEFAULT_PROPS_TEMPLATE.map((template, index) => {
        // Determine category
        let categoryId = categoryMap['fun'];
        if (template.question?.includes('anthem') || template.question?.includes('coin')) {
          categoryId = categoryMap['pre'];
        } else if (template.question?.includes('halftime') || template.question?.includes('songs') || template.question?.includes('guest')) {
          categoryId = categoryMap['half'];
        } else if (template.question?.includes('commercial') || template.question?.includes('cryptocurrency')) {
          categoryId = categoryMap['comm'];
        } else if (template.question?.includes('scoring') || template.question?.includes('points') || template.question?.includes('overtime') || template.question?.includes('First scoring')) {
          categoryId = categoryMap['score'];
        } else if (template.question?.includes('yards') || template.question?.includes('TDs') || template.question?.includes('touchdown')) {
          categoryId = categoryMap['stats'];
        }

        return {
          ...template,
          category_id: categoryId,
          deadline: gameDate.toISOString(),
          status: 'open',
          display_order: index,
        };
      });

      const { error } = await supabase.from('prop_bets').insert(propsToInsert);

      if (error) throw error;
      await loadData();
      alert('Props template loaded successfully!');
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Error loading template');
    }
  };

  const getStatusBadge = (status: PropStatus) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      open: 'bg-green-100 text-green-700',
      locked: 'bg-yellow-100 text-yellow-700',
      graded: 'bg-blue-100 text-blue-700',
    };

    const icons = {
      draft: <Clock className="w-3 h-3" />,
      open: <CheckCircle2 className="w-3 h-3" />,
      locked: <XCircle className="w-3 h-3" />,
      graded: <CheckCircle2 className="w-3 h-3" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CDA33B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="small" />
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">Prop Bets Manager</h1>
                <p className="text-xs text-gray-400">Create and manage prop bets</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Prop Bets ({props.length})</h2>
              <p className="text-gray-400 text-sm mt-1">
                Create questions for participants to answer
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleLoadTemplate}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Copy className="w-4 h-4 mr-2" />
                Load Template
              </Button>
              <Button
                onClick={() => openNewPropDialog()}
                className="bg-[#CDA33B] hover:bg-[#b8922f] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Prop
              </Button>
            </div>
          </div>

          {/* Props by Category */}
          {categories.map((category) => {
            const categoryProps = props.filter((p) => p.category_id === category.id);
            const IconComponent = CATEGORY_ICONS[category.icon || 'Sparkles'] || Sparkles;

            return (
              <Card key={category.id} className="p-6 bg-gray-800 border-gray-700 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-[#CDA33B]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{category.name}</h3>
                      <p className="text-sm text-gray-400">{category.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => openNewPropDialog(category.id)}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {categoryProps.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">
                    No props in this category yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {categoryProps.map((prop) => (
                      <div
                        key={prop.id}
                        className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex-1 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium">{prop.question}</p>
                            {getStatusBadge(prop.status)}
                          </div>
                          <p className="text-sm text-gray-400">
                            {prop.answer_type === 'over_under' && (
                              <>O/U {prop.over_under_line} {prop.over_under_unit}</>
                            )}
                            {prop.answer_type === 'multiple_choice' && (
                              <>Options: {prop.options?.join(', ')}</>
                            )}
                            {prop.answer_type === 'yes_no' && 'Yes/No'}
                            {prop.answer_type === 'exact_number' && 'Exact Number'}
                            {' • '}{prop.point_value} point{prop.point_value !== 1 ? 's' : ''}
                          </p>
                          {prop.correct_answer && (
                            <p className="text-sm text-green-400 mt-1">
                              Answer: {prop.correct_answer}
                              {prop.result_value && ` (${prop.result_value})`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {prop.status !== 'graded' && (
                            <Button
                              onClick={() => openGradeDialog(prop)}
                              size="sm"
                              variant="ghost"
                              className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => openEditPropDialog(prop)}
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white hover:bg-gray-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteProp(prop.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Uncategorized Props */}
          {props.filter((p) => !p.category_id).length > 0 && (
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Uncategorized</h3>
              <div className="space-y-3">
                {props
                  .filter((p) => !p.category_id)
                  .map((prop) => (
                    <div
                      key={prop.id}
                      className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">{prop.question}</p>
                        <p className="text-sm text-gray-400">{prop.answer_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => openEditPropDialog(prop)}
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteProp(prop.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Add/Edit Prop Dialog */}
      <Dialog open={showPropDialog} onOpenChange={setShowPropDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingProp ? 'Edit Prop' : 'Add New Prop'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a question for participants to answer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Category</Label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Question</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="e.g., Will there be a safety?"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Answer Type</Label>
              <select
                value={formData.answer_type}
                onChange={(e) => setFormData({ ...formData, answer_type: e.target.value as PropAnswerType })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="yes_no">Yes/No</option>
                <option value="over_under">Over/Under</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="exact_number">Exact Number</option>
              </select>
            </div>

            {formData.answer_type === 'over_under' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Line</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.over_under_line}
                    onChange={(e) => setFormData({ ...formData, over_under_line: e.target.value })}
                    placeholder="49.5"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Unit</Label>
                  <Input
                    value={formData.over_under_unit}
                    onChange={(e) => setFormData({ ...formData, over_under_unit: e.target.value })}
                    placeholder="points"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}

            {formData.answer_type === 'multiple_choice' && (
              <div className="space-y-2">
                <Label className="text-gray-300">Options (comma separated)</Label>
                <Input
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder="Heads, Tails"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Points</Label>
                <Input
                  type="number"
                  value={formData.point_value}
                  onChange={(e) => setFormData({ ...formData, point_value: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PropStatus })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Deadline</Label>
              <Input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPropDialog(false)}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProp}
              disabled={saving || !formData.question}
              className="bg-[#CDA33B] hover:bg-[#b8922f] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Prop Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Grade Prop</DialogTitle>
            <DialogDescription className="text-gray-400">
              {gradingProp?.question}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {gradingProp?.answer_type === 'over_under' && (
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Actual Result ({gradingProp.over_under_unit})
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={gradeData.result_value}
                  onChange={(e) => setGradeData({ ...gradeData, result_value: e.target.value })}
                  placeholder={`Line was ${gradingProp.over_under_line}`}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-sm text-gray-400">
                  Line: {gradingProp.over_under_line} {gradingProp.over_under_unit}
                </p>
              </div>
            )}

            {gradingProp?.answer_type !== 'over_under' && (
              <div className="space-y-2">
                <Label className="text-gray-300">Correct Answer</Label>
                {gradingProp?.answer_type === 'yes_no' ? (
                  <select
                    value={gradeData.correct_answer}
                    onChange={(e) => setGradeData({ ...gradeData, correct_answer: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                ) : gradingProp?.answer_type === 'multiple_choice' ? (
                  <select
                    value={gradeData.correct_answer}
                    onChange={(e) => setGradeData({ ...gradeData, correct_answer: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  >
                    <option value="">Select...</option>
                    {gradingProp.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={gradeData.correct_answer}
                    onChange={(e) => setGradeData({ ...gradeData, correct_answer: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-300">Notes (optional)</Label>
              <Input
                value={gradeData.result_notes}
                onChange={(e) => setGradeData({ ...gradeData, result_notes: e.target.value })}
                placeholder="e.g., Final score was 24-21"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGradeDialog(false)}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGradeProp}
              disabled={
                saving ||
                (gradingProp?.answer_type === 'over_under'
                  ? !gradeData.result_value
                  : !gradeData.correct_answer)
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {saving ? 'Grading...' : 'Grade & Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

