import {
  Button,
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  ThemeIcon,
  Badge,
} from "@mantine/core";
import {
  IconShieldLock,
  IconShieldOff,
  IconLockOpen,
  IconLockCode,
} from "@tabler/icons-react";
import { useAuditoriaStore } from "../../../stores/auditoria.store";
import { ModoAuditoriaService } from "../service/service";
import { useNotify } from "../../../hooks/useNotify";
import { useState } from "react";
import { motion } from "motion/react";
import { useTitlePage } from "../../../hooks/useTitlePage";

/**
 * Página oculta para activar/desactivar el Modo Auditoría.
 */
export default function ModoAuditoriaPage() {
  useTitlePage("Panel de Auditoría");
  const { en_modo_auditable, setModoAuditoria } = useAuditoriaStore();
  const { notifySuccess, notifyError } = useNotify();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const nuevoEstado = !en_modo_auditable;
    try {
      await ModoAuditoriaService.toggle(nuevoEstado);
      // El store se actualizará por el websocket, pero lo hacemos localmente también para feedback inmediato
      setModoAuditoria(nuevoEstado);
      notifySuccess(
        `Modo auditoría ${nuevoEstado ? "activado" : "desactivado"} con éxito`,
      );
    } catch (error) {
      console.error(error);
      notifyError("No se pudo cambiar el estado del modo auditoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" py={100}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          withBorder
          radius="xl"
          p={40}
          className="bg-zinc-900/40 backdrop-blur-md border-zinc-800 shadow-2xl shadow-indigo-900/10"
        >
          <Stack align="center" gap="xl">
            <ThemeIcon
              size={120}
              radius={100}
              variant="gradient"
              gradient={
                en_modo_auditable
                  ? { from: "red.6", to: "orange.6" }
                  : { from: "indigo.6", to: "cyan.6" }
              }
              className="shadow-lg"
            >
              {en_modo_auditable ? (
                <IconShieldLock size={60} stroke={1.5} />
              ) : (
                <IconShieldOff size={60} stroke={1.5} />
              )}
            </ThemeIcon>

            <Stack align="center" gap={4}>
              <Title order={1} className="text-white" fz={"3xl"} fw={800}>
                Panel de Auditoría
              </Title>
              <Group gap="xs">
                <Text c="zinc.4" fz="sm" fw={500}>
                  Estado actual:
                </Text>
                <Badge
                  variant="filled"
                  color={en_modo_auditable ? "red" : "indigo"}
                  size="sm"
                  radius="sm"
                  className="animate-pulse"
                >
                  {en_modo_auditable ? "ACTIVO" : "INACTIVO"}
                </Badge>
              </Group>
            </Stack>

            <Text c="zinc.4" ta="center" fz="md" className="max-w-md">
              {en_modo_auditable
                ? "El sistema está filtrando actualmente todos los registros sensibles marcados como auditables."
                : "El sistema está mostrando todos los registros, incluyendo aquellos marcados para auditoría."}
            </Text>

            <Button
              size="sm"
              radius="lg"
              variant="gradient"
              gradient={
                en_modo_auditable
                  ? { from: "teal.7", to: "teal.9" }
                  : { from: "red.7", to: "red.9" }
              }
              onClick={handleToggle}
              loading={loading}
              leftSection={
                en_modo_auditable ? (
                  <IconLockOpen size={24} />
                ) : (
                  <IconLockCode size={24} />
                )
              }
              className="hover:scale-[1.02] transition-transform active:scale-[0.98] h-16 text-lg"
            >
              {en_modo_auditable
                ? "Desactivar Modo Auditoría"
                : "Activar Modo Auditoría"}
            </Button>

            <Text c="zinc.6" fz="xs" ta="center">
              Esta acción se sincronizará en tiempo real con todos los usuarios
              conectados.
            </Text>
          </Stack>
        </Card>
      </motion.div>
    </Container>
  );
}
