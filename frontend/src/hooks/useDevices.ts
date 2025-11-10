"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deviceService } from "@/services/deviceService";
import { useAuthStore } from "@/store/authStore";

export function useDevices() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: deviceService.getAll,
  });

  const createDevice = useMutation({
    mutationFn: deviceService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });

  const deleteDevice = useMutation({
    mutationFn: deviceService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }),
  });

  const rawDevices = Array.isArray(data) ? data : data?.results || [];
  // No filtrar por dueño en el cliente: el backend ya aplica permisos.
  // Además, el listado usa DeviceListSerializer que no incluye 'owner'.
  const devicesForUser = rawDevices;

  return {
    devices: devicesForUser,
    isLoading,
    refetch,
    createDevice,
    deleteDevice,
  };
}
