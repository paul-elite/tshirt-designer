import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '../services/api';
import type { CartItem, TShirtSize, TShirtStyle, TShirtMaterial, PrintArea } from '../types';

interface LocalCartItem {
  id: string;
  designId: string;
  designName: string;
  thumbnailUrl?: string;
  canvasData: string;
  size: TShirtSize;
  color: string;
  colorName: string;
  style: TShirtStyle;
  material: TShirtMaterial;
  printArea: PrintArea;
  quantity: number;
  pricePerUnit: number;
}

interface CartState {
  items: CartItem[];
  localItems: LocalCartItem[];
  isLoading: boolean;
  subtotal: number;
  fetchCart: () => Promise<void>;
  addToCart: (item: Omit<LocalCartItem, 'id'>) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncLocalCart: () => Promise<void>;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      localItems: [],
      isLoading: false,
      subtotal: 0,

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const response = await cartApi.get();
          set({
            items: response.data.items,
            subtotal: response.data.subtotal,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      addToCart: async (item) => {
        const token = localStorage.getItem('token');

        if (token) {
          // User is logged in, add to server cart
          try {
            await cartApi.addItem({
              designId: item.designId,
              size: item.size,
              color: item.color,
              colorName: item.colorName,
              style: item.style,
              material: item.material,
              printArea: item.printArea,
              quantity: item.quantity,
            });
            await get().fetchCart();
          } catch (error) {
            console.error('Failed to add to cart:', error);
            throw error;
          }
        } else {
          // User is not logged in, add to local cart
          const localItems = get().localItems;
          const existingIndex = localItems.findIndex(
            (i) =>
              i.designId === item.designId &&
              i.size === item.size &&
              i.color === item.color &&
              i.style === item.style &&
              i.material === item.material &&
              i.printArea === item.printArea
          );

          if (existingIndex >= 0) {
            const newItems = [...localItems];
            newItems[existingIndex].quantity += item.quantity;
            set({ localItems: newItems });
          } else {
            set({
              localItems: [
                ...localItems,
                { ...item, id: `local-${Date.now()}` },
              ],
            });
          }
        }
      },

      updateQuantity: async (id, quantity) => {
        const token = localStorage.getItem('token');

        if (token) {
          try {
            await cartApi.updateItem(id, quantity);
            await get().fetchCart();
          } catch (error) {
            console.error('Failed to update quantity:', error);
            throw error;
          }
        } else {
          const localItems = get().localItems.map((item) =>
            item.id === id ? { ...item, quantity } : item
          );
          set({ localItems });
        }
      },

      removeItem: async (id) => {
        const token = localStorage.getItem('token');

        if (token) {
          try {
            await cartApi.removeItem(id);
            await get().fetchCart();
          } catch (error) {
            console.error('Failed to remove item:', error);
            throw error;
          }
        } else {
          const localItems = get().localItems.filter((item) => item.id !== id);
          set({ localItems });
        }
      },

      clearCart: async () => {
        const token = localStorage.getItem('token');

        if (token) {
          try {
            await cartApi.clear();
            set({ items: [], subtotal: 0 });
          } catch (error) {
            console.error('Failed to clear cart:', error);
            throw error;
          }
        } else {
          set({ localItems: [] });
        }
      },

      syncLocalCart: async () => {
        const localItems = get().localItems;
        if (localItems.length === 0) return;

        // Sync local items to server after login
        for (const item of localItems) {
          try {
            await cartApi.addItem({
              designId: item.designId,
              size: item.size,
              color: item.color,
              colorName: item.colorName,
              style: item.style,
              material: item.material,
              printArea: item.printArea,
              quantity: item.quantity,
            });
          } catch {
            // Item might not exist anymore
          }
        }

        set({ localItems: [] });
        await get().fetchCart();
      },

      getItemCount: () => {
        const token = localStorage.getItem('token');
        if (token) {
          return get().items.reduce((sum, item) => sum + item.quantity, 0);
        }
        return get().localItems.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ localItems: state.localItems }),
    }
  )
);
