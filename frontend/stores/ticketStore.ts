/**
 * ECHO Ticket Store (Zustand)
 * Keeps mock tickets intact while adding local purchased-ticket persistence for MVP demos.
 * Production should replace this with the authenticated ticket API + offline ticket cache.
 */
import { create } from 'zustand';
import { Ticket } from '../types';
import { MOCK_TICKETS } from '../services/mock';
import { getJSON, setJSON } from '../services/persistence';

const PURCHASED_TICKETS_KEY = 'echo.wallet.purchasedTickets.v1';

function mergeTickets(mockTickets: Ticket[], purchasedTickets: Ticket[]) {
  const seen = new Set<string>();
  return [...purchasedTickets, ...mockTickets].filter((ticket) => {
    if (seen.has(ticket.id)) return false;
    seen.add(ticket.id);
    return true;
  });
}

function isTicketUsable(ticket: Ticket) {
  const ticketStatus = ticket.access_status || ticket.status;
  return ticket.status === 'active' && ticketStatus === 'active' && ticket.payment_status !== 'refunded';
}

interface TicketState {
  tickets: Ticket[];
  isLoading: boolean;
  lastPurchasedTicketId: string | null;

  fetchTickets: () => Promise<void>;
  hydratePurchasedTickets: () => Promise<void>;
  getTicketById: (id: string) => Ticket | undefined;
  hasPurchasedEvent: (eventId: string) => boolean;
  getActiveTickets: () => Ticket[];
  getPastTickets: () => Ticket[];
  addTicket: (ticket: Ticket) => void;
  clearLastPurchased: () => void;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: MOCK_TICKETS,
  isLoading: false,
  lastPurchasedTicketId: null,

  fetchTickets: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 250));
    const persisted = await getJSON<Ticket[]>(PURCHASED_TICKETS_KEY, []);
    set({ tickets: mergeTickets(MOCK_TICKETS, persisted), isLoading: false });
  },

  hydratePurchasedTickets: async () => {
    const persisted = await getJSON<Ticket[]>(PURCHASED_TICKETS_KEY, []);
    set({ tickets: mergeTickets(MOCK_TICKETS, persisted) });
  },

  getTicketById: (id) => get().tickets.find((t) => t.id === id),

  hasPurchasedEvent: (eventId) =>
    get().tickets.some((t) => t.event_id === eventId && isTicketUsable(t)),

  getActiveTickets: () => get().tickets.filter(isTicketUsable),

  getPastTickets: () => get().tickets.filter((t) => !isTicketUsable(t)),

  /** Add a newly purchased ticket to the store and persist only local purchases. */
  addTicket: (ticket) => {
    set((state) => ({
      tickets: mergeTickets(state.tickets, [ticket]),
      lastPurchasedTicketId: ticket.id,
    }));
    void getJSON<Ticket[]>(PURCHASED_TICKETS_KEY, []).then((existing) => {
      const next = mergeTickets([], [ticket, ...existing]);
      return setJSON(PURCHASED_TICKETS_KEY, next);
    });
  },

  clearLastPurchased: () => set({ lastPurchasedTicketId: null }),
}));
