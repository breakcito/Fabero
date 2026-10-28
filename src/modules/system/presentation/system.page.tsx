import { Tabs } from "@mantine/core";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { NavegacionTab } from "./tabs/navegacion.tab";

const SystemPage = () => {
  useTitlePage("System");
  return (
    <div className="space-y-4">
      <Tabs defaultValue="navegacion" color="indigo">
        <Tabs.List>
          <Tabs.Tab value="navegacion">Navegacion</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="navegacion" pt="md">
          <NavegacionTab />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default SystemPage;
