import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify'; // Ensure react-toastify is installed
import { httpRequest } from '../http.request';
import { baseURL } from '../../service';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface MessageResponse {
  id?: string;
  messages?: Message[];
  title?: string;
  user_id?: string;
  created_ad: string;
}

interface MessageState {
  chat: MessageResponse[];
  loading: boolean;
}

const initialState: MessageState = {
  chat: [],
  loading: true,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {},
  extraReducers: (builder) => {

    builder.addCase(updateChatTitle.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(updateChatTitle.fulfilled, (state, action) => {
      state.loading = false;
      state.chat = state.chat.map(item => item.id == action.payload.id ? { ...item, ...action.payload } : item);
    });

    builder.addCase(updateChatTitle.rejected, (state) => {
      state.loading = false;
    });

      // remove chat history
    builder.addCase(removeChatHistory.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(removeChatHistory.fulfilled, (state, action) => {
      state.loading = false;
      state.chat = state.chat.filter((chat) => chat.id !== action.payload);
    });

    builder.addCase(removeChatHistory.rejected, (state) => {
      state.loading = false;
    });

    // Fetch chat history
    builder.addCase(fetchChatHistory.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(fetchChatHistory.fulfilled, (state, action) => {
      state.loading = false;
      state.chat = action.payload;
    });

    builder.addCase(fetchChatHistory.rejected, (state) => {
      state.loading = false;
    });
  },
});


export const updateChatTitle = createAsyncThunk("chat/updateChatTitle", 
  async ({chatId, title }: { chatId: string, title: string}, thunkAPI) => {
    const user = (thunkAPI.getState() as { auth: { user: { access_token: string }}}).auth.user;
    try {
      const response = await httpRequest({
        url: `${baseURL}/chats/${chatId}/title`,
        method: "PATCH",
        accessToken: user?.access_token,
        data: JSON.stringify({ title })
      });

      if (response?.status === 200) {
        const data = await response.json() as MessageResponse;
        console.log("UPDATE: ", data)
        return data;
      } else {
        toast.error(`Failed to update`);
        return thunkAPI.rejectWithValue("Failed to update");
      }
    } catch (error: unknown) {
      toast.error((error as Error)?.message || "Something went wrong");
      return thunkAPI.rejectWithValue("Something went wrong");
    }
  }
)

// Remove chat history
export const removeChatHistory = createAsyncThunk("chat/removeChatHistory",
  async (id: string, thunkAPI) => {
    const user = (thunkAPI.getState() as { auth: { user: { access_token: string } } }).auth.user;
    try {
      const response = await httpRequest({
        url: `${baseURL}/chats/${id}`,
        method: "DELETE",
        accessToken: user?.access_token
      });

      if (response?.status === 200) {
        toast.success(`Successfully removed`);
        return id; // Return the id on success for further processing if needed
      } else {
        toast.error(`Failed to remove history`);
        return thunkAPI.rejectWithValue(`Failed to remove history`); // Reject with a specific error message
      }
    } catch (error: unknown) {
      toast.error((error as Error)?.message || "User not authenticated");
      return thunkAPI.rejectWithValue(error); // Reject with the error
    }
  });

// Fetch chat history
export const fetchChatHistory = createAsyncThunk(
  'chat/fetchChatHistory',
  async (_, thunkAPI) => {
    const user = (thunkAPI.getState() as { auth: { user: { access_token: string } } }).auth.user;
    try {
      const response = await httpRequest({
        url: `${baseURL}/chats`,
        method: 'GET',
        accessToken: user.access_token
      });
      const data = await response.json();
      return data as MessageResponse[];
    } catch (error) {
      toast.error('Failed to fetch chat history');
      return thunkAPI.rejectWithValue(error);
    }
  });


export default chatSlice.reducer;
