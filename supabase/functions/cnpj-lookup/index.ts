import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CNPJData {
  nome: string;
  fantasia: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  situacao: string;
  cnpj: string;
  abertura: string;
  natureza_juridica: string;
  atividade_principal: Array<{ code: string; text: string }>;
}

interface TransformedCNPJData {
  name: string;
  tradeName: string;
  address: string;
  streetNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  phone: string;
  email: string;
  status: string;
  cnpj: string;
  openingDate: string;
  legalNature: string;
  mainActivity: string;
}

function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

function transformData(data: CNPJData): TransformedCNPJData {
  return {
    name: data.nome || '',
    tradeName: data.fantasia || '',
    address: data.logradouro || '',
    streetNumber: data.numero || '',
    complement: data.complemento || '',
    neighborhood: data.bairro || '',
    city: data.municipio || '',
    state: data.uf || '',
    cep: data.cep?.replace(/\D/g, '') || '',
    phone: data.telefone || '',
    email: data.email || '',
    status: data.situacao || '',
    cnpj: data.cnpj || '',
    openingDate: data.abertura || '',
    legalNature: data.natureza_juridica || '',
    mainActivity: data.atividade_principal?.[0]?.text || '',
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj } = await req.json();

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanedCNPJ = cleanCNPJ(cnpj);

    if (cleanedCNPJ.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'CNPJ deve ter 14 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[cnpj-lookup] Buscando CNPJ: ${cleanedCNPJ}`);

    // Call ReceitaWS API (free, no API key needed)
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanedCNPJ}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[cnpj-lookup] ReceitaWS error: ${response.status}`);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Muitas requisições. Aguarde um momento e tente novamente.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao consultar CNPJ na Receita Federal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: CNPJData = await response.json();

    // Check if CNPJ was found
    if (data.situacao === 'ERROR' || !data.nome) {
      console.log(`[cnpj-lookup] CNPJ not found: ${cleanedCNPJ}`);
      return new Response(
        JSON.stringify({ error: 'CNPJ não encontrado na Receita Federal' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transformedData = transformData(data);
    console.log(`[cnpj-lookup] Success: ${transformedData.name}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: transformedData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cnpj-lookup] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao processar a requisição' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
