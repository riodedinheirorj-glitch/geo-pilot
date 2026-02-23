import { supabase } from "@/integrations/supabase/client";

export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data.role;
  } catch {
    return null;
  }
}


export async function createCreditPurchase(params: { user_id: string; credits: number; amount: number; gateway_charge_id?: string }) {
  return supabase.from("credit_purchases").insert(params as any).select().single();
}
