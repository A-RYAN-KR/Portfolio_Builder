import { streamGenerate } from "@/lib/ai/gemini";
import { SYSTEM_PROMPT, PORTFOLIO_PROMPT_TEMPLATE, INITIAL_PROMPT_TEMPLATE, EDIT_PROMPT_TEMPLATE, RESUME_TEXT_PROMPT_TEMPLATE } from "@/lib/ai/prompts";
import {
  createConversation,
  getConversation,
  addMessage,
  updateConversation,
} from "@/lib/store/conversations";

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, resumeData, resumeText, theme, techStack, conversationId, currentCode } = body;

    if (!prompt && !resumeData && !resumeText) {
      return Response.json({ error: "Prompt, resume data, or resume text is required" }, { status: 400 });
    }

    // Determine conversation context
    let convId = conversationId;
    let conversation = convId ? getConversation(convId) : null;
    
    if (!conversation) {
      convId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const title = resumeText
        ? "Portfolio from uploaded resume"
        : resumeData
        ? `Portfolio for ${resumeData.fullName || "User"}`
        : prompt;
      conversation = createConversation(convId, title);
    }

    // Add user message
    const userMessage = resumeText
      ? "Generate a portfolio website from my uploaded resume"
      : resumeData
      ? `Generate a portfolio website for ${resumeData.fullName || "me"}`
      : prompt;
    addMessage(convId, "user", userMessage);

    // Build the AI prompt
    let aiPrompt;
    if (currentCode && prompt) {
      // Editing existing portfolio
      aiPrompt = EDIT_PROMPT_TEMPLATE(prompt, currentCode, techStack || "html");
    } else if (resumeText) {
      // Portfolio from raw resume text
      aiPrompt = RESUME_TEXT_PROMPT_TEMPLATE(resumeText, theme || "dark", techStack || "html");
    } else if (resumeData) {
      // Initial portfolio generation from structured resume data
      aiPrompt = PORTFOLIO_PROMPT_TEMPLATE(resumeData);
    } else {
      // Fallback to general prompt
      aiPrompt = INITIAL_PROMPT_TEMPLATE(prompt);
    }

    // Get conversation history (exclude current message)
    const history = conversation.messages.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = "";

          // Send conversation ID first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "conversationId", conversationId: convId })}\n\n`)
          );

          // Send status update
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "status", status: "generating" })}\n\n`)
          );

          // Stream the AI response
          for await (const chunk of streamGenerate(aiPrompt, SYSTEM_PROMPT, history)) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`)
            );
          }

          // Extract code from the response
          const codeMatch = fullResponse.match(/```html\n([\s\S]*?)```/);
          const code = codeMatch ? codeMatch[1].trim() : null;
          
          // Extract description (text before the code block)
          const descMatch = fullResponse.split("```html")[0].trim();
          const description = descMatch || "Generated portfolio website";

          // Save to conversation
          addMessage(convId, "assistant", fullResponse);
          if (code) {
            updateConversation(convId, { generatedCode: code });
          }

          // Send completion
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                code,
                description,
                conversationId: convId,
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("Stream generation error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Generation API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
