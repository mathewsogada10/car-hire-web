import { useEffect, useState } from "react";
import { api, message } from "../services/api";

export function useWorkspace() {
  const [view, setView] = useState(
    new URLSearchParams(location.search).get("view") ?? "dashboard",
  );
  const [authenticated, setAuthenticated] = useState(false);
  const [opened, setOpened] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/auth/me")
      .then(() => {
        setAuthenticated(true);
        setOpened(true);
      })
      .catch((e) => {
        if (!(e instanceof Error && e.message.includes("Session expired")))
          setError(message(e));
      })
      .finally(() => setChecked(true));
    const expired = () => setAuthenticated(false);
    const pop = () =>
      setView(new URLSearchParams(location.search).get("view") ?? "dashboard");
    window.addEventListener("session-expired", expired);
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener("session-expired", expired);
      window.removeEventListener("popstate", pop);
    };
  }, []);
  function navigate(next: string) {
    history.pushState(null, "", `?view=${next}`);
    setView(next);
  }

  return {
    view,
    navigate,
    authenticated,
    setAuthenticated,
    opened,
    setOpened,
    checked,
    error,
    setError,
  };
}
