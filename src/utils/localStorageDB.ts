interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: any[];
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const CONVERSATIONS_KEY = 'esg_conversations';
const ATTACHMENTS_KEY_PREFIX = 'esg_attachment_';

// Conversations
export function saveConversation(conversation: Conversation): void {
  const conversations = loadAllConversations();
  const index = conversations.findIndex(c => c.id === conversation.id);
  
  if (index >= 0) {
    conversations[index] = { ...conversation, updatedAt: Date.now() };
  } else {
    conversations.push(conversation);
  }
  
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

export function loadAllConversations(): Conversation[] {
  const stored = localStorage.getItem(CONVERSATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function loadConversation(id: string): Conversation | null {
  const conversations = loadAllConversations();
  return conversations.find(c => c.id === id) || null;
}

export function deleteConversation(id: string): void {
  const conversations = loadAllConversations();
  const filtered = conversations.filter(c => c.id !== id);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
  
  // Clean up attachments
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(`${ATTACHMENTS_KEY_PREFIX}${id}_`)) {
      localStorage.removeItem(key);
    }
  });
}

// Attachments (base64 para arquivos pequenos)
export async function saveAttachmentFile(
  conversationId: string, 
  attachmentId: string, 
  file: File
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const key = `${ATTACHMENTS_KEY_PREFIX}${conversationId}_${attachmentId}`;
      
      try {
        localStorage.setItem(key, JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64
        }));
        resolve(key);
      } catch (error) {
        // Se exceder limite do localStorage, salvar apenas metadados
        console.warn('Arquivo muito grande para localStorage:', file.name);
        resolve(`memory:${attachmentId}`);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadAttachmentFile(key: string): any | null {
  if (key.startsWith('memory:')) {
    return null; // Arquivo não persistido
  }
  
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
}

export function deleteAttachmentFile(key: string): void {
  localStorage.removeItem(key);
}
