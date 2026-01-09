'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PurchaseActivity } from '@/lib/supabase/types';
import { Clock } from 'lucide-react';
import { ActivitySkeleton } from '@/components/SkeletonLoader';

export default function ActivityFeed() {
  const [activities, setActivities] = useState<PurchaseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivity();
    
    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('purchase_activity')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_activity',
        },
        (payload) => {
          loadActivity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadActivity = async () => {
    try {
      setError(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('purchase_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) setActivities(data);
    } catch (error) {
      console.error('Error loading activity:', error);
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivitySkeleton />;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error}
        <button onClick={loadActivity} className="ml-2 text-blue-600 underline">
          Retry
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return <div className="text-sm text-gray-500">No activity yet</div>;
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-2">
      {activities.slice(0, 5).map((activity) => (
        <div key={activity.id} className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-gray-900">{activity.user_name}</span>
            <span className="text-gray-600"> purchased </span>
            <span className="font-semibold text-gray-900">{activity.square_count} {activity.square_count === 1 ? 'square' : 'squares'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
            {formatTime(activity.created_at)}
          </div>
        </div>
      ))}
    </div>
  );
}

