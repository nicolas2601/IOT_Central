class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Set<Function>> = new Map();
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private shouldReconnect = true;

  constructor(baseUrl: string) {
    this.url = baseUrl;
  }

  connect(deviceId: string, token: string) {
    this.shouldReconnect = true;
    const wsUrl = `${this.url}/telemetry/${deviceId}/?token=${token}`;
    this.ws = new WebSocket(wsUrl);
    this.status = 'connecting';
    this.emit('status', this.status);

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "telemetry" && payload?.data) {
          // Emitir solo el bloque de datos de telemetría
          this.emit("telemetry", payload.data);
        } else {
          // Ignorar otros tipos o formatos
          console.debug("Mensaje WS ignorado", payload);
        }
      } catch (e) {
        console.error("WS message parsing error:", e);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.status = 'error';
      this.emit('status', this.status);
      this.emit('error', { message: 'WebSocket error', detail: error });
    };

    this.ws.onclose = (event) => {
      this.status = 'disconnected';
      this.emit('status', this.status);
      if (this.shouldReconnect) {
        console.warn("WebSocket desconectado. Reintentando...", { code: event.code, reason: event.reason });
        setTimeout(() => this.connect(deviceId, token), 3000);
      } else {
        console.info("WebSocket cerrado manualmente", { code: event.code, reason: event.reason });
      }
    };

    this.ws.onopen = () => {
      this.status = 'connected';
      this.emit('status', this.status);
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
    // Evitar reconexión automática tras cierre manual
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
    this.status = 'disconnected';
    this.emit('status', this.status);
  }
}

export default WebSocketClient;
