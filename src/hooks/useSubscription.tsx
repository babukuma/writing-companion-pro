import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type Plan = 'free' | 'pro';

interface Subscription {
  plan: Plan;
  expiresAt: string | null;
  loading: boolean;
  isPro: boolean;
  refresh: () => Promise<void>;
}

const FREE_PAGE_LIMIT = 4;
const FREE_PROJECT_LIMIT = 1;

export function useSubscription(): Subscription {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setPlan('free');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
        setPlan(isExpired ? 'free' : (data.plan as Plan));
        setExpiresAt(data.expires_at);
      } else {
        setPlan('free');
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setPlan('free');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    plan,
    expiresAt,
    loading,
    isPro: plan === 'pro',
    refresh: fetchSubscription,
  };
}

export { FREE_PAGE_LIMIT, FREE_PROJECT_LIMIT };
