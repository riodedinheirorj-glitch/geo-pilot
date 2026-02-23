import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSubscriptionDays = () => {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("user_wallets" as any)
        .select("balance_credits")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && !error && typeof (data as any).balance_credits === 'number') {
        setDaysRemaining(Math.max(0, (data as any).balance_credits));
      } else {
        setDaysRemaining(0);
      }
      setLoading(false);
    };

    fetchCredits();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCredits();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { daysRemaining, loading };
};
