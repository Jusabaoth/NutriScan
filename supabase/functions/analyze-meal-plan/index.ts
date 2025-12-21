
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Berbagai API KEY
function getApiKeys(): string[] {
    const keys: string[] = [];
    const key1 = Deno.env.get('GEMINI_API_KEY');
    const key2 = Deno.env.get('GEMINI_API_KEY2');
    const key3 = Deno.env.get('GEMINI_API_KEY3');
    const key4 = Deno.env.get('GEMINI_API_KEY4');
    const key5 = Deno.env.get('GEMINI_API_KEY5');
    const key6 = Deno.env.get('GEMINI_API_KEY6');
    const key7 = Deno.env.get('GEMINI_API_KEY7');
    const key8 = Deno.env.get('GEMINI_API_KEY8');
    const key9 = Deno.env.get('GEMINI_API_KEY9');
    const key10 = Deno.env.get('GEMINI_API_KEY10');


    if (key1) keys.push(key1);
    if (key2) keys.push(key2);
    if (key3) keys.push(key3);
    if (key4) keys.push(key4);
    if (key5) keys.push(key5);
    if (key6) keys.push(key6);
    if (key7) keys.push(key7);
    if (key8) keys.push(key8);
    if (key9) keys.push(key9);
    if (key10) keys.push(key10);

    return keys;
}
// Call Gemini API with key rotation and retry delays
async function callGeminiWithRotation(contents: any, generationConfig: any): Promise<{ data: any, status: number }> {
    const apiKeys = getApiKeys();

    console.log(`📊 Total API keys detected: ${apiKeys.length}`);

    if (apiKeys.length === 0) {
        throw new Error('No GEMINI_API_KEY configured');
    }

    const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

    // Helper function for delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // First pass: try all keys with delay for 503
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        console.log(`🔑 Trying API key ${i + 1}/${apiKeys.length}`);

        try {
            const response = await fetch(`${geminiEndpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: generationConfig || {
                        temperature: 0.3,
                        maxOutputTokens: 8192
                    }
                })
            });

            const data = await response.json();

            // If rate limited, try next key immediately
            if (response.status === 429) {
                console.log(`⚠️ Key ${i + 1} rate limited (429), trying next...`);
                continue;
            }

            // If server overloaded, wait 2 seconds then try next
            if (response.status === 503 || response.status === 500) {
                console.log(`⚠️ Key ${i + 1} server overload (${response.status}), waiting 2s...`);
                await delay(2000);
                continue;
            }

            // Success or other client error - return result
            return { data, status: response.status };

        } catch (error) {
            console.error(`❌ Key ${i + 1} error:`, error);
            continue;
        }
    }

    // Second pass: retry with longer delays
    console.log('🔄 All keys failed, retrying with 5s delay...');
    await delay(5000);

    for (let i = 0; i < Math.min(3, apiKeys.length); i++) {
        const apiKey = apiKeys[i];
        console.log(`🔁 Retry ${i + 1}/3 with key ${i + 1}...`);

        try {
            const response = await fetch(`${geminiEndpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: generationConfig || {
                        temperature: 0.3,
                        maxOutputTokens: 8192
                    }
                })
            });

            const data = await response.json();

            if (response.status !== 429 && response.status !== 503 && response.status !== 500) {
                return { data, status: response.status };
            }

            console.log(`⚠️ Retry ${i + 1} failed (${response.status})`);
            await delay(3000);
        } catch (error) {
            console.error(`❌ Retry ${i + 1} error:`, error);
        }
    }

    // All keys exhausted
    throw new Error('All API keys exhausted or rate limited');
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { contents, generationConfig } = await req.json()

        if (!contents) {
            return new Response(
                JSON.stringify({ error: 'Contents is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Call Gemini with key rotation
        const { data, status } = await callGeminiWithRotation(contents, generationConfig);

        if (status !== 200) {
            console.error('Gemini API Error:', data)
            return new Response(
                JSON.stringify({ error: 'Gemini API Error', details: data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: status }
            )
        }

        return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})

