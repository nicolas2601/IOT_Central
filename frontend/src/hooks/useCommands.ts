"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commandService } from "@/services/commandService";

export const useCommands = (deviceId?: string) => {
  const queryClient = useQueryClient();

  // Obtener lista de comandos
  const { data: commands, isLoading, refetch } = useQuery({
    queryKey: deviceId ? ["commands", deviceId] : ["commands"],
    queryFn: () =>
      deviceId ? commandService.getByDevice(deviceId) : commandService.getAll(),
  });

  // Enviar nuevo comando
  const sendCommand = useMutation({
    mutationFn: ({
      deviceId,
      command,
      params,
    }: {
      deviceId: string;
      command: string;
      params?: any;
    }) => commandService.sendCommand(deviceId, command, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commands"] });
    },
  });

  // Consultar estado de comando
  const getStatus = async (commandId: string) => {
    return await commandService.getStatus(commandId);
  };

  return {
    commands: commands || [],
    isLoading,
    refetch,
    sendCommand,
    getStatus,
  };
};
