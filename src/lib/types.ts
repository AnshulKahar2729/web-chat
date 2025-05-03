export type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    name?: string;
    tool_call_id?: string;
    createdAt?: Date;
  };
  
  export type ChatRequest = {
    messages: Message[];
    searchEnabled?: boolean;
  };
  
  export type SearchResult = {
    title: string;
    url: string;
    snippet: string;
  };
  