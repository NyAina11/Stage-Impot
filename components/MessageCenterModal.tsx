import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAppStore } from '../store/useAppStore';

interface MessageCenterModalProps {
    onClose: () => void;
}

const MessageCenterModal: React.FC<MessageCenterModalProps> = ({ onClose }) => {
    const { sendMessage, messages, messagesLoading } = useAppStore();
    const [messageContent, setMessageContent] = useState('');

    const handleSend = async () => {
        const trimmed = messageContent.trim();
        if (!trimmed) return;
        await sendMessage(trimmed);
        setMessageContent('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-3xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Messagerie inter-divisions</h2>
                    <Button variant="ghost" onClick={onClose}>×</Button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Envoyer un message</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <Input label="Message" id="messageContentModal" value={messageContent} onChange={e => setMessageContent(e.target.value)} required />
                            <div className="text-right">
                                <Button onClick={handleSend} disabled={messagesLoading}>
                                    {messagesLoading ? 'Envoi...' : 'Envoyer à toutes les divisions'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Mes messages envoyés</h3>
                        <div className="overflow-x-auto">
                            {messages.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400">Aucun message.</p>
                            ) : (
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3">Destinataire</th>
                                            <th className="px-6 py-3">Contenu</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {messages.map(m => (
                                            <tr key={m.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                                <td className="px-6 py-4">{m.toRole}</td>
                                                <td className="px-6 py-4">{m.content}</td>
                                                <td className="px-6 py-4">{new Date(m.createdAt).toLocaleString('fr-FR')}</td>
                                                <td className="px-6 py-4">{m.confirmed ? 'Confirmé' : 'En attente'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-right">
                    <Button onClick={onClose}>Fermer</Button>
                </div>
            </Card>
        </div>
    );
};

export default MessageCenterModal;


