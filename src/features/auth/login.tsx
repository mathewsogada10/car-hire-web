import { Notice } from "../../components/notice";
import { useLogin } from "./use-login";

export function Login({ done }: { done: () => void }) {
  const { username, setUsername, password, setPassword, error, busy, submit } =
    useLogin(done);
  return (
    <div className="overlay login">
      <form className="dialog" onSubmit={submit}>
        <div className="brand-mark">CH</div>
        <p className="eyebrow">CAR HIRE MANAGEMENT</p>
        <h1>Welcome back.</h1>
        <p className="muted">Sign in to your private owner workspace.</p>
        <label>
          Username
          <input
            autoFocus
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <Notice error={error} />
        <button disabled={busy}>
          {busy ? "Signing in..." : "Sign in securely"}
        </button>
      </form>
    </div>
  );
}
