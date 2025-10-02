import React, { useCallback, useEffect, useRef, useState } from "react";
import { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SideMenu from "../component/SideMenu";
import { baseURL } from "../service";
import { RootState, useAppDispatch } from "../store";
import { useAppSelector } from "../hooks";
import { fetchChatHistory, Message } from "../features/chat/chatSlice";
import { useNavigate, useParams } from "react-router-dom";
import { LLMModels } from "../util/ai_model";
import CallToActionItems from "../component/CTA";
import ChatMessages from "../component/ChatMessageList";
import TopMenu from "../component/TopMenu";
import ChatBox from "../component/ChatBox";
import { MessageSquarePlus } from "lucide-react";
import { httpRequest } from "../features/http.request";

const MainChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { chatId } = useParams<{ chatId?: string }>();
  const user = useAppSelector((selector: RootState) => selector.auth.user);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedChatService, setSelectedChatService] = useState<LLMModels>("deepseek-r1");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Fetch chat history when a chat ID is provided.
  // Can we save the chat history in the store? If we do this, during refresh, we can fetch the chat history from the store.
  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await httpRequest({ 
        url: `${baseURL}/chats/${chatId}`, 
        method: "GET", 
        accessToken: user?.access_token});

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const fetchedChat = await response.json();
      setMessages(fetchedChat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      toast.error("Failed to load chat history. Please try again.");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, user?.access_token]);

  // Fetch data when the component mounts
  useEffect(() => {
    const loadData = async () => {
      const sessionChatId = loadChatState();
      // The solution is asking for me to retain a chat Id session such that when the user refreshes the page, we can load the chat history using the id.
      // Solution: We can save the chatId in the local storage and then load it when the component mounts.
      // We shall start by first checking to see if there is any other session id stored locally.
      // If there is a session id, we will load the chat history using the id.
      // and use navigate to load the id in the url.

      if (chatId) {
        saveChatState(chatId);
        await fetchChats();
        return;
      }
      
      if (sessionChatId) {
        navigate(`/o/chat/${sessionChatId}`);
        return;
      }
    };

    loadData();
  }, [chatId, fetchChats, navigate]);

  // figure out if the window is small and then set isSidebarOpen to true
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // const updateChat = useCallback(async () => {
  //   try {
  //     console.log("Updating chat:", chatId, messages);
  //     const response = await httpRequest({
  //       url: `${baseURL}/chats/${chatId}`,
  //       data: JSON.stringify({ messages: messages }),
  //       method: "PATCH",
  //       accessToken: user?.access_token,
  //     });

  //     if (!response?.ok) {
  //       throw new Error(`HTTP error! status: ${response?.status}`);
  //     }

  //     const fetchedChat = await response.json();
  //     setMessages(fetchedChat);
  //   } catch (error) {
  //     console.error("Error fetching chat:", error);
  //     toast.error("Failed to fetch chat. Please try again.");
  //   }
  // }, [chatId, messages, user?.access_token]);

  const handleSubmit = useCallback(async (
    event?: React.FormEvent<HTMLFormElement | KeyboardEvent | HTMLTextAreaElement>,
    inputMessage?: string
    ) => {

      event?.preventDefault();
      const messageToSend = inputMessage || inputValue;
      if (!messageToSend.trim() || isLoading) return;
      const userMessage: Message = { role: "user", content: messageToSend };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInputValue("");
      setIsLoading(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        const response = await fetch(`${baseURL}/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            model_name: selectedChatService,
          }),
          signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        const assistantMessage: Message = { role: "assistant", content: "" };
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                setIsLoading(false);
                break;
              }

              try {
                const parsedData = JSON.parse(data);
                if (parsedData.content) {
                  const processedChunks = new Set();

                  setMessages((prevMessages) => {
                    const newMessages = [...prevMessages];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (
                      lastMessage.role === "assistant" &&
                      !processedChunks.has(parsedData.id)
                    ) {
                      processedChunks.add(parsedData.id);
                      lastMessage.content += parsedData.content;
                    }
                    return newMessages;
                  });
                }
              } catch (error) {
                console.error("Error parsing SSE data:", error);
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          toast.error("Request timed out. Please try again.");
          return;
        }
      } finally {
              dispatch(fetchChatHistory)

        setIsLoading(false);
      }

      // Find a way to update the chat without creating a new chat. Also make sure to look at the backend code where the chat is created.
      // if (chatId) {
      //   await updateChat();
      // }
    },[
      inputValue,
      isLoading,
      messages,
      selectedChatService,
      // updateChat,
      // chatId,
      user?.access_token,
    ]
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom, messages]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    });
  };

  // TODO: Save chat state to local storage
  const saveChatState = (chatId: string) => {
    localStorage.setItem("chatId", chatId);
  };

  // TODO: Load chat state from local storage
  const loadChatState = () => {
    const savedData = localStorage.getItem("chatId");
    if (savedData) {
      return savedData;
    }
    return null;
  };

  // TODO:  Remove chat state from local storage when user clicks on new chat button
  const removeChatId = () => {
    localStorage.removeItem("chatId");
  };

  const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-2">{children}</p>,
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-2">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold mb-2">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-bold mb-2">{children}</h3>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-2">{children}</ol>
    ),
    li: ({ children }) => <li className="list-inside mb-2">{children}</li>,
    
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      const codeContent = String(children).replace(/\n$/, "");
      const language = match ? match[1] : "text";

      return match ? (
        <div className="relative">
          <div className="py-1 px-2 rounded-t-lg font-mono text-xs text-gray-800">
            <strong>{language.toUpperCase()}</strong>
          </div>

          <SyntaxHighlighter
            style={vscDarkPlus}
            className="my-2 rounded-lg"
            language={match[1]}
            PreTag="div"
          >
            {codeContent}
          </SyntaxHighlighter>
          <button
            onClick={() => copyToClipboard(codeContent)}
            className=" top-2 right-2 text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700 transition"
          >
            {copiedCode === codeContent ? "Copied!" : "Copy"}
          </button>
        </div>
      ) : (
        <code
          className="my-2 bg-gray-100 px-1 py-1 italic rounded-lg"
          {...props}
        >
          {children}
        </code>
      );
    },

    pre: ({ children }) => (
      <pre className="rounded whitespace-pre-wrap">{children}</pre>
    ),

    a: ({ href, children }) => (
      <a href={href} className="text-blue-600 hover:underline">
        {children}
      </a>
    ),

    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-100 pl-4 italic my-2">
        {children}
      </blockquote>
    ),

    hr: () => <hr className="my-4 border-t border-gray-50" />,
    img: ({ src, alt }) => (
      <img src={src} alt={alt} className="max-w-full h-auto my-2" />
    ),

    table: ({ children }) => (
      <div className="overflow-x-auto">
        <table className="table-auto border-collapse my-2 w-full bg-white shadow-lg">
          <tbody>{children}</tbody>
        </table>
      </div>
    ),

    th: ({ children }) => (
      <th className="border border-gray-300 px-4 py-2 font-bold bg-gray-100 text-left">
        {children}
      </th>
    ),

    td: ({ children }) => (
      <td className="border border-gray-300 px-4 py-2">{children}</td>
    ),

    tr: ({ children }) => <tr>{children}</tr>,
  };

  const handleSelectedChatService = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedChatService(event.target.value as "llama3.2" | "deepseek-r1");
  };

  const handleSubmitCustom = (messageContent: string) => {
    handleSubmit(undefined, messageContent);
  };

  const handleAbort = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setInputValue("");
      toast.error("Request cancelled.");
    }
  };

  const toggleMenu = () => {
    document.body.classList.toggle("sidebar-collapsed");
  };

  return (
    <div className="flex flex-row">
      {/* SideMenu*/}
      <SideMenu
        selectedChatService={selectedChatService}
        handleSelectedChatService={handleSelectedChatService}
        isOpen={isSidebarOpen}
        toggleMenu={toggleSidebar}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center w-full h-full transition-all duration-300 ease-in-out">
        {/* TopMenu  */}
        <TopMenu toggleMenu={toggleMenu} />

        {/* Chat content */}
        <main className="content ml-[250px] mt-[60px] p-[20px]  mb-[160px] transition-all duration-300 ease-in-out">
          <div
            className={`flex flex-col items-center w-full h-full  transition-all duration-300 ease-in-out`}
          >
            <div
              className={`font-semibold text-[32px] text-center ${messages.length > 0 ? "hidden" : "block"}`}
            >
              Unlocking the Potential of Organizational Wisdom
            </div>

            {messages.length === 0 && (
              <CallToActionItems
                messages={messages}
                handleSubmitCustom={handleSubmitCustom}
              />
            )}

            <div className="flex flex-1">
              <div className="flex flex-col space-y-10 justify-items-end w-full">
                {/* Chat messages */}
                <ChatMessages
                  messages={messages}
                  markdownComponents={markdownComponents}
                  user={user}
                />

                {messages.length > 0 && (
                  <div className="flex justify-center items-center w-full rounded-full sticky top-0 cursor-pointer">
                    <div
                      className="flex items-center justify-center gap-4 p-2 px-4 bg-white rounded-full border border-gray-300 shadow-md"
                      onClick={() => {
                        navigate("/new");
                        setMessages([]);
                        removeChatId();
                      }}
                    >
                      <MessageSquarePlus color="gray" size={24} />
                      <p>New Conversation</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />

              </div>
            </div>
          </div>
        </main>

        <ChatBox
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          handleSubmit={handleSubmit}
          handleAbort={handleAbort}
          abortControllerRef={abortControllerRef}
        />
      </div>
    </div>
  );
};

export default MainChat;
