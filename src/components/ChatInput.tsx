import React, { useState, FormEvent, ChangeEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  searchEnabled: boolean;
  setSearchEnabled: (enabled: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  searchEnabled,
  setSearchEnabled,
}) => {
  const [message, setMessage] = useState<string>('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(message);
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchEnabled(e.target.checked);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="search-toggle"
            checked={searchEnabled}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="search-toggle" className="text-sm text-gray-700">
            Enable web search with Exa AI
          </label>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isLoading}
          />
          <button  
            type="submit"
            disabled={isLoading || !message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
