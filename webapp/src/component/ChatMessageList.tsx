import React, { useRef } from "react";
import { Message } from "../features/chat/chatSlice";
import ReactMarkdown, { Components } from 'react-markdown';

import 'react-toastify/dist/ReactToastify.css';
import userAssistant from '../assets/userAssistant.png';
import remarkGfm from 'remark-gfm';
import { User } from "../features/auth/authSlice";

interface ChatMessagesProps {
  messages: Message[]
  user: User | null
  markdownComponents: Components
}

const ChatMessages: React.FC<ChatMessagesProps> = React.memo(({ messages, markdownComponents, user }) => {
  const messageListRef = useRef<HTMLDivElement>(null);
  // React.useEffect(() => {
  //   if (messageListRef.current) {
  //     messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  //   }
  // }, [messages]);

  const renderMessage = (message: Message, index: number) => (
    <div key={index} className={`flex flex-col  w-full`}>
      {message.role === 'assistant' && (
        <div className='mb-4 flex-col items-start'>
          <img src={userAssistant} alt="User" className="w-8 h-8 rounded-full"></img>
          {!message.content && <p>Thinking...</p>}
        </div>
      )}

      <div className={`mb-4 ${message.role === 'user'
        ? 'flex max-w-max  text-black rounded-2xl top-0'
        : 'text-gray-500 rounded-lg'
        }`}>
           
        {message.role === 'user' ? (
          // push message to the right
          <div className="flex flex-row gap-4 w-full">
          <div className="flex flex-row gap-4 justify-center items-center bg-gray-200 p-4 rounded-lg">
             <img src={user?.photo_url} 
              alt="Google Profile" 
              style={{ width: "40px", height: "40px", borderRadius: "50%" }}
              referrerPolicy="no-referrer"/>
              <p className="text-sm">{message.content}</p>
              </div>

          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        )}

      </div>
    </div>
  );

  return (
    <div className="flex md:w-[830px] flex-col pb-0  w-full overflow-auto" ref={messageListRef}>
      {messages.map(renderMessage)}
    </div>
  );
});


export default ChatMessages;


