import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Ticket, PaginatedResponse } from '@/types/common';

interface TicketState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  isLoading: boolean;
  filters: {
    status?: string;
    priority?: string;
    assignee?: string;
    q?: string;
  };
}

const initialState: TicketState = {
  tickets: [],
  currentTicket: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  isLoading: false,
  filters: {},
};

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTickets: (state, action: PayloadAction<PaginatedResponse<Ticket>>) => {
      state.tickets = action.payload.data;
      state.pagination = action.payload.pagination;
    },
    setCurrentTicket: (state, action: PayloadAction<Ticket | null>) => {
      state.currentTicket = action.payload;
    },
    updateTicket: (state, action: PayloadAction<Ticket>) => {
      const index = state.tickets.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tickets[index] = action.payload;
      }
      if (state.currentTicket?.id === action.payload.id) {
        state.currentTicket = action.payload;
      }
    },
    setFilters: (state, action: PayloadAction<Partial<TicketState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
});

export const {
  setLoading,
  setTickets,
  setCurrentTicket,
  updateTicket,
  setFilters,
  clearFilters,
} = ticketSlice.actions;
export default ticketSlice.reducer;
