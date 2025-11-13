import api from "@/lib/api";

export const deviceService = {
  async getAll() {
    const res = await api.get("/devices/");
    return res.data;
  },
  async getById(id: string) {
    const res = await api.get(`/devices/${id}/`);
    return res.data;
  },
  async create(data: any) {
    // Sanitizar payload: solo enviar campos esperados y asegurar metadata como objeto
    const payload: any = {
      name: String(data?.name || "").trim(),
      device_type: String(data?.device_type || "sensor").trim(),
      description: typeof data?.description === "string" ? data.description : undefined,
    };
    if (data?.metadata !== undefined) {
      payload.metadata = typeof data.metadata === "object" && data.metadata !== null ? data.metadata : {};
    }
    if (data?.location !== undefined) payload.location = data.location;
    if (data?.latitude !== undefined) payload.latitude = data.latitude;
    if (data?.longitude !== undefined) payload.longitude = data.longitude;

    const res = await api.post("/devices/", payload);
    return res.data;
  },
  async update(id: string, data: any) {
    const res = await api.put(`/devices/${id}/`, data);
    return res.data;
  },
  async delete(id: string) {
    const res = await api.delete(`/devices/${id}/`);
    return res.data;
  },
};
