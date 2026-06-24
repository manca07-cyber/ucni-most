# Namestitev funkcije "govor" prek Supabase urejevalnika

## Pred namestitvijo

Prepričaj se, da imaš v Supabase shranjen API ključ ElevenLabs:

1. Odpri [Supabase nadzorno ploščo](https://supabase.com/dashboard)
2. Izberi projekt `qjqdaqanymqlgzlknbas`
3. Klikni **Edge Functions** v levem meniju
4. Klikni **Secrets** (ali pojdi na Settings → Edge Functions → Secrets)
5. Dodaj skrivnost:
   - **Ime:** `ELEVENLABS_API_KEY`
   - **Vrednost:** tvoj ElevenLabs API ključ

---

## Namestitev funkcije prek urejevalnika v brskalniku

### Korak 1 – Odpri urejevalnik

1. V levem meniju klikni **Edge Functions**
2. Klikni gumb **New Function** (zgoraj desno)
3. Kot ime vnesi: `govor`
4. Klikni **Create Function**

### Korak 2 – Prilepi kodo

1. V urejevalniku izbriši vso obstoječo kodo (Ctrl+A, Delete)
2. Prilepi celotno vsebino datoteke `supabase/functions/govor/index.ts`

Koda je v tej datoteki:
```
supabase/functions/govor/index.ts
```

### Korak 3 – Namesti funkcijo

1. Klikni gumb **Deploy** (ali **Save and Deploy**)
2. Počakaj, da se namestitev zaključi (navadno 10–30 sekund)
3. Ko vidiš zeleni status, je funkcija aktivna

### Korak 4 – Preizkusi

Funkcija bo dostopna na naslovu:
```
https://qjqdaqanymqlgzlknbas.supabase.co/functions/v1/govor
```

Preizkusi z orodjem kot je curl:
```bash
curl -X POST https://qjqdaqanymqlgzlknbas.supabase.co/functions/v1/govor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TVOJ_ANON_KLJUC" \
  -d '{"besedilo":"Pozdravljeni!"}' \
  --output test.mp3
```

---

## Zamenjava glasu ali modela

V datoteki `index.ts` sta dve konstanti na vrhu:

```typescript
const VOICE_ID = "XB0fDUnXU5powFXDhCwa"; // Charlotte – večjezični glas
const MODEL_ID = "eleven_turbo_v2_5";      // zamenjaj z "eleven_flash_v2_5"
```

- Za drug glas poišči ID na [ElevenLabs Voice Library](https://elevenlabs.io/voice-library) in zamenjaj `VOICE_ID`
- Če `eleven_turbo_v2_5` ne deluje, zamenjaj z `eleven_flash_v2_5`

---

## Anon ključ za index.html

V `index.html` je konstanta:
```javascript
const SUPABASE_ANON_KEY = 'TUKAJ_PRILEPI_ANON_KLJUC';
```

Anon ključ najdeš v Supabase: **Settings → API → Project API keys → anon public**
