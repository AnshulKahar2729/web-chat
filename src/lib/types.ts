// types.ts

import { BaseSearchOptions } from "exa-js";

export type Role = 'user' | 'assistant' | 'system' | 'tool' | 'function';

export type exaCategory = BaseSearchOptions['category'];

export type Message = {
    id: string;
    role: Role;
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
  