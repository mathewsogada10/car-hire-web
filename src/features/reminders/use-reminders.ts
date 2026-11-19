import { useEffect, useState } from "react";
import { api, list, message } from "../../services/api";
import { allRecords } from "../../services/all-records";
import { dueReminders, backupReminderDue } from "./reminder-dates";

export function useReminders(settings: boolean) {
  const [due, setDue] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const [permission, setPermission] = useState(
    "Notification" in window ? Notification.permission : "unsupported",
  );
  useEffect(() => {
    let active = true;
    let running = false;
    async function poll() {
      if (running) return;
      running = true;
      try {
        const config = (await list("settings")).items[0]?.data;
        if (!config?.remindersEnabled) {
          if (active) {
            setEnabled(false);
            setDue(0);
          }
          return;
        }
        if (active) setEnabled(true);
        const now = new Date(Date.now() + 3 * 3600000).toISOString();
        const today = now.slice(0, 10);
        const entries = dueReminders(
          await allRecords("reminders"),
          await allRecords("vehicles"),
          today,
          Number(config.reminderLeadDays),
        );
        const health = await api<{ lastExport: { created_at: string }[] }>(
          "/data-health",
        );
        const last = health.lastExport[0]?.created_at;
        const ids = entries.map((r) => r.id);
        if (backupReminderDue(last, today, Number(config.backupReminderDays)))
          ids.push("backup-export-age");
        if (active) {
          setDue(ids.length);
          setError("");
        }
        if (
          "Notification" in window &&
          Notification.permission === "granted" &&
          now.slice(11, 16) >= String(config.reminderTime)
        )
          for (const id of ids) {
            const key = `carhire-reminder:${id}:${today}`;
            if (!localStorage.getItem(key)) {
              new Notification("Car Hire reminder due", {
                body: "Open your private workspace to view due reminders.",
                tag: key,
              });
              localStorage.setItem(key, "delivered");
            }
          }
      } catch (e) {
        if (active) setError(`Reminder check failed: ${message(e)}`);
      } finally {
        running = false;
      }
    }
    void poll();
    const interval = setInterval(() => {
      void poll();
    }, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [settings]);
  return { due, enabled, error, setError, permission, setPermission };
}
