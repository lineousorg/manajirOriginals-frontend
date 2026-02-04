import { User } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockUser: User = {
  id: 'user_1',
  email: 'emma@example.com',
  name: 'Emma Thompson',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
};

export const userService = {
  async login(email: string, password: string): Promise<User> {
    await delay(500);
    if (email && password) {
      return mockUser;
    }
    throw new Error('Invalid credentials');
  },

  async logout(): Promise<void> {
    await delay(200);
  },

  async getProfile(): Promise<User> {
    await delay(200);
    return mockUser;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    await delay(300);
    return { ...mockUser, ...data };
  },

  async register(email: string, password: string, name: string): Promise<User> {
    await delay(500);
    return {
      id: `user_${Date.now()}`,
      email,
      name,
    };
  },
};
