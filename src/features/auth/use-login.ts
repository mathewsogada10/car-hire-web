import { useState } from "react";
import type { FormEvent } from "react";
import { csrf, message, request } from "../../services/api";

export function useLogin(done: () => void) {
  const [username, setUsername] = useState("owner");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await csrf();
      await request("/auth/login", {
        method: "POST",
        body: new URLSearchParams({ username, password }),
      });
      setPassword("");
      await csrf();
      done();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  return { username, setUsername, password, setPassword, error, busy, submit };
}
