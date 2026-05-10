import {
  getConversation,
  getAllConversations,
  createConversation,
  deleteConversation,
} from "@/lib/store/conversations";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const conversation = getConversation(id);
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }
    return Response.json(conversation);
  }

  const conversations = getAllConversations();
  return Response.json(conversations);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const conversation = createConversation(id, prompt);
    return Response.json(conversation);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Conversation ID is required" }, { status: 400 });
  }

  const deleted = deleteConversation(id);
  if (!deleted) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
