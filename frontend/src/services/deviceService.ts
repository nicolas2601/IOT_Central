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
    const res = await api.post("/devices/", data);
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
