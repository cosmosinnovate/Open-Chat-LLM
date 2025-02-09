// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice'
import chatReducer from './features/chat/chatSlice'
import { useDispatch } from 'react-redux';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;
