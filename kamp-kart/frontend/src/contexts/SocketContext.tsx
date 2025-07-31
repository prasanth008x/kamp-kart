import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);

      // Authenticate user with socket
      if (user) {
        newSocket.emit('authenticate', { userId: user.id });
        newSocket.emit('join-user-room', user.id);

        // Join admin room if user is admin
        if (user.isAdmin) {
          newSocket.emit('join-admin', { isAdmin: true });
        }
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Order confirmation handler
    newSocket.on('order-confirmation', (data) => {
      console.log('Order confirmation received:', data);
      // You can show a toast notification here
    });

    // Cart sync handler
    newSocket.on('cart-sync', (data) => {
      console.log('Cart sync received:', data);
      // This will be handled by CartContext
    });

    // Admin notifications
    newSocket.on('new-order', (data) => {
      console.log('New order notification:', data);
      // This will be handled by AdminContext
    });

    setSocket(newSocket);

    // Connect the socket
    if (isAuthenticated) {
      newSocket.connect();
    }

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      newSocket.removeAllListeners();
    };
  }, []);

  // Handle authentication changes
  useEffect(() => {
    if (socket) {
      if (isAuthenticated && user) {
        if (!socket.connected) {
          socket.connect();
        } else {
          // Re-authenticate if already connected
          socket.emit('authenticate', { userId: user.id });
          socket.emit('join-user-room', user.id);

          if (user.isAdmin) {
            socket.emit('join-admin', { isAdmin: true });
          }
        }
      } else {
        // Disconnect socket when user logs out
        if (socket.connected) {
          socket.disconnect();
        }
      }
    }
  }, [socket, isAuthenticated, user]);

  const value: SocketContextType = {
    socket,
    isConnected,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket;
};

export const useSocketConnection = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketConnection must be used within a SocketProvider');
  }
  return context;
};