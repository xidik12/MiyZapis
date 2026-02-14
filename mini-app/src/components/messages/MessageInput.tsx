import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useTelegram } from '@/components/telegram/TelegramProvider';

interface MessageInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
  placeholder: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, isSending, placeholder }) => {
  const [text, setText] = useState('');
  const { hapticFeedback } = useTelegram();

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    hapticFeedback.impactLight();
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-14 left-0 right-0 bg-bg-secondary/90 backdrop-blur-xl border-t border-white/5 p-3 z-40">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="input-telegram flex-1 rounded-xl text-sm resize-none max-h-24 py-2.5 px-3"
          style={{ minHeight: '40px' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
            text.trim() && !isSending
              ? 'bg-accent-primary text-white'
              : 'bg-bg-hover text-text-muted'
          }`}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
