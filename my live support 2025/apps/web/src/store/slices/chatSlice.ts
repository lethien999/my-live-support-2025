import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '@/types/common';

interface ChatState {
  currentRoom: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  isConnected: boolean;
}

const initialState: ChatState = {
  currentRoom: null,
  messages: {},
  typingUsers: {},
  isConnected: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setCurrentRoom: (state, action: PayloadAction<string | null>) => {
      state.currentRoom = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ roomId: string; message: Message }>) => {
      const { roomId, message } = action.payload;
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      state.messages[roomId].push(message);
    },
    setMessages: (state, action: PayloadAction<{ roomId: string; messages: Message[] }>) => {
      const { roomId, messages } = action.payload;
      state.messages[roomId] = messages;
    },
    setTypingUsers: (state, action: PayloadAction<{ roomId: string; users: string[] }>) => {
      const { roomId, users } = action.payload;
      state.typingUsers[roomId] = users;
    },
    clearChat: (state) => {
      state.currentRoom = null;
      state.messages = {};
      state.typingUsers = {};
    },
  },
});

export const {
  setConnected,
  setCurrentRoom,
  addMessage,
  setMessages,
  setTypingUsers,
  clearChat,
} = chatSlice.actions;
export default chatSlice.reducer;
