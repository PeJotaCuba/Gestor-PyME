
import React, { useState, useEffect, useRef } from 'react';
import { Send, FileText, Paperclip, ChevronLeft, MessageSquare } from 'lucide-react';
import { Message, CloudUser } from '../types';
import { CloudService } from '../services/firebase';

interface ChatViewProps {
    currentUser: CloudUser;
    onBack?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, onBack }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Suscripción en tiempo real a los mensajes del equipo (misma licencia)
        const unsubscribe = CloudService.subscribeToMessages(currentUser.licenseKey, (newMessages) => {
            setMessages(newMessages);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => unsubscribe();
    }, [currentUser.licenseKey]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        const msg: Message = {
            senderId: currentUser.uid!,
            senderName: currentUser.name,
            type: 'text',
            content: input,
            timestamp: null // Firestore asignará serverTimestamp
        };
        await CloudService.sendMessage(currentUser.licenseKey, msg);
        setInput('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await CloudService.uploadFile(currentUser.licenseKey, file);
            const msg: Message = {
                senderId: currentUser.uid!,
                senderName: currentUser.name,
                type: 'file',
                content: `Envió un archivo: ${file.name}`,
                fileUrl: url,
                fileName: file.name,
                timestamp: null
            };
            await CloudService.sendMessage(currentUser.licenseKey, msg);
        } catch (err) {
            alert("Error al subir archivo.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Header */}
            <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-orange-500">
                        <ChevronLeft />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Equipo {currentUser.licenseKey.split('-')[1]}</h3>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Chat Seguro de Licencia</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-50 dark:bg-slate-950/50">
                {messages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.senderId === currentUser.uid ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] font-bold text-slate-400 mb-1 px-2">{m.senderName}</span>
                        <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${m.senderId === currentUser.uid ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                            {m.type === 'file' ? (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate">{m.fileName}</p>
                                        <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className={`text-[10px] font-bold underline mt-1 block ${m.senderId === currentUser.uid ? 'text-white/80' : 'text-orange-500'}`}>Ver Archivo</a>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm leading-relaxed">{m.content}</p>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-orange-500 transition-colors"
                    >
                        <Paperclip size={20} className={isUploading ? 'animate-spin' : ''} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Mensaje al equipo..."
                        className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500"
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!input.trim()}
                        className="p-3 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 transition-all"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
