import { AppearanceSettings } from "../features/appearance/appearance-settings";
import type { AppearanceController } from "../features/appearance/use-appearance";
import { EntityPage } from "./entity-page";

export function SettingsPage({
  appearance,
}: {
  appearance: AppearanceController;
}) {
  return (
    <>
      <AppearanceSettings appearance={appearance} />
      <EntityPage kind="settings" />
    </>
  );
}
