import React, { useRef } from "react";
import { Message } from "../features/chat/chatSlice";
import ReactMarkdown, { Components } from "react-markdown";

import "react-toastify/dist/ReactToastify.css";
import userAssistant from "../assets/userAssistant.png";
import remarkGfm from "remark-gfm";
import { User } from "../features/auth/authSlice";

interface ChatMessagesProps {
  messages: Message[];
  user: User | null;
  markdownComponents: Components;
}

const ChatMessages: React.FC<ChatMessagesProps> = React.memo(({ messages, markdownComponents, user }) => {
    const messageListRef = useRef<HTMLDivElement>(null);

    const renderMessage = (message: Message, index: number) => (
      <div key={index} className={`flex flex-col  w-full`}>
        { 
          message.role === "assistant" && (
            <div className="mb-4 flex-col items-start">
              {!message.content && <p>
                <img
                src={userAssistant}
                alt="User"
                className="w-8 h-8 rounded-full"
              ></img>
                Thinking...</p>}
            </div>
          )}

        <div className={`mb-4 justify-end ${message.role === "user" ? "flex  text-black rounded-2xl top-0" : "text-gray-800 rounded-lg"}`}>

          {
            message.role === "user" ? (
              <div className="flex flex-row gap-4">
                <div className="flex flex-row gap-4 justify-center items-center bg-gray-100 p-4 rounded-2xl">
                <p className="text-sm">{message.content}</p>
                  <img
                    src={user?.photo_url}
                    alt="Google Profile"
                    style={{ width: "18px", height: "18px", borderRadius: "50%" }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            )
          }

        </div>
      </div>
    );

    return (
      <div
        className="flex md:w-[830px] flex-col pb-0  w-full overflow-auto"
        ref={messageListRef}
      >
        {messages.map(renderMessage)}
      </div>
    );
  }
);

export default ChatMessages;
