import api from "./api";

export const telemetryService = {
  async getRecent(deviceId: string) {
    const res = await api.get(`/telemetry/${deviceId}/recent/`);
    return res.data;
  },
  async getHistory(deviceId: string, hours = 24) {
    const res = await api.get(`/telemetry/${deviceId}/history/?hours=${hours}`);
    return res.data;
  },
};
