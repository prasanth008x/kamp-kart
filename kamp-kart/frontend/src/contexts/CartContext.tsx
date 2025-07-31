import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

// Types
interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    images: string[];
    stock: number;
    category: string;
    brand: string;
  };
  quantity: number;
  size?: string;
  color?: string;
  addedAt: Date;
  itemTotal: number;
}

interface CartSummary {
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  shipping: number;
  total: number;
}

interface CartState {
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  error: string | null;
}

interface CartContextType extends CartState {
  addToCart: (productId: string, quantity?: number, size?: string, color?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  moveToWishlist: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

// Actions
type CartAction =
  | { type: 'CART_LOADING' }
  | { type: 'CART_SUCCESS'; payload: { items: CartItem[]; summary: CartSummary } }
  | { type: 'CART_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: CartState = {
  items: [],
  summary: {
    itemCount: 0,
    totalQuantity: 0,
    subtotal: 0,
    shipping: 0,
    total: 0,
  },
  isLoading: false,
  error: null,
};

// Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'CART_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'CART_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
        items: action.payload.items,
        summary: action.payload.summary,
      };
    case 'CART_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Provider
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  const socket = useSocket();

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      // Clear cart when user logs out
      dispatch({
        type: 'CART_SUCCESS',
        payload: {
          items: [],
          summary: {
            itemCount: 0,
            totalQuantity: 0,
            subtotal: 0,
            shipping: 0,
            total: 0,
          },
        },
      });
    }
  }, [isAuthenticated]);

  // Socket event listeners for real-time cart sync
  useEffect(() => {
    if (socket && user) {
      // Listen for cart sync from other devices
      socket.on('cart-sync', (cartData) => {
        dispatch({
          type: 'CART_SUCCESS',
          payload: cartData,
        });
      });

      return () => {
        socket.off('cart-sync');
      };
    }
  }, [socket, user]);

  const refreshCart = async () => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: 'CART_LOADING' });
      const response = await axios.get(`${API_URL}/cart`);
      dispatch({
        type: 'CART_SUCCESS',
        payload: {
          items: response.data.cart,
          summary: response.data.summary,
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.response?.data?.message || 'Failed to load cart',
      });
    }
  };

  const addToCart = async (productId: string, quantity = 1, size?: string, color?: string) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to cart');
    }

    try {
      dispatch({ type: 'CART_LOADING' });
      const response = await axios.post(`${API_URL}/cart/add`, {
        productId,
        quantity,
        size,
        color,
      });

      const cartData = {
        items: response.data.cart,
        summary: calculateSummary(response.data.cart),
      };

      dispatch({
        type: 'CART_SUCCESS',
        payload: cartData,
      });

      // Emit cart update for real-time sync
      if (socket) {
        socket.emit('cart-updated', cartData);
      }
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.response?.data?.message || 'Failed to add item to cart',
      });
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      dispatch({ type: 'CART_LOADING' });
      await axios.put(`${API_URL}/cart/update/${itemId}`, { quantity });
      await refreshCart();

      // Emit cart update for real-time sync
      if (socket) {
        socket.emit('cart-updated', { items: state.items, summary: state.summary });
      }
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.response?.data?.message || 'Failed to update quantity',
      });
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      dispatch({ type: 'CART_LOADING' });
      await axios.delete(`${API_URL}/cart/remove/${itemId}`);
      await refreshCart();

      // Emit cart update for real-time sync
      if (socket) {
        socket.emit('cart-updated', { items: state.items, summary: state.summary });
      }
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.response?.data?.message || 'Failed to remove item',
      });
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: 'CART_LOADING' });
      await axios.delete(`${API_URL}/cart/clear`);
      dispatch({
        type: 'CART_SUCCESS',
        payload: {
          items: [],
          summary: {
            itemCount: 0,
            totalQuantity: 0,
            subtotal: 0,
            shipping: 0,
            total: 0,
          },
        },
      });

      // Emit cart update for real-time sync
      if (socket) {
        socket.emit('cart-updated', { items: [], summary: initialState.summary });
      }
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.response?.data?.message || 'Failed to clear cart',
      });
      throw error;
    }
  };

  const moveToWishlist = async (itemId: string) => {
    try {
      dispatch({ type: 'CART_LOADING' });
      await axios.post(`${API_URL}/cart/move-to-wishlist/${itemId}`);
      await refreshCart();

      // Emit cart update for real-time sync
      if (socket) {
        socket.emit('cart-updated', { items: state.items, summary: state.summary });
      }
    } catch (error: any) {
      dispatch({
        type: 'CART_ERROR',
        payload: error.response?.data?.message || 'Failed to move item to wishlist',
      });
      throw error;
    }
  };

  // Helper function to calculate cart summary
  const calculateSummary = (items: CartItem[]): CartSummary => {
    const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    return {
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  };

  const value: CartContextType = {
    ...state,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    moveToWishlist,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};