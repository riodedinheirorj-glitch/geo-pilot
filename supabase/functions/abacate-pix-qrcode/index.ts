import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && email.length <= 255 && emailRegex.test(email);
}

function isValidCellphone(cellphone: string): boolean {
  const phoneRegex = /^\d{10,11}$/;
  return typeof cellphone === 'string' && phoneRegex.test(cellphone.replace(/\D/g, ''));
}

function isValidTaxId(taxId: string): boolean {
  // CPF (11 digits) or CNPJ (14 digits)
  const cleanTaxId = taxId?.replace(/\D/g, '') || '';
  return cleanTaxId.length === 11 || cleanTaxId.length === 14;
}

function isValidAmount(amount: unknown): boolean {
  return typeof amount === 'number' && amount > 0 && amount <= 100000 && Number.isFinite(amount);
}

function isValidName(name: string): boolean {
  return typeof name === 'string' && name.trim().length >= 1 && name.length <= 200;
}

function sanitizeString(input: string, maxLength: number = 200): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { amount, name, cellphone, email, taxId, description } = body;

    // Comprehensive input validation
    const validationErrors: string[] = [];

    if (!isValidAmount(amount)) {
      validationErrors.push('Valor inválido: deve ser um número positivo até R$ 100.000');
    }

    if (!isValidName(name)) {
      validationErrors.push('Nome inválido: deve ter entre 1 e 200 caracteres');
    }

    if (!isValidCellphone(cellphone)) {
      validationErrors.push('Celular inválido: deve conter 10 ou 11 dígitos');
    }

    if (!isValidEmail(email)) {
      validationErrors.push('E-mail inválido: formato incorreto ou muito longo');
    }

    if (!isValidTaxId(taxId)) {
      validationErrors.push('CPF/CNPJ inválido: deve conter 11 ou 14 dígitos');
    }

    if (validationErrors.length > 0) {
      console.warn('Input validation failed:', validationErrors);
      return new Response(
        JSON.stringify({ error: validationErrors.join('; ') }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name, 200);
    const sanitizedEmail = sanitizeString(email, 255).toLowerCase();
    const sanitizedCellphone = cellphone.replace(/\D/g, '').slice(0, 11);
    const sanitizedTaxId = taxId.replace(/\D/g, '').slice(0, 14);
    const sanitizedDescription = description ? sanitizeString(description, 500) : undefined;

    const ABACATE_PAY_API_KEY = Deno.env.get('ABACATE_PAY_API_KEY');
    if (!ABACATE_PAY_API_KEY) {
      throw new Error('ABACATE_PAY_API_KEY não configurada');
    }

    console.log('Creating PIX QR Code for:', { amount, name: sanitizedName, email: sanitizedEmail });

    const response = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ABACATE_PAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Converter para centavos
        expiresIn: 3600, // 1 hora
        description: sanitizedDescription || `Compra de créditos - R$ ${amount}`,
        customer: {
          name: sanitizedName,
          cellphone: sanitizedCellphone,
          email: sanitizedEmail,
          taxId: sanitizedTaxId,
        },
        metadata: {
          externalId: `purchase_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        }
      }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      console.error('Abacate Pay error:', data.error);
      throw new Error(data.error?.message || 'Erro ao gerar QR Code PIX');
    }

    console.log('PIX QR Code created successfully:', data.data.id);

    return new Response(
      JSON.stringify({
        qrCodeImage: data.data.brCodeBase64,
        pixCopyPasteCode: data.data.brCode,
        transactionId: data.data.id,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error creating PIX QR Code:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
