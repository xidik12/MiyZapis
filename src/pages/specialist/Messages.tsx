import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
// Removed SpecialistPageWrapper - layout is handled by SpecialistLayout
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

const SpecialistMessages: React.FC = () => {
  const { t } = useLanguage();
  const [selectedChat, setSelectedChat] = useState('1');
  const [newMessage, setNewMessage] = useState('');

  const mockConversations = [
    {
      id: '1',
      customerName: 'Олена Петренко',
      lastMessage: 'Дякую за консультацію! Коли можемо зустрітися наступного разу?',
      timestamp: '14:30',
      isUnread: true,
      avatar: null,
      isOnline: true,
    },
    {
      id: '2',
      customerName: 'Максим Коваленко',
      lastMessage: 'Підтверджую запис на завтра о 15:00',
      timestamp: '13:45',
      isUnread: false,
      avatar: null,
      isOnline: false,
    },
    {
      id: '3',
      customerName: 'Анна Шевченко',
      lastMessage: 'Чи можемо ми перенести зустріч?',
      timestamp: 'Вчора',
      isUnread: true,
      avatar: null,
      isOnline: true,
    },
  ];

  const mockMessages = [
    {
      id: '1',
      senderId: 'customer',
      message: 'Добрий день! Хотіла б записатися на консультацію',
      timestamp: '14:20',
    },
    {
      id: '2',
      senderId: 'specialist',
      message: 'Добрий день! Звичайно, з радістю допоможу. Коли Вам буде зручно?',
      timestamp: '14:22',
    },
    {
      id: '3',
      senderId: 'customer',
      message: 'Можливо завтра після обіду?',
      timestamp: '14:25',
    },
    {
      id: '4',
      senderId: 'specialist',
      message: 'Завтра о 15:00 підходить? У мене є вільний час',
      timestamp: '14:27',
    },
    {
      id: '5',
      senderId: 'customer',
      message: 'Дякую за консультацію! Коли можемо зустрітися наступного разу?',
      timestamp: '14:30',
    },
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here would be the logic to send the message
      setNewMessage('');
    }
  };

  const selectedConversation = mockConversations.find(c => c.id === selectedChat);

  return (
    
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.nav.messages')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('messages.subtitle')}</p>
          </div>
        </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 h-[600px] flex">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('messages.searchConversations')}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {mockConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedChat(conversation.id)}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedChat === conversation.id ? 'bg-primary-50 dark:bg-primary-900' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {conversation.customerName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium truncate ${
                        conversation.isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {conversation.customerName}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${
                      conversation.isUnread ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.isUnread && (
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {selectedConversation.customerName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {selectedConversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.customerName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedConversation.isOnline ? t('messages.online') : t('messages.offline')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <PhoneIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <VideoCameraIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === 'specialist' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.senderId === 'specialist'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === 'specialist'
                          ? 'text-primary-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('messages.typeMessage')}
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('messages.selectConversation')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('messages.selectConversationDescription')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    
  );
};

export default SpecialistMessages;