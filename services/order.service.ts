import { Order, Address } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    items: [],
    total: 459.00,
    status: 'delivered',
    createdAt: new Date('2024-01-15'),
    shippingAddress: {
      id: 'addr_1',
      name: 'Home',
      street: '123 Fashion Ave',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States',
      isDefault: true,
    },
    trackingNumber: 'TRK123456789',
  },
  {
    id: 'ORD-2024-002',
    items: [],
    total: 285.00,
    status: 'shipped',
    createdAt: new Date('2024-01-20'),
    shippingAddress: {
      id: 'addr_1',
      name: 'Home',
      street: '123 Fashion Ave',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States',
      isDefault: true,
    },
    trackingNumber: 'TRK987654321',
  },
  {
    id: 'ORD-2024-003',
    items: [],
    total: 175.00,
    status: 'processing',
    createdAt: new Date('2024-01-22'),
    shippingAddress: {
      id: 'addr_2',
      name: 'Office',
      street: '456 Business St',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'United States',
      isDefault: false,
    },
  },
];

export const orderService = {
  async getOrders(): Promise<Order[]> {
    await delay(300);
    return mockOrders;
  },

  async getOrderById(id: string): Promise<Order | null> {
    await delay(200);
    return mockOrders.find(o => o.id === id) || null;
  },

  async createOrder(order: Omit<Order, 'id' | 'status' | 'createdAt'>): Promise<Order> {
    await delay(500);
    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
    };
    mockOrders.unshift(newOrder);
    return newOrder;
  },
};

export const addressService = {
  async getAddresses(): Promise<Address[]> {
    await delay(200);
    return [
      {
        id: 'addr_1',
        name: 'Home',
        street: '123 Fashion Ave',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States',
        isDefault: true,
      },
      {
        id: 'addr_2',
        name: 'Office',
        street: '456 Business St',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        country: 'United States',
        isDefault: false,
      },
    ];
  },

  async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    await delay(300);
    return { ...address, id: `addr_${Date.now()}` };
  },

  async updateAddress(id: string, address: Partial<Address>): Promise<Address> {
    await delay(300);
    return { id, ...address } as Address;
  },

  async deleteAddress(id: string): Promise<void> {
    await delay(200);
  },
};
