
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import Button from './ui/Button';
import { Message } from '../types';

interface NotificationCenterProps {
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const { messages, confirmMessage, messagesLoading } = useAppStore();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={onClose}>
      <div
        className="absolute top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out translate-x-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Notifications</h2>
          <Button variant="ghost" onClick={onClose}>X</Button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-5rem)]">
          {messagesLoading && <p className="p-4 text-center">Chargement...</p>}
          {!messagesLoading && messages.length === 0 && (
            <p className="p-4 text-center text-gray-500 dark:text-gray-400">
              Aucune notification.
            </p>
          )}
          {!messagesLoading && messages.map((message: Message) => (
            <div key={message.id} className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                De: {message.fromRole}
              </p>
              <p className="my-2">{message.content}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(message.createdAt).toLocaleString('fr-FR')}
                </span>
                {!message.confirmed && (
                  <Button size="sm" onClick={() => confirmMessage(message.id)}>
                    Marquer comme lu
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
