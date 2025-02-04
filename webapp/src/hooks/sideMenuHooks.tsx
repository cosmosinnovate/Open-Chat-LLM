import { AppDispatch,RootState} from "../store";
import { useCallback, useEffect } from "react";
import { baseURL } from "../service";
import { MessageResponse, setChat } from "../features/chat/chatSlice";
import { useNavigate } from "react-router-dom";

export function useFetchHook(dispatch: AppDispatch, user: RootState['auth']['user']) {
  const fetchUserChats = useCallback(async () => {
    try {
      const response = await fetch(`${baseURL}/chats`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token as string}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const fetchedChats: MessageResponse[] = await response.json();
      dispatch(setChat(fetchedChats as MessageResponse[]))

    } catch (e) {
      throw Error(`Something happened: ${e}`)
    }
  }, [dispatch, user?.access_token])

  useEffect(() => {
    fetchUserChats()
  }, [fetchUserChats])
}


export function ChatMessage({ m }: { m: MessageResponse }) {
    const navigate = useNavigate()
    // get current chat id from URL
    const chatId = window.location.pathname.split('/').pop()
  
    return <div
      key={m.id}
      className={`p-2 mb-2 hover:bg-gray-200 rounded-md cursor-pointer text-gray-600 truncate ${m.id === chatId ? 'font-bold bg-gray-100' : ''}`}
      onClick={() => navigate(`/o/chat/${m.id}`)}
    >
      {m?.title || 'Untitled Chat'}
    </div>
  }