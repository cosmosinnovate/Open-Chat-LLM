import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideMenu from '../component/SideMenu';
import { baseURL } from '../service';
import { RootState } from '../store';
import { useAppSelector } from '../hooks';
import { Message } from '../features/chat/chatSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { LLMModels } from '../util/ai_model';
import CallToActionItems from '../component/CTA';
import ChatMessages from '../component/ChatMessageList';
import TopMenu from '../component/TopMenu';
import ChatBox from '../component/ChatBox';
import { MessageSquareTextIcon } from 'lucide-react';

const MainChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const { chatId } = useParams<{ chatId?: string }>();
    const user = useAppSelector((selector: RootState) => selector.auth.user)
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [selectedChatService, setSelectedChatService] = useState<LLMModels>('llama3.2');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState('');
    const navigate = useNavigate()

    const startNewChat = useCallback(async () => {
        try {
            const response = await fetch(`${baseURL}/start-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.access_token}`
                },
                body: JSON.stringify({ messages: messages })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(data)
            navigate(`/chat/${data.chat_id}`, { replace: true });
        } catch (error) {
            console.error('Error starting new chat:', error);
            // toast.error('Failed to start a new chat. Please try again.');
        }
    }, [messages, navigate, user?.access_token]);

    const fetchChats = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${baseURL}/chats/${chatId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const fetchedChat = await response.json();
            setMessages(fetchedChat);
        } catch (error) {
            console.error('Error fetching chat:', error);
            toast.error('Failed to load chat history. Please try again.');
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    }, [chatId, user?.access_token]);

    useEffect(() => {
        const loadData = async () => {
            if (chatId) {
                await fetchChats();
            }
        };

        loadData();
    }, [chatId, fetchChats]);


    // figure out if the window is small and then set isSidebarOpen to true
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const updateChat = useCallback(async () => {
        try {
            const response = await fetch(`${baseURL}/chats/${chatId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.access_token}`
                },
                body: JSON.stringify({ messages: messages })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const fetchedChat = await response.json();
            console.log(fetchedChat);
            setMessages(fetchedChat);
        } catch (error) {
            console.error('Error fetching chat:', error);
            toast.error('Failed to fetch chat. Please try again.');
        }
    }, [chatId, messages, user?.access_token]);

    const handleSubmit = useCallback(async (event?: React.FormEvent<HTMLFormElement | KeyboardEvent | HTMLTextAreaElement>, inputMessage?: string) => {
        event?.preventDefault();
        const messageToSend = inputMessage || inputValue;
        if (!messageToSend.trim() || isLoading) return;
        const userMessage: Message = { role: 'user', content: messageToSend };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setInputValue('');
        setIsLoading(true);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {

            
            // switch (selectedChatService) {
            //     case 'llama3.2':
            //         response = await fetch(`${baseURL}/chats`, {
            //             method: 'POST',
            //             headers: {
            //                 'Content-Type': 'application/json',
            //                 'Authorization': `Bearer ${user?.access_token}`
            //             },
            //             body: JSON.stringify({ messages: [...messages, userMessage] }),
            //             signal,
            //         });
            //         break;
            //     default:
            //         throw new Error(`Unknown chat service: ${selectedChatService}`);
            // }
   
            const response = await fetch(`${baseURL}/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.access_token}`
                },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
                signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Response body is not readable');
            }

            const assistantMessage: Message = { role: 'assistant', content: '' };
            setMessages(prevMessages => [...prevMessages, assistantMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            setIsLoading(false);
                            break;
                        }

                        try {
                            const parsedData = JSON.parse(data);
                            if (parsedData.content) {
                                const processedChunks = new Set();
                                setMessages(prevMessages => {
                                    const newMessages = [...prevMessages];
                                    const lastMessage = newMessages[newMessages.length - 1];
                                    if (lastMessage.role === 'assistant' && !processedChunks.has(parsedData.id)) {
                                        processedChunks.add(parsedData.id);
                                        lastMessage.content += parsedData.content;
                                    }
                                    return newMessages;
                                });
                            }
                        } catch (error) {
                            console.error('Error parsing SSE data:', error);
                        }
                    }
                }

            }
        } catch (error) {

            if (error instanceof DOMException && error.name === 'AbortError') {
                toast.error('Request timed out. Please try again.');
                return;
            }

        } finally {
            setIsLoading(false);
        }

        if (chatId) {
            await updateChat();
        } else {
            await startNewChat();
        }
    }, [
        inputValue,
        isLoading,
        messages,
        // selectedChatService,
        startNewChat,
        updateChat,
        chatId,
        user?.access_token,
    ])

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            setTimeout(() => setCopiedCode(''), 2000);
        });
    };

    const markdownComponents: Components = {
        p: ({ children }) => <p className="mb-2">{children}</p>,
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');
            const language = match ? match[1] : 'text';
            return match ? (
                <div className='relative'>
                    <div className='py-1 px-2 rounded-t-lg font-mono text-xs text-gray-800'>
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
                        {copiedCode === codeContent ? 'Copied!' : 'Copy'}
                    </button>
                </div>

            ) : (
                <code className="my-2 bg-gray-100 px-1 py-1 italic rounded-lg" {...props}>
                    {children}
                </code>
            );
        },
        pre: ({ children }) => <pre className="rounded whitespace-pre-wrap">{children}</pre>,
        a: ({ href, children }) => <a href={href} className="text-blue-600 hover:underline">{children}</a>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-100 pl-4 italic my-2">{children}</blockquote>,
        hr: () => <hr className="my-4 border-t border-gray-50" />,
        img: ({ src, alt }) => <img src={src} alt={alt} className="max-w-full h-auto my-2" />,
        // Updated table components
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
        td: ({ children }) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
        tr: ({ children }) => <tr>{children}</tr>,
    };

    const handleSelectedChatService = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedChatService(event.target.value as 'llama3.2' | 'deepseek-r1');
    };

    const handleSubmitCustom = (messageContent: string) => {
        handleSubmit(undefined, messageContent);
    };

    const handleAbort = (event?: React.MouseEvent<HTMLButtonElement>) => {
        event?.preventDefault();
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
            setInputValue('');
            toast.error('Request cancelled.');
        }
    };

    const toggleMenu = () => {
        document.body.classList.toggle('sidebar-collapsed');
    }

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
                <main className="content ml-[250px] mt-[60px] p-[20px] h-[calc(100vh-60px)] pb-[100px] transition-all duration-300 ease-in-out">
                    <div className={`flex flex-col items-center w-full h-full  transition-all duration-300 ease-in-out`}>
                        <div className={`font-semibold text-[32px] text-center ${messages.length > 0 ? 'hidden' : 'block'}`}>
                            Unlocking the Potential of Organizational Wisdom
                        </div>

                        {messages.length === 0 && <CallToActionItems messages={messages} handleSubmitCustom={handleSubmitCustom} />}

                        <div className="flex flex-1">
                            <div className="flex flex-col space-y-10 justify-items-end w-full">
                                {/* Chat messages */}
                                {isLoading && (
                                    <div className="flex items-start p-4">
                                        <div className="flex flex-col flex-grow">
                                            <div className="text-gray-700"></div>
                                            <MessageSquareTextIcon />
                                        </div>
                                    </div>
                                )}
                                <ChatMessages messages={messages} markdownComponents={markdownComponents} />
                                <div ref={messagesEndRef} />
                            </div>

                        </div>
                    </div>

                </main>

                {/* Chat box*/}
                <ChatBox
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    isLoading={isLoading}
                    handleSubmit={handleSubmit}
                    handleAbort={handleAbort}
                    abortControllerRef={abortControllerRef} />

            </div>
        </div>
    );
};

export default MainChat;