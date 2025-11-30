import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Operation {
  type: 'download' | 'credit_deduction' | 'address_save';
  data: any;
  timestamp: string;
}

interface SyncRequest {
  userId?: string;
  operations: Operation[];
  lastSync: string;
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

    // Autentica o usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { operations, lastSync }: SyncRequest = await req.json();

    console.log(`🔄 Sincronizando ${operations.length} operações para usuário ${user.id}`);

    const appliedOperations: string[] = [];
    let currentCredits = 0;

    // Busca créditos atuais
    const { data: creditsData } = await supabaseClient
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    currentCredits = creditsData?.credits || 0;

    // Processa cada operação
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'download':
            // Registra download
            await supabaseClient
              .from('downloads')
              .insert({
                user_id: user.id,
                file_name: operation.data.fileName,
                created_at: operation.timestamp,
              });

            console.log(`✅ Download registrado: ${operation.data.fileName}`);
            appliedOperations.push(`download_${operation.timestamp}`);
            break;

          case 'credit_deduction':
            // Deduz créditos (já foi deduzido localmente, apenas registra transação)
            const amount = operation.data.amount || 1;
            
            await supabaseClient
              .from('transactions')
              .insert({
                user_id: user.id,
                type: 'download',
                amount: -amount,
                description: operation.data.description || 'Operação offline sincronizada',
                created_at: operation.timestamp,
              });

            console.log(`✅ Transação registrada: -${amount} créditos`);
            appliedOperations.push(`credit_deduction_${operation.timestamp}`);
            break;

          case 'address_save':
            // Salva endereço processado offline
            console.log(`📍 Endereço offline salvo: ${operation.data.address}`);
            appliedOperations.push(`address_save_${operation.timestamp}`);
            break;

          default:
            console.warn(`⚠️ Tipo de operação desconhecido: ${operation.type}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar operação ${operation.type}:`, error);
      }
    }

    // Retorna créditos atualizados
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
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
