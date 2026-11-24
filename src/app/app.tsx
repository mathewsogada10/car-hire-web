import { message, request } from "../services/api";
import { EntityPage } from "../pages/entity-page";
import { Notice } from "../components/notice";
import { Dashboard } from "../pages/dashboard";
import { DataManagement } from "../pages/data-management";
import { Evidence } from "../pages/evidence";
import { Login } from "../features/auth/login";
import { schemas } from "../features/records/schemas";
import { ReminderStatus } from "../features/reminders/reminder-status";
import { useWorkspace } from "./use-workspace";
import { useAppearance } from "../features/appearance/use-appearance";
import type { AppearanceState } from "../features/appearance/appearance";
import { SettingsPage } from "../pages/settings";
import { WorkspaceShell } from "./workspace-shell";
import { FinancialReport } from "../pages/financial-report";

export function App({
  initialAppearance,
}: {
  initialAppearance: AppearanceState;
}) {
  const appearance = useAppearance(initialAppearance);
  const {
    view,
    navigate,
    authenticated,
    setAuthenticated,
    opened,
    setOpened,
    checked,
    error,
    setError,
  } = useWorkspace();
  return (
    <>
      <a className="skip" href="#workspace">
        Skip to content
      </a>
      <WorkspaceShell
        authenticated={authenticated}
        view={view}
        onNavigate={navigate}
        onSignOut={async () => {
          try {
            await request("/auth/logout", { method: "POST" });
            setAuthenticated(false);
            setOpened(false);
          } catch (e) {
            setError(message(e));
          }
        }}
      >
        <div className="content">
          <Notice error={error} />
          {authenticated && <ReminderStatus settings={view === "settings"} />}
          {opened &&
            (view === "dashboard" ? (
              <Dashboard />
            ) : view === "financial" ? (
              <FinancialReport />
            ) : view === "data" ? (
              <DataManagement />
            ) : view === "audit" ? (
              <Evidence audit />
            ) : view === "sync" ? (
              <Evidence />
            ) : view === "settings" ? (
              <SettingsPage appearance={appearance} />
            ) : schemas[view] ? (
              <EntityPage key={view} kind={view} />
            ) : (
              <h1>Page not found</h1>
            ))}
        </div>
      </WorkspaceShell>
      {checked && !authenticated && (
        <Login
          done={() => {
            setAuthenticated(true);
            setOpened(true);
          }}
        />
      )}
    </>
  );
}
