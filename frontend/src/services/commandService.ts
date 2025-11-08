import api from "./api";

export const commandService = {
  /**
   * Obtener todos los comandos enviados
   */
  async getAll() {
    const res = await api.get("/commands/");
    return res.data;
  },

  /**
   * Obtener los comandos de un dispositivo específico
   */
  async getByDevice(deviceId: string) {
    const res = await api.get(`/commands/?device_id=${deviceId}`);
    return res.data;
  },

  /**
   * Enviar un nuevo comando a un dispositivo
   */
  async sendCommand(deviceId: string, command: string, params?: any) {
    const res = await api.post("/commands/send/", {
      device_id: deviceId,
      command,
      params,
    });
    return res.data;
  },

  /**
   * Consultar el estado de un comando específico
   */
  async getStatus(commandId: string) {
    const res = await api.get(`/commands/${commandId}/`);
    return res.data;
  },
};
