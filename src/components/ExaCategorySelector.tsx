// components/ExaCategorySelector.tsx

import { exaCategory } from '@/lib/types';
import React from 'react';

// Define the available Exa search categories based on the API documentation

interface ExaCategorySelectorProps {
  selectedCategory: exaCategory;
  onCategoryChange: (category: exaCategory) => void;
}

// Create a display name mapping for better UI presentation
const categoryDisplayNames: Record<Exclude<exaCategory, undefined>, string> = {
  'company': 'Companies',
  'research paper': 'Research Papers',
  'news': 'News Articles',
  'pdf': 'PDF Documents',
  'github': 'GitHub Repositories',
  'tweet': 'Twitter/X Posts',
  'personal site': 'Personal Websites',
  'linkedin profile': 'LinkedIn Profiles',
  'financial report': 'Financial Reports'
};

// Create icon mapping for categories
const categoryIcons: Record<Exclude<exaCategory, undefined>, string> = {
  'company': '🏢',
  'research paper': '📄',
  'news': '📰',
  'pdf': '📑',
  'github': '💻',
  'tweet': '🐦',
  'personal site': '🌐',
  'linkedin profile': '👔',
  'financial report': '📊'
};

// Create descriptions for categories
const categoryDescriptions: Record<Exclude<exaCategory, undefined>, string> = {
  'company': 'Information about businesses and organizations',
  'research paper': 'Academic and scientific publications',
  'news': 'Recent news articles and publications',
  'pdf': 'Documents in PDF format across the web',
  'github': 'Code repositories and documentation',
  'tweet': 'Social media posts from Twitter/X',
  'personal site': 'Individual and personal websites',
  'linkedin profile': 'Professional profiles and information',
  'financial report': 'Corporate financial statements and analyses'
};

const ExaCategorySelector: React.FC<ExaCategorySelectorProps> = ({ 
  selectedCategory, 
  onCategoryChange 
}) => {
  // Categories array for iteration
  const categories: Exclude<exaCategory, undefined>[] = [
    'company',
    'research paper',
    'news',
    'pdf',
    'github',
    'tweet',
    'personal site',
    'linkedin profile',
    'financial report'
  ];

  return (
    <div className="mb-4">
      <div className="flex flex-col">
        <label htmlFor="category-select" className="text-sm font-medium text-gray-700 mb-1">
          Search Category Filter (optional)
        </label>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Add a "No category" option */}
          <button
            className={`px-3 py-2 text-sm border rounded-md transition-colors
              ${selectedCategory === undefined 
                ? 'bg-blue-100 border-blue-500 text-blue-700' 
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            onClick={() => onCategoryChange(undefined)}
          >
            🔍 All Categories
          </button>
          
          {/* Map through all available categories */}
          {categories.map((category) => (
            <button
              key={category}
              className={`px-3 py-2 text-sm border rounded-md transition-colors flex items-center
                ${selectedCategory === category 
                  ? 'bg-blue-100 border-blue-500 text-blue-700' 
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              onClick={() => onCategoryChange(category)}
              title={categoryDescriptions[category]}
            >
              <span className="mr-1">{categoryIcons[category]}</span>
              <span>{categoryDisplayNames[category]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExaCategorySelector;