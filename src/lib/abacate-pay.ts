import { supabase } from "@/integrations/supabase/client";

export async function generatePixQrCode(params: {
  amount: number;
  name: string;
  email: string;
  cellphone: string;
  taxId: string;
  description: string;
}): Promise<{ qrCodeImage: string; pixCopyPasteCode: string; transactionId: string }> {
  const { data, error } = await supabase.functions.invoke("abacate-pix-qrcode", { body: params });
  if (error) throw error;
  return data as any;
}

export async function checkPaymentStatus(transactionId: string): Promise<{ status: string }> {
  const { data, error } = await supabase.functions.invoke("abacate-pix-check", { body: { id: transactionId } });
  if (error) throw error;
  return data as any;
}
