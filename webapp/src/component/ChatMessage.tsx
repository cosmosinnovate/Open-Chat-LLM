import { Ellipsis } from "lucide-react";
import { MessageResponse, removeChat } from "../features/chat/chatSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";


export function ChatMessage({ m }: { m: MessageResponse }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const chatId = window.location.pathname.split('/').pop()
  const removeChatHistory = (id: string | undefined) => {
    if (!id) return
    dispatch(removeChat(id as string))
    toast.success(`Successfully removed history with id ${id}`);
  } 

  return <div
    key={m.id}
    className={`flex p-2 mb-2 items-center hover:bg-gray-200 flex-row justify-between rounded-md cursor-pointer text-gray-600 truncate ${m.id === chatId ? 'font-italic bg-gray-100' : ''}`}>
    <p className="truncate text-[10px] w-full"  onClick={() => navigate(`/o/chat/${m.id}`)}>
      {m?.title || 'Untitled Chat'}
    </p>
    {/* Show this on hover */}
    <div>
    <Ellipsis className="" onClick={() => removeChatHistory(m?.id)}/>

    </div>
  </div>
}