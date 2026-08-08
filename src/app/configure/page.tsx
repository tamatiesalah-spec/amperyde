import { notFound } from "next/navigation";
import { getCatalogRepository } from "@/data";
import { Configurator } from "@/components/configurator/Configurator";

export const metadata = {
  title: "Design Your Own — AMPERYDE Off-Road",
};

export default async function ConfigurePage(props: PageProps<"/configure">) {
  const searchParams = await props.searchParams;
  const repo = getCatalogRepository();
  const catalog = await repo.getCatalog("off-road");
  if (!catalog) notFound();

  const presetId =
    typeof searchParams.preset === "string" ? searchParams.preset : undefined;
  const preset = presetId
    ? catalog.presets.find((p) => p.id === presetId)
    : undefined;

  return (
    <Configurator
      catalog={catalog}
      initialComponentIds={preset?.componentIds}
      presetName={preset?.name}
    />
  );
}
