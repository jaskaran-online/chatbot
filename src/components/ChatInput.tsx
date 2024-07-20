import React from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  authStep: "country" | "phone";
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  input, 
  setInput, 
  handleSend, 
  isLoading, 
  isAuthenticated, 
  authStep 
}) => (
  <motion.div
    className="p-4 border-t"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
  >
    <div className="flex space-x-2">
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSend()}
        placeholder={
          isAuthenticated
            ? "Type a message..."
            : "Enter your phone number..."
        }
        className="flex-1"
        disabled={isLoading}
      />
      <Button
        onClick={handleSend}
        disabled={
          isLoading || (!isAuthenticated && authStep === "country") || input === ""
        }
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  </motion.div>
);

export default ChatInput;
