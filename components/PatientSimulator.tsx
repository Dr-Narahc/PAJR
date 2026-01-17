import React, { useState, useRef, useEffect } from 'react';
import { Message, Patient } from '../types';
import { Icons } from './Icons';

interface Props {
  patient: Patient;
  onSendMessage: (content: string, type: 'TEXT' | 'IMAGE') => void;
  isTyping: boolean;
}

export const PatientSimulator: React.FC<Props> = ({ patient, onSendMessage, isTyping }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [patient.messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input, 'TEXT');
    setInput('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onSendMessage(imageUrl, 'IMAGE');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#e5ddd5] relative">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        <div className="flex justify-center my-4">
           <span className="bg-[#dcf8c6] text-gray-600 text-xs px-3 py-1 rounded shadow-sm border border-gray-200">
             Messages are secured and end-to-end encrypted.
           </span>
        </div>

        {patient.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'PATIENT' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-2 rounded-lg shadow-sm text-sm relative ${
                msg.sender === 'PATIENT'
                  ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-none'
                  : 'bg-white text-gray-900 rounded-tl-none'
              }`}
            >
              {msg.type === 'IMAGE' ? (
                <div className="mb-1">
                  <img src={msg.content} alt="Attachment" className="rounded-lg max-h-48 object-cover w-full border border-black/5" />
                </div>
              ) : msg.type === 'DOCUMENT' ? (
                 <div className="flex items-center gap-3 bg-white/50 p-2 rounded border border-gray-200">
                    <div className="p-2 bg-red-100 rounded-lg text-red-500">
                        <Icons.File size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-800">{msg.fileName || 'Document'}</p>
                        <p className="text-[10px] text-gray-500">PDF • 1.2 MB</p>
                    </div>
                 </div>
              ) : (
                <p className="whitespace-pre-wrap p-1">{msg.content}</p>
              )}
              
              <span className="text-[10px] text-gray-500 block text-right mt-1 opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {msg.sender === 'PATIENT' && <span className="ml-1 text-blue-400">✓✓</span>}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-white p-3 rounded-lg shadow-sm rounded-tl-none">
                <div className="flex space-x-1 h-4 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
             </div>
           </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f0f0] p-2 flex items-center space-x-2">
        {/* Camera Upload Button */}
        <button 
           onClick={() => fileInputRef.current?.click()}
           className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
           title="Send Photo"
        >
           <Icons.Camera size={22} />
        </button>
        <input 
           type="file" 
           ref={fileInputRef} 
           className="hidden" 
           accept="image/*"
           onChange={handleImageUpload}
        />

        <div className="flex-1 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
            <input
            type="text"
            className="w-full bg-transparent focus:outline-none text-sm text-gray-800"
            placeholder="Type a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            />
        </div>
        <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 bg-[#075e54] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#128c7e] transition-colors disabled:opacity-50 flex-shrink-0"
        >
            <Icons.Send size={18} />
        </button>
      </div>
    </div>
  );
};