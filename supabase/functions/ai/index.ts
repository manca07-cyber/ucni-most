import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { besedilo, navodilo, slika, mediaType } = await req.json();

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY ni nastavljen' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let messageContent;

    if (slika) {
      // Način OCR: preberi besedilo iz slike
      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType || 'image/jpeg',
            data: slika,
          },
        },
        {
          type: 'text',
          text: 'Natančno prepiši vse besedilo s te slike v slovenščini. Ohrani naravni vrstni red branja (od leve proti desni, od zgoraj navzdol). Pravilno upoštevaj šumnike (č, š, ž). Vrni samo golo prepisano besedilo brez kakršnih koli komentarjev, razlag ali uvoda.',
        },
      ];
    } else {
      // Obstoječi način: besedilna zahteva
      messageContent = `${navodilo}\n\n${besedilo}`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: slika ? 4000 : 1500,
        system: 'Vedno odgovarjaj izključno v slovenščini in uporabljaj samo slovensko latinico (vključno s č, š, ž). Nikoli ne uporabljaj cirilice ali besed iz drugih jezikov (npr. srbščine, hrvaščine); lastna imena in izraze zapiši v latinici. Besedilo piši v navadni, čisti obliki brez oblikovanja markdown — brez lojtr (#, ##), brez zvezdic (* in **), brez krepkega ali ležečega besedila in brez naštevanj z znaki (-, •). Piši v polnih, preprostih povedih. Kadar je za nalogo izrecno zahtevan JSON, vrni veljaven JSON, pri čemer naj bo besedilo znotraj vrednosti prav tako v čisti slovenščini brez markdown oznak.',
        messages: [
          {
            role: 'user',
            content: messageContent,
          },
        ],
      }),
    });

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
