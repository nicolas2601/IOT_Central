class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(baseUrl: string) {
    this.url = baseUrl;
  }

  connect(deviceId: string, token: string) {
    const wsUrl = `${this.url}/telemetry/${deviceId}/?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit("telemetry", data);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.warn("WebSocket desconectado. Reintentando...");
      setTimeout(() => this.connect(deviceId, token), 3000);
    };
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export default WebSocketClient;
