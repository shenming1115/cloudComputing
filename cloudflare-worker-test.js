// Ultra-simple test worker - just echo back

export default {
    async fetch(request, env) {
        if (request.method !== "POST") {
            return new Response(JSON.stringify({ error: "Use POST" }), {
                status: 405,
                headers: { "Content-Type": "application/json" }
            });
        }

        try {
            const body = await request.json();
            const secret = request.headers.get("X-AI-Secret");

            // Just echo back what we received
            return new Response(JSON.stringify({
                response: "Test successful! Received: " + body.userMessage,
                debug: {
                    secretReceived: secret === env.AI_SECRET_KEY,
                    geminiKeyPresent: !!env.GEMINI_API_KEY,
                    openaiKeyPresent: !!env.OPENAI_API_KEY
                }
            }), {
                headers: { "Content-Type": "application/json" }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                error: error.message
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    }
};
