// lib/types.ts
import { BaseSearchOptions } from "exa-js";

export type Role = 'user' | 'assistant' | 'system' | 'tool' | 'function';

// Define exaCategory based on documented Exa categories
export type exaCategory = 
  | 'company'
  | 'research paper'
  | 'news'
  | 'pdf'
  | 'github'
  | 'tweet'
  | 'personal site'
  | 'linkedin profile'
  | 'financial report'
  | BaseSearchOptions['category']; // Allow any other string values

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
  searchCategory?: exaCategory;
};

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};