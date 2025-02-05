import { Ellipsis } from "lucide-react";
import { MessageResponse, removeChat } from "../features/chat/chatSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { httpRequest } from "../features/http.request";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";
import { baseURL } from "../service";

export function ChatMessage({ m }: { m: MessageResponse }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [hover, setHover] = useState(false);
  const user = useAppSelector((state: RootState) => state.auth.user);

  const chatId = window.location.pathname.split("/").pop();

  const removeChatHistory = async (id: string) => {
    try {
      const response = await httpRequest(`${baseURL}/chats/${id}`, "", "DELETE", user?.access_token as string);

      console.log(response?.status, response?.body);
      if (response?.status === 200) {
        console.log(response);
        dispatch(removeChat(id as string));
        toast.success(`Successfully removed history with id ${id}`);
        return;
      }
      
    } catch  (error){
      toast.error("User not authenticated", error as object);
      return;
    }
  };

  return (
    <div
      key={m.id}
      className={`flex p-2 mb-4 items-center hover:bg-gray-200 flex-row justify-between rounded-md cursor-pointer text-gray-600 truncate ${m.id === chatId ? "font-italic bg-gray-200" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <p
        className="truncate text-[12px] w-full"
        onClick={() => navigate(`/o/chat/${m.id}`)}
      >
        {m?.title || "Untitled Chat"}
      </p>

      <div className="flex items-center gap-2">
        {hover && m.id !== chatId && (
          <Ellipsis onClick={async () => await removeChatHistory(m?.id as string)} />
        )}

        {m.id === chatId && (
          <Ellipsis onClick={async () => await removeChatHistory(m?.id as string)} />
        )}
      </div>
    </div>
  );
}
