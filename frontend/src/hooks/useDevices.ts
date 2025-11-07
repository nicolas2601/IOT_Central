"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deviceService } from "@/services/deviceService";

export function useDevices() {
  const queryClient = useQueryClient();

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

  return {
  devices: Array.isArray(data) ? data : data?.results || [],
  isLoading,
  refetch,
  createDevice,
  deleteDevice,
};
}
