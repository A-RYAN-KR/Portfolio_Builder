// In-memory conversation store (server-side)
// In production, this would be a database

const conversations = new Map();

export function createConversation(id, initialPrompt) {
  const conversation = {
    id,
    title: initialPrompt.slice(0, 60) + (initialPrompt.length > 60 ? "..." : ""),
    messages: [],
    generatedCode: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  conversations.set(id, conversation);
  return conversation;
}

export function getConversation(id) {
  return conversations.get(id) || null;
}

export function updateConversation(id, updates) {
  const conversation = conversations.get(id);
  if (!conversation) return null;
  
  Object.assign(conversation, updates, { updatedAt: new Date().toISOString() });
  conversations.set(id, conversation);
  return conversation;
}

export function addMessage(id, role, content) {
  const conversation = conversations.get(id);
  if (!conversation) return null;
  
  conversation.messages.push({
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  });
  conversation.updatedAt = new Date().toISOString();
  return conversation;
}

export function getAllConversations() {
  return Array.from(conversations.values())
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function deleteConversation(id) {
  return conversations.delete(id);
}
