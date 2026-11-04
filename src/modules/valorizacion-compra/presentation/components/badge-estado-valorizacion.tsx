import { Badge } from "@mantine/core";
import { EstadoValorizacionCompra } from "../../../../shared/enums/valorizacion-compra/estado-valorizacion-compra";

export const BadgeEstadoValorizacion = ({
  estado,
  size = "xs",
}: {
  estado: EstadoValorizacionCompra;
  size?: "xs" | "sm" | "md";
}) => {
  switch (estado) {
    case EstadoValorizacionCompra.Propuesta:
      return (
        <Badge color="yellow" variant="light" size={size} fw={700}>
          Propuesta
        </Badge>
      );
    case EstadoValorizacionCompra.Aprobado:
      return (
        <Badge color="teal" variant="filled" size={size} fw={700}>
          Aprobado
        </Badge>
      );
    case EstadoValorizacionCompra.Desestimada:
      return (
        <Badge color="gray" variant="light" size={size} fw={600}>
          Desestimada
        </Badge>
      );
    case EstadoValorizacionCompra.Anulado:
      return (
        <Badge color="red" variant="light" size={size} fw={700}>
          Anulado
        </Badge>
      );
    default:
      return (
        <Badge color="gray" variant="outline" size={size}>
          {estado}
        </Badge>
      );
  }
};
