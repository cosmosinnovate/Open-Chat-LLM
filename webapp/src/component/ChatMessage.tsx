import { Ellipsis } from "lucide-react";
import { MessageResponse, removeChat } from "../features/chat/chatSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { useAppSelector } from "../hooks";
import { RootState } from "../store";
import { baseURL } from "../service";
import { httpRequest } from "../features/http.request";

export function ChatMessage({
  messageResponse,
}: {
  messageResponse: MessageResponse;
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user);
  const chatId = window.location.pathname.split("/").pop();
  const [hover, setHover] = useState(false);

  const removeChatHistory = async (id: string) => {
    try {
      const response = await httpRequest({
        url: `${baseURL}/chats/${id}`, method: "DELETE",
        accessToken: user?.access_token});
      if (response?.status === 200) {
        console.log(response);
        dispatch(removeChat(id as string));
        toast.success(`Successfully removed history with id ${id}`);
        return;
      }
    } catch (error) {
      toast.error("User not authenticated", error as object);
      return;
    }
  };

  return (
    <div key={messageResponse?.id}
      className={`flex p-2 mb-2 items-center h-10 hover:bg-gray-100 flex-row justify-between rounded-md cursor-pointer text-gray-600 truncate ${messageResponse?.id === chatId ? "bg-gray-200" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      <p className="truncate text-[12px] w-full" onClick={() => navigate(`/o/chat/${messageResponse?.id}`)}>
        {messageResponse?.title || "Untitled Chat"}
      </p>


        {hover && messageResponse?.id !== chatId && (
          <Ellipsis
            onClick={async () =>
              await removeChatHistory(messageResponse?.id as string)
            }
          />
        )}

        {messageResponse?.id === chatId && (
          <Ellipsis
            onClick={async () =>
              await removeChatHistory(messageResponse?.id as string)
            }
          />
        )}

    </div>
  );
}
