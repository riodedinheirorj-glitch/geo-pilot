import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/database";

// Helper functions para queries com tipos forçados
export const supabaseTyped = supabase as any;

export async function getUserRole(userId: string) {
  const { data } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  
  return data;
}

export async function getProfiles() {
  const { data: profilesData, error: profilesError } = await (supabase as any)
    .from("profiles")
    .select("id, email, full_name");
  
  if (profilesError) return { data: null, error: profilesError };

  const userIds = profilesData.map((p: any) => p.id);
  const { data: userCreditsData, error: creditsError } = await (supabase as any)
    .from("user_credits")
    .select("user_id, credits")
    .in("user_id", userIds);

  if (creditsError) return { data: null, error: creditsError };

  const creditsMap = new Map(userCreditsData.map((uc: any) => [uc.user_id, uc.credits]));

  const profilesWithCredits = profilesData.map((profile: any) => ({
    ...profile,
    credits: creditsMap.get(profile.id) || 0,
  }));
  
  return { data: profilesWithCredits, error: null };
}

// REMOVED: getDownloads - now handled by process_download RPC
// export async function getDownloads(userId: string) { ... }

// REMOVED: insertDownload - now handled by process_download RPC
// export async function insertDownload(userId: string, fileName: string) { ... }

export async function getUserCredits(userId: string) {
  const { data, error } = await (supabase as any)
    .from("user_credits")
    .select("credits")
    .eq("user_id", userId)
    .single();
  
  if (error && error.code === 'PGRST116') { // No rows found
    return 0;
  }
  if (error) {
    console.error("Error fetching user credits:", error);
    throw error;
  }
  return data?.credits || 0;
}

// NEW: Function to call the process_download RPC
export async function processDownloadRpc(userId: string, fileName: string) {
  try {
    const { data, error } = await (supabase as any).rpc('process_download', { p_file_name: fileName });

    if (error) {
      console.error("Error calling process_download RPC:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error("Unexpected error in processDownloadRpc:", error);
    return { success: false, error: error.message || "Erro desconhecido ao processar download." };
  }
}

// REMOVED: deductCredit - now handled by process_download RPC
// export async function deductCredit(userId: string) { ... }

export async function addInitialCredits(userId: string, creditsToAdd: number) {
  const { data: userCredits, error: fetchError } = await (supabase as any)
    .from("user_credits")
    .select("credits")
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error("Error fetching user credits for initial add:", fetchError);
    return { success: false, error: fetchError.message };
  }

  const currentCredits = userCredits?.credits || 0;
  const newCredits = currentCredits + creditsToAdd;

  const { error: upsertError } = await (supabase as any)
    .from("user_credits")
    .upsert({ user_id: userId, credits: newCredits }, { onConflict: 'user_id' });

  if (upsertError) {
    console.error("Error upserting initial credits:", upsertError);
    return { success: false, error: upsertError.message };
  }

  // Register transaction
  await (supabase as any).from("transactions").insert({
    user_id: userId,
    type: "initial_signup_bonus", 
    amount: creditsToAdd,
    description: `Créditos de boas-vindas no cadastro`
  });

  return { success: true };
}

export async function createCreditPurchase(userId: string, credits: number, amountBrl: number) {
  const { data, error } = await (supabase as any)
    .from("credit_purchases")
    .insert({
      user_id: userId,
      credits,
      amount: amountBrl /* Alterado de amount_brl para amount */
    })
    .select()
    .single();
  
  return { data, error };
}

export async function getPendingPurchases() {
  const { data, error } = await (supabase as any)
    .from("credit_purchases")
    .select(`
      *,
      profiles:user_id (email, full_name)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  
  return { data, error };
}

export async function approvePurchase(purchaseId: string, adminId: string) {
  const { data: purchase } = await (supabase as any)
    .from("credit_purchases")
    .select("user_id, credits")
    .eq("id", purchaseId)
    .single();
  
  if (!purchase) return { success: false, error: "Pedido não encontrado" };
  
  // Update purchase status
  const { error: updateError } = await (supabase as any)
    .from("credit_purchases")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: adminId
    })
    .eq("id", purchaseId);
  
  if (updateError) return { success: false, error: updateError.message };
  
  // Add credits to user in user_credits table
  const { data: userCredits } = await (supabase as any)
    .from("user_credits")
    .select("credits")
    .eq("user_id", purchase.user_id)
    .single();
  
  const { error: creditsError } = await (supabase as any)
    .from("user_credits")
    .upsert({ user_id: purchase.user_id, credits: (userCredits?.credits || 0) + purchase.credits }, { onConflict: 'user_id' });
  
  if (creditsError) return { success: false, error: creditsError.message };
  
  // Register transaction
  await (supabase as any).from("transactions").insert({
    user_id: purchase.user_id,
    type: "purchase",
    amount: purchase.credits,
    description: `Compra de ${purchase.credits} créditos aprovada`
  });
  
  return { success: true };
}

export async function updateUserCredits(userId: string, amount: number, adminId: string) {
  const { data: userCredits, error: fetchError } = await (supabase as any)
    .from("user_credits")
    .select("credits")
    .eq("user_id", userId)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    return { success: false, error: fetchError.message };
  }

  const currentCredits = userCredits?.credits || 0;
  const newCredits = Math.max(0, currentCredits + amount);
  
  const { error: updateError } = await (supabase as any)
    .from("user_credits")
    .upsert({ user_id: userId, credits: newCredits }, { onConflict: 'user_id' });
  
  if (updateError) return { success: false, error: updateError.message };
  
  // Register transaction
  await (supabase as any).from("transactions").insert({
    user_id: userId,
    type: amount > 0 ? "admin_add" : "admin_remove",
    amount,
    description: `Ajuste manual de créditos pelo admin`
  });
  
  return { success: true };
}

export async function getTransactions(userId?: string) {
  let query = (supabase as any)
    .from("transactions")
    .select(`
      *,
      profiles:user_id (email, full_name)
    `)
    .order("created_at", { ascending: false });
  
  if (userId) {
    query = query.eq("user_id", userId);
  }
  
  const { data, error } = await query;
  return { data, error };
}