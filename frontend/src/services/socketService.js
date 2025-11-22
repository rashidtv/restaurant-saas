import { io } from 'socket.io-client';
import { CONFIG } from '../constants/config';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to WebSocket...');
        
        this.socket = io(CONFIG.SOCKET_URL, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          withCredentials: true
        });

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error.message);
          this.isConnected = false;
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('⚠️ Max WebSocket reconnection attempts reached');
            reject(error);
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 WebSocket disconnected:', reason);
          this.isConnected = false;
        });

        this.socket.on('error', (error) => {
          console.error('❌ WebSocket error:', error);
        });

      } catch (error) {
        console.error('🚨 WebSocket initialization error:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      // Remove all listeners
      this.listeners.forEach((callback, event) => {
        this.socket.off(event, callback);
      });
      this.listeners.clear();
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected');
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      // Store listener for cleanup
      this.listeners.set(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      this.listeners.delete(event);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
      return true;
    } else {
      console.warn('⚠️ WebSocket not connected, cannot emit:', event);
      return false;
    }
  }

  // Helper method to check connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    };
  }
}

// Create and export singleton instance
export const socketService = new SocketService();
export default socketService;