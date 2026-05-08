import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { migrateGuestReservations } from '@/lib/cart';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, jwtToken: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (user, jwtToken) => {
        set({ user, isAuthenticated: true, isLoading: false });
        // Migrate guest reservations to user account after login
        try {
          await migrateGuestReservations(jwtToken);
        } catch (error) {
          console.error('Failed to migrate guest reservations:', error);
          // Continue with login even if migration fails
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
