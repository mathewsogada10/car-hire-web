import { message } from "../../services/api";
import { Notice } from "../../components/notice";
import { useReminders } from "./use-reminders";

export function ReminderStatus({ settings }: { settings: boolean }) {
  const { due, enabled, error, setError, permission, setPermission } =
    useReminders(settings);
  return (
    <>
      <Notice error={error} />
      {enabled && (
        <p className="muted" role="status">
          {due} reminder(s) due. Browser delivery requires this workspace to
          remain open.
        </p>
      )}
      {settings && (
        <div className="panel">
          <h2>Browser reminder delivery</h2>
          <p>
            Permission: {permission}. Enable reminders and complete the
            configuration below. Notifications contain no customer details.
          </p>
          <button
            className="quiet"
            disabled={permission === "unsupported"}
            onClick={() => {
              Notification.requestPermission()
                .then(setPermission)
                .catch((e) => setError(message(e)));
            }}
          >
            Enable browser notifications
          </button>
        </div>
      )}
    </>
  );
}
