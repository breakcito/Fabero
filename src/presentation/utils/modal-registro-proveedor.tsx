import { ModalEstandar } from "./modal-estandar";
import { RegistroProveedor } from "../../modules/proveedores-mineros/presentation/registro-proveedor/registro-proveedor";
import type { ProveedorResponse } from "../../modules/proveedores-mineros/service/proveedores.responses";

interface Props {
  opened: boolean;
  onClose: () => void;
  onSuccess: (proveedor: ProveedorResponse) => void;
}

export const ModalRegistroProveedor = ({ opened, onClose, onSuccess }: Props) => {
  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Registrar Nuevo Proveedor Minero"
      size="lg"
    >
      <RegistroProveedor
        onCancel={onClose}
        onSuccess={(nuevoProveedor) => {
          onSuccess(nuevoProveedor);
          onClose();
        }}
      />
    </ModalEstandar>
  );
};
