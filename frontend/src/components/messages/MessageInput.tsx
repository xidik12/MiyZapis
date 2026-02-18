import React, { useState, useRef, KeyboardEvent } from 'react';
import { PaperAirplaneIcon, PaperClipIcon } from '@/components/icons';
import { Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder
}) => {
  const { t } = useLanguage();
  const resolvedPlaceholder = placeholder || t('messages.typeMessage');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(value + emojiData.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit();
    }
  };

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [value]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 right-0 z-50">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 z-10"
            >
              ×
            </button>
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={320}
              height={400}
            />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-3 sm:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {/* Attachment Button */}
        <button
          type="button"
          className="flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
          title={t('messages.attachFile')}
        >
          <PaperClipIcon className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={resolvedPlaceholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-2.5 pr-10 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-2xl border border-transparent focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none resize-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', maxHeight: '150px' }}
          />
        </div>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
            value.trim() && !disabled
              ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/30'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};
