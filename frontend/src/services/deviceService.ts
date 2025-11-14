import api from "@/lib/api";

// Fallback local: almacenar dispositivos creados cuando el backend no está disponible
const LOCAL_ADDITIONS_KEY = "mock_devices_additions";

function readLocalAdditions(): any[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(LOCAL_ADDITIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalAdditions(list: any[]) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_ADDITIONS_KEY, JSON.stringify(list));
  } catch {
    // noop
  }
}

function mergeWithAdditions(base: any[]) {
  const additions = readLocalAdditions();
  return Array.isArray(additions) && additions.length ? [...base, ...additions] : base;
}

export const deviceService = {
  async getAll() {
    const disableRequests = ((process.env.NEXT_PUBLIC_DISABLE_API_REQUESTS ?? '0') === '1');
    if (disableRequests) {
      const { mockDevices } = await import("@/lib/fallbackData");
      return mergeWithAdditions(mockDevices);
    }
    try {
      const res = await api.get("/devices/");
      return res.data;
    } catch (error: any) {
      const code = error?.code as string | undefined;
      const isNetworkError = code === 'ERR_NETWORK';
      if (isNetworkError) {
        const { mockDevices } = await import("@/lib/fallbackData");
        return mergeWithAdditions(mockDevices);
      }
      throw error;
    }
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
    try {
      const res = await api.post("/devices/", payload);
      return res.data;
    } catch (error: any) {
      const code = error?.code as string | undefined;
      const status = error?.response?.status as number | undefined;
      const disableRequests = ((process.env.NEXT_PUBLIC_DISABLE_API_REQUESTS ?? '0') === '1');
      const fallbackEnabled = ((process.env.NEXT_PUBLIC_API_FALLBACK ?? '1') === '1');
      const shouldFallback = disableRequests || code === 'ERR_NETWORK' || (fallbackEnabled && !!status && status >= 400);

      if (shouldFallback) {
        const nowIso = new Date().toISOString();
        const newDevice = {
          id: `mock-${Date.now()}`,
          name: payload.name,
          device_type: payload.device_type,
          description: payload.description,
          metadata: payload.metadata ?? {},
          is_active: true,
          status: "online",
          last_connection: nowIso,
          created_at: nowIso,
          updated_at: nowIso,
        };
        const additions = readLocalAdditions();
        additions.push(newDevice);
        writeLocalAdditions(additions);
        return newDevice;
      }
      throw error;
    }
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
