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

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "telemetry" && payload?.data) {
          // Emitir solo el bloque de datos de telemetría
          this.emit("telemetry", payload.data);
        } else {
          // Ignorar otros tipos o formatos
          // En producción evitamos logs en consola; la UI muestra estado
        }
      } catch (e) {
        // Emitir error de parseo sin usar consola
        this.emit('error', { message: 'Error al parsear mensaje de WS' });
      }
    };

    this.ws.onerror = (event: Event) => {
      this.status = 'error';
      this.emit('status', this.status);
      // El evento de error de WebSocket no expone detalles útiles en la mayoría de navegadores
      this.emit('error', { message: 'WebSocket error' });
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.status = 'disconnected';
      this.emit('status', this.status);
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(deviceId, token), 3000);
      } else {
        // Cierre manual solicitado
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
