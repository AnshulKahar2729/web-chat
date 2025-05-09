export interface Category {
    label: string;
    systemMessage: string;
}

export const categories: Category[] = [
    { label: 'Chat Normally', systemMessage: 'You are a helpful, conversational assistant which search the relevant data from the web and provide the best answer.' },
    { label: 'Summarize Article', systemMessage: 'You are an assistant that summarizes articles in a concise and clear way.' },
    { label: 'News', systemMessage: 'You summarize news articles and highlight key points.' },
    { label: 'Personal Site', systemMessage: 'You review and summarize personal websites or blogs.' },
    { label: 'LinkedIn Profile', systemMessage: 'You analyze LinkedIn profiles and summarize professional experience.' },
    { label: 'Explain Concept', systemMessage: 'You are an assistant that explains technical concepts in simple terms.' },
    { label: 'Generate Code', systemMessage: 'You are an assistant that generates clean and efficient code based on user requests.' },
    { label: 'SEO Content', systemMessage: 'You are an assistant that writes SEO-optimized content.' },
    { label: 'Company', systemMessage: 'You provide summaries and insights about companies and their operations.' },
    { label: 'Research Paper', systemMessage: 'You summarize and explain research papers clearly and concisely.' },
    { label: 'PDF', systemMessage: 'You read and summarize content from PDF documents.' },
    { label: 'Financial Report', systemMessage: 'You summarize and explain financial reports and key metrics.' },
]; 