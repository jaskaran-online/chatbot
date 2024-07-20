import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

interface Message {
  text: string;
  sender: "user" | "bot";
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading, messagesEndRef }) => (
  <motion.div
    className="flex-1 overflow-y-auto p-4 space-y-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}
  >
    {messages.map((message, index) => (
      <motion.div
        key={index}
        className={`flex ${
          message.sender === "user" ? "justify-end" : "justify-start"
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <div
          className={`max-w-xs p-2 rounded-lg ${
            message.sender === "user"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 border"
          }`}
        >
          <div className="flex items-center justify-center flex-row gap-3"> 
          { message.sender === "bot" && <Bot className="h-8 w-8" height={20} width={20} />}
            <p> {message.text}</p>
          </div>
        </div>
      </motion.div>
    ))}
    {isLoading && (
      <motion.div
        className="flex justify-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="max-w-xs p-2 rounded-lg bg-gray-200">
          Thinking...
        </div>
      </motion.div>
    )}
    <div ref={messagesEndRef} />
  </motion.div>
);

export default ChatMessages;
