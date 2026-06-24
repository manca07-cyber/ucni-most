import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Glas, ki dobro govori slovensko (večjezični ElevenLabs glas).
// Za zamenjavo posodobi samo to konstanto:
const VOICE_ID = "XB0fDUnXU5powFXDhCwa"; // Charlotte – večjezični glas
// Rezervni glas, če Charlotte ne deluje: Rachel = "21m00Tcm4TlvDq8ikWAM"
const MODEL_ID = "eleven_multilingual_v2"; // podpira slovenščino brez language_code

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const besedilo: string = body.besedilo ?? "";

    if (!besedilo.trim()) {
      return new Response(
        JSON.stringify({ error: "Manjka polje 'besedilo'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY ni nastavljen." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const elResp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text: besedilo,
          model_id: MODEL_ID,
          // eleven_multilingual_v2 zazna jezik samodejno – language_code NI potreben
          voice_settings: {
            stability: 0.50,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!elResp.ok) {
      const errText = await elResp.text().catch(() => "(ni besedila)");
      return new Response(
        JSON.stringify({
          error: `ElevenLabs napaka ${elResp.status}: ${errText}`,
          status: elResp.status,
          podrobnosti: errText,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audio = await elResp.arrayBuffer();

    return new Response(audio, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
