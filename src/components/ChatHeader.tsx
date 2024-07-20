import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ChatHeaderProps {
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => (
  <div className="bg-gray-900  text-white p-4 rounded-t-lg flex justify-between items-center">
    <div>
      <Image src="/iVALT.png" alt="iVALT logo" width={40} height={40} className="rounded-full"/>
    </div>
    <h3 className="font-bold">Chat with us</h3>
    <Button
      variant="ghost"
      size="icon"
      onClick={onClose}
    >
      <X className="h-6 w-6" />
    </Button>
  </div>
);

export default ChatHeader;
