import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed operation types
const ALLOWED_OPERATION_TYPES = ['download', 'credit_deduction', 'address_save'] as const;
type OperationType = typeof ALLOWED_OPERATION_TYPES[number];

interface Operation {
  type: OperationType;
  data: Record<string, unknown>;
  timestamp: string;
}

interface SyncRequest {
  userId?: string;
  operations: Operation[];
  lastSync: string;
}

// Validation helpers
function isValidOperationType(type: unknown): type is OperationType {
  return typeof type === 'string' && ALLOWED_OPERATION_TYPES.includes(type as OperationType);
}

function isValidTimestamp(timestamp: unknown): boolean {
  if (typeof timestamp !== 'string') return false;
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.getTime() > 0;
}

function isValidOperation(op: unknown): op is Operation {
  if (!op || typeof op !== 'object') return false;
  const operation = op as Record<string, unknown>;
  
  return (
    isValidOperationType(operation.type) &&
    isValidTimestamp(operation.timestamp) &&
    (operation.data === undefined || typeof operation.data === 'object')
  );
}

function sanitizeString(input: unknown, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

function sanitizeNumber(input: unknown, defaultValue: number = 1, max: number = 1000): number {
  if (typeof input !== 'number' || !Number.isFinite(input)) return defaultValue;
  return Math.min(Math.max(Math.round(input), 0), max);
}

function validateSyncRequest(body: unknown): { valid: boolean; errors: string[]; data?: SyncRequest } {
  const errors: string[] = [];
  
  if (!body || typeof body !== 'object') {
    errors.push('Request body must be an object');
    return { valid: false, errors };
  }

  const request = body as Record<string, unknown>;

  // Validate operations array
  if (!Array.isArray(request.operations)) {
    errors.push('operations must be an array');
    return { valid: false, errors };
  }

  if (request.operations.length > 100) {
    errors.push('Too many operations (max 100)');
    return { valid: false, errors };
  }

  const validOperations: Operation[] = [];
  for (let i = 0; i < request.operations.length; i++) {
    const op = request.operations[i];
    if (!isValidOperation(op)) {
      errors.push(`Invalid operation at index ${i}`);
    } else {
      validOperations.push(op);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      operations: validOperations,
      lastSync: typeof request.lastSync === 'string' ? request.lastSync : new Date().toISOString(),
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ status: 'error', error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ status: 'error', error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ status: 'error', error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateSyncRequest(body);
    if (!validation.valid || !validation.data) {
      console.warn('Input validation failed:', validation.errors);
      return new Response(
        JSON.stringify({ status: 'error', error: validation.errors.join('; ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { operations } = validation.data;

    console.log(`🔄 Sincronizando ${operations.length} operações para usuário ${user.id}`);

    const appliedOperations: string[] = [];
    let currentCredits = 0;

    // Fetch current credits
    const { data: creditsData } = await supabaseClient
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    currentCredits = creditsData?.credits || 0;

    // Process each validated operation
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'download': {
            const fileName = sanitizeString(operation.data?.fileName, 255);
            if (!fileName) {
              console.warn('Skipping download operation with invalid fileName');
              continue;
            }
            
            await supabaseClient
              .from('downloads')
              .insert({
                user_id: user.id,
                file_name: fileName,
                created_at: operation.timestamp,
              });

            console.log(`✅ Download registrado: ${fileName}`);
            appliedOperations.push(`download_${operation.timestamp}`);
            break;
          }

          case 'credit_deduction': {
            const amount = sanitizeNumber(operation.data?.amount, 1, 100);
            const description = sanitizeString(operation.data?.description, 500) || 'Operação offline sincronizada';
            
            await supabaseClient
              .from('transactions')
              .insert({
                user_id: user.id,
                type: 'download',
                amount: -amount,
                description,
                created_at: operation.timestamp,
              });

            console.log(`✅ Transação registrada: -${amount} créditos`);
            appliedOperations.push(`credit_deduction_${operation.timestamp}`);
            break;
          }

          case 'address_save': {
            const address = sanitizeString(operation.data?.address, 500);
            console.log(`📍 Endereço offline salvo: ${address}`);
            appliedOperations.push(`address_save_${operation.timestamp}`);
            break;
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar operação ${operation.type}:`, error);
      }
    }

    // Return updated credits
    const { data: updatedCreditsData } = await supabaseClient
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    currentCredits = updatedCreditsData?.credits || 0;

    const response = {
      status: 'ok',
      appliedOperations,
      currentCredits,
      serverTimestamp: new Date().toISOString(),
      syncedCount: appliedOperations.length,
    };

    console.log(`✅ Sincronização concluída: ${appliedOperations.length} operações aplicadas`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
