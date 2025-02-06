import { AppDispatch, RootState } from "../store";
import { useCallback, useEffect } from "react";
import { baseURL } from "../service";
import { MessageResponse, setChat } from "../features/chat/chatSlice";
import { httpRequest } from "../features/http.request";

export function useFetchHook(dispatch: AppDispatch, user: RootState['auth']['user']) {
  const fetchUserChats = useCallback(async () => {
    try {
      const response = await httpRequest({ url: `${baseURL}/chats`, method: "GET", accessToken: user?.access_token});
      const fetchedChats: MessageResponse[] = await response?.json();
      console.log('fetchedChats:', fetchedChats);
      dispatch(setChat(fetchedChats));

    } catch (e) {
      throw Error(`Something happened: ${e}`)
    }
  }, [dispatch, user?.access_token])

  useEffect(() => {
    fetchUserChats()
  }, [fetchUserChats])
}