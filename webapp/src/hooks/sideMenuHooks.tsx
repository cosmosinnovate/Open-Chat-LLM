import { AppDispatch, RootState } from "../store";
import { useCallback, useEffect } from "react";
import { baseURL } from "../service";
import { MessageResponse, setChat } from "../features/chat/chatSlice";

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