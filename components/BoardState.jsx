export function BoardState({ state, onRetry }) {
  if (state.status === "missing") {
    return (
      <div className="state-panel state-panel--warning" role="alert">
        <span className="eyebrow">Setup needed</span>
        <h2>Supabase settings are missing</h2>
        <p>The app cannot connect until these settings are present:</p>
        <ul>
          {state.missing.map((name) => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="state-panel state-panel--error" role="alert">
        <span className="eyebrow">Connection problem</span>
        <h2>Supabase could not load the board</h2>
        <p>{state.message}</p>
        <button className="button button--outline" onClick={onRetry} type="button">
          Try again
        </button>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="state-panel state-panel--empty" role="status">
        <span className="eyebrow">Connected</span>
        <h2>No pending demo fees</h2>
        <p>The table loaded successfully, but it has no demo students with a balance due.</p>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="state-panel state-panel--loading" role="status">
        <span className="loading-dot" />
        <p>Loading the fee board...</p>
      </div>
    );
  }

  return null;
}
