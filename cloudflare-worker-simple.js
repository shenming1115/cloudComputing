// Simplified Worker for debugging

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
      // 2. Parse request body
      const body = await request.json();
      console.log("Received body:", JSON.stringify(body));
      
      const systemPrompt = body.systemPrompt || "";
      const userMessage = body.userMessage || "";
      
      // 3. Secret Header Check
      const secret = request.headers.get("X-AI-Secret");
      console.log("Received secret:", secret ? "present" : "missing");
      console.log("Expected secret:", env.AI_SECRET_KEY ? "present" : "missing");
      
      if (secret !== env.AI_SECRET_KEY) {
        return new Response(JSON.stringify({ 
          error: "Unauthorized",
          debug: {
            secretReceived: secret ? "yes" : "no",
            secretExpected: env.AI_SECRET_KEY ? "yes" : "no"
          }
        }), { 
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 4. Combine prompts
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nUser: ${userMessage}` 
        : userMessage;
      
      console.log("Full prompt length:", fullPrompt.length);

      // 5. Try Gemini only (simpler for debugging)
      console.log("Calling Gemini API...");
      console.log("Gemini API Key present:", env.GEMINI_API_KEY ? "yes" : "no");
      
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
      
      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: fullPrompt }] }] 
        })
      });

      console.log("Gemini response status:", geminiResponse.status);
      
      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error("Gemini error:", errorText);
        return new Response(JSON.stringify({ 
          error: "Gemini API Failed",
          status: geminiResponse.status,
          details: errorText.substring(0, 200)
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const geminiData = await geminiResponse.json();
      console.log("Gemini response received");
      
      const result = geminiData.candidates[0].content.parts[0].text;
      
      return new Response(JSON.stringify({ response: result }), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Worker Error:", error.message);
      console.error("Error stack:", error.stack);
      
      return new Response(JSON.stringify({ 
        error: "Worker Exception",
        message: error.message,
        type: error.name
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
