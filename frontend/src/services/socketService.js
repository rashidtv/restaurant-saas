class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
  }

  async connect(backendUrl) {
    if (this.socket && this.isConnected) {
      console.log('🔌 WebSocket already connected');
      return this.socket;
    }

    try {
      // Dynamic import to avoid SSR/build issues
      const socketIO = await import('socket.io-client');
      const io = socketIO.default || socketIO;

      this.socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.setupEventHandlers();
      return this.socket;
    } catch (error) {
      console.error('🔌 Failed to initialize WebSocket:', error);
      return null;
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected successfully');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.isConnected = false;
    });

    // Register all custom event handlers
    this.eventHandlers.forEach((handler, event) => {
      this.socket.on(event, handler);
    });
  }

  on(event, handler) {
    this.eventHandlers.set(event, handler);
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event, handler) {
    this.eventHandlers.delete(event);
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventHandlers.clear();
      console.log('🔌 WebSocket disconnected');
    }
  }

  getSocket() {
    return this.socket;
  }

  getIsConnected() {
    return this.isConnected;
  }
}

// Singleton instance
export const socketService = new SocketService();
export default socketService;