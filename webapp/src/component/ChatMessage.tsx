import { MessageResponse } from "../features/chat/chatSlice";
import { useNavigate } from "react-router-dom";


export function ChatMessage({ m }: { m: MessageResponse }) {
  const navigate = useNavigate()
  const chatId = window.location.pathname.split('/').pop()

  return <div
    key={m.id}
    className={`p-2 mb-2 hover:bg-gray-200 rounded-md cursor-pointer text-gray-600 truncate text-sm ${m.id === chatId ? 'font-bold bg-gray-100' : ''}`}
    onClick={() => navigate(`/o/chat/${m.id}`)}
  >
    {m?.title || 'Untitled Chat'}
  </div>
}