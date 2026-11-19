import { Notice } from "../../components/notice";
import type { AppearanceController } from "./use-appearance";

export function AppearanceSettings({
  appearance,
}: {
  appearance: AppearanceController;
}) {
  return (
    <section className="panel" aria-labelledby="appearance-heading">
      <h2 id="appearance-heading">Appearance</h2>
      <label>
        Theme
        <select
          value={appearance.preference}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "system" || value === "light" || value === "dark")
              appearance.changeTheme(value);
          }}
          aria-describedby="theme-help"
        >
          <option value="system">System default</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <p className="muted" id="theme-help">
        Applies immediately, including sign-in. Saved on this browser only;
        System default follows your device appearance.
      </p>
      <Notice error={appearance.error} />
    </section>
  );
}
