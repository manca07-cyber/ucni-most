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
    const { besedilo, navodilo, slika, mediaType, naloga } = await req.json();

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY ni nastavljen' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let messageContent;

    // Privzeti sistemski poziv za besedilne naloge (povzetek, poenostavitev ...)
    const privzetiSystem = 'Vedno odgovarjaj izključno v slovenščini in uporabljaj samo slovensko latinico (vključno s č, š, ž). Nikoli ne uporabljaj cirilice ali besed iz drugih jezikov (npr. srbščine, hrvaščine); lastna imena in izraze zapiši v latinici. Besedilo piši v navadni, čisti obliki brez oblikovanja markdown — brez lojtr (#, ##), brez zvezdic (* in **), brez krepkega ali ležečega besedila in brez naštevanj z znaki (-, •). Piši v polnih, preprostih povedih. Kadar je za nalogo izrecno zahtevan JSON, vrni veljaven JSON, pri čemer naj bo besedilo znotraj vrednosti prav tako v čisti slovenščini brez markdown oznak.';

    let systemPrompt = privzetiSystem;
    let maxTokens = 1500;

    if (slika) {
      // Način OCR: preberi besedilo iz slike
      maxTokens = 4000;
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
    } else if (naloga === 'zlogi') {
      // Način zlogovanje: vrni isto besedilo z označenimi mejami med zlogi (znak |)
      maxTokens = 8000;
      systemPrompt = 'Si natančno orodje za zlogovanje slovenskega besedila. Tvoja edina naloga je, da v dano besedilo znotraj besed vstaviš znak | (navpična črta) kot ločilo med zlogi, po pravilih slovenskega zlogovanja, čim bolj pravilno. Stroga pravila: 1) Ne spreminjaj NIČESAR drugega — ohrani točno iste črke, velike in male črke, vsa ločila, presledke, prelome vrstic in vrstni red besed. 2) Ne popravljaj tipkarskih napak, ne dodajaj in ne odvzemaj besed. 3) Znak | vstavljaj SAMO med zloge znotraj besed; ne deli števk, ločil ali samostojnih črk. 4) Enozložne besede pusti brez |. 5) Vrni SAMO označeno besedilo kot navadno besedilo, brez kakršne koli razlage, brez uvoda, brez markdown in brez ograj s tremi nagibnimi črtami. Primeri: "celica" -> "ce|li|ca", "rastlinske" -> "rast|lin|ske".';
      messageContent = `Razdeli naslednje besedilo na zloge po zgornjih pravilih in vrni samo označeno besedilo:\n\n${besedilo}`;
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
        max_tokens: maxTokens,
        system: systemPrompt,
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
