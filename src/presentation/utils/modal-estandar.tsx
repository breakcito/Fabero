import { Modal, type ModalProps } from "@mantine/core";

interface ModalEstandarProps extends Partial<ModalProps> {
  opened: boolean;
  close: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  rightSection?: React.ReactNode;
}

export const ModalEstandar = ({
  opened,
  close,
  title,
  children,
  size,
  zIndex,
  rightSection,
  ...props
}: ModalEstandarProps) => {
  return (
    <Modal
      opened={opened}
      onClose={close}
      size={size || "md"}
      zIndex={zIndex}
      title={
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-1 h-6 bg-linear-to-b from-[#ffc933] to-[#b8920a] 
                rounded-full shadow-[0_0_10px_#d4a50a]"
            />
            <span
              className="text-xl font-bold bg-linear-to-r from-white via-zinc-100 
                to-zinc-400 bg-clip-text text-transparent tracking-tight leading-none"
            >
              {title}
            </span>
          </div>
          {rightSection && (
            <div className="flex items-center flex-none mr-4">{rightSection}</div>
          )}
        </div>
      }
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      radius="xl"
      classNames={{
        content: "bg-zinc-950 border border-white/10 shadow-2xl shadow-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        header: "bg-zinc-950 text-white pt-5 pb-1 px-6",
        body: "bg-zinc-950 px-6 pt-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        close: `text-zinc-400 hover:text-white hover:bg-white/10 transition-all 
          duration-200 rounded-full w-8 h-8 flex items-center justify-center`,
        title: "text-xl font-bold text-white flex-1",
      }}
      transitionProps={{ transition: "pop", duration: 250 }}
      {...props}
    >
      <div className="pt-3">{children}</div>
    </Modal>
  );
};
