export default {
    async fetch(request, env) {
        // 1. Handle non-POST requests
        if (request.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method Not Allowed. Use POST." }), {
                status: 405,
                headers: { "Content-Type": "application/json" }
            });
        }

        try {
            // 2. Parse request body - UPDATED to match Java backend format
            const { systemPrompt, userMessage } = await request.json();

            // 3. Secret Header Check (Security)
            const secret = request.headers.get("X-AI-Secret");
            if (secret !== env.AI_SECRET_KEY) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), {
                    status: 403,
                    headers: { "Content-Type": "application/json" }
                });
            }

            // 4. Combine system prompt and user message
            const fullPrompt = systemPrompt
                ? `${systemPrompt}\n\nUser: ${userMessage}`
                : userMessage;

            // 5. The Race Logic: GPT vs Gemini
            const gptRequest = fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: fullPrompt }]
                })
            })
                .then(res => res.json())
                .then(data => data.choices[0].message.content);

            const geminiRequest = fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: fullPrompt }] }]
                    })
                }
            )
                .then(res => res.json())
                .then(data => data.candidates[0].content.parts[0].text);

            // 6. Return the fastest successful result - UPDATED response format
            const result = await Promise.race([gptRequest, geminiRequest]);

            return new Response(JSON.stringify({ response: result }), {
                headers: { "Content-Type": "application/json" }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: "AI Race Failed",
                details: error.message
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    }
};
