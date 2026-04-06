import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: 'page_limit' | 'project_limit';
  onUpgraded: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaywallModal({ open, onOpenChange, reason, onUpgraded }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load payment gateway');

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Please sign in first');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/razorpay-create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create order');
      }

      const { order_id, amount, currency, key_id } = await res.json();

      const options = {
        key: key_id,
        amount,
        currency,
        name: 'ScriptCraft Pro',
        description: 'Monthly Pro Subscription - ₹100/month',
        order_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(
              `https://${projectId}.supabase.co/functions/v1/razorpay-verify-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            if (!verifyRes.ok) {
              const err = await verifyRes.json();
              throw new Error(err.error || 'Payment verification failed');
            }

            toast.success('🎉 Welcome to ScriptCraft Pro!');
            onUpgraded();
            onOpenChange(false);
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed');
          }
        },
        theme: { color: '#3b82f6' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Upgrade to Pro
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {reason === 'page_limit'
            ? 'You\'ve reached the 4-page limit on the free plan. Upgrade to write unlimited pages.'
            : 'Free plan allows only 1 project. Upgrade for unlimited projects.'}
        </p>

        <div className="mt-4 rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">Pro Plan</span>
            <span className="font-bold text-lg">₹100<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
          </div>
          <div className="space-y-2 text-sm">
            {['Unlimited projects', 'Unlimited pages', 'Cloud sync', 'All export formats', 'AI writing assistant'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleUpgrade} disabled={loading} className="w-full mt-4" size="lg">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
          Upgrade Now — ₹100/mo
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-2">
          Secure payment via Razorpay. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}
