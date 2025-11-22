import { CONFIG } from '../constants/config';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
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

      } catch (error) {
        console.error('🚨 WebSocket initialization error:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected');
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ WebSocket not connected, cannot emit:', event);
    }
  }
}

export const socketService = new SocketService();