const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return entities[character]
  })

export const renderPasswordPage = ({
  slug,
  error,
}: {
  slug: string
  error: "invalid" | "throttled" | null
}) => ({
  csp: `default-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; style-src 'unsafe-inline'`,
  html: `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <meta name="color-scheme" content="light dark" />
    <title>Link protetto</title>
    <style>
      :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #f6f7fb; color: #131827; }
      * { box-sizing: border-box; }
      body { display: grid; min-height: 100svh; margin: 0; place-items: center; padding: 1.25rem; background: radial-gradient(circle at 50% 18%, #edf3ff 0, #f6f7fb 42rem); }
      .panel { width: min(100%, 27rem); overflow: hidden; border-radius: 24px; background: #fff; box-shadow: 0 24px 80px -42px rgba(15, 23, 42, .35); outline: 1px solid rgba(15, 23, 42, .08); }
      .panel__head { display: flex; align-items: center; gap: .65rem; border-bottom: 1px solid rgba(15, 23, 42, .08); padding: 1rem 1.25rem; color: #5b6476; font-size: .76rem; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; }
      .signal { display: inline-block; width: .55rem; height: .55rem; border-radius: 999px; background: #fb6b5b; box-shadow: 0 0 0 .25rem rgba(251, 107, 91, .12); }
      .panel__body { padding: clamp(1.5rem, 5vw, 2.5rem); }
      h1 { max-width: 14ch; margin: 0; font-size: clamp(1.9rem, 6vw, 2.6rem); line-height: 1; letter-spacing: -.04em; text-wrap: balance; }
      .copy { margin: 1rem 0 1.75rem; color: #657087; font-size: .98rem; line-height: 1.6; text-wrap: pretty; }
      label { display: block; margin-bottom: .5rem; font-size: .85rem; font-weight: 600; }
      input { width: 100%; min-height: 3rem; padding: .65rem .9rem; border: 1px solid rgba(15, 23, 42, .16); border-radius: 12px; background: #fbfcfe; color: inherit; font: inherit; }
      input:focus-visible { border-color: #356bf2; outline: 3px solid rgba(53, 107, 242, .28); outline-offset: 1px; }
      button { display: inline-flex; width: 100%; min-height: 2.9rem; align-items: center; justify-content: center; margin-top: 1rem; padding: .65rem 1rem; border: 0; border-radius: 12px; background: #356bf2; color: #fff; font: inherit; font-weight: 650; cursor: pointer; transition: background-color 150ms ease-out, scale 150ms ease-out; }
      button:hover { background: #2459dc; }
      button:active { scale: .98; }
      .error { margin: 0 0 1rem; padding: .7rem .9rem; border-radius: 12px; background: rgba(251, 107, 91, .12); color: #b3392a; font-size: .88rem; }
      @media (prefers-color-scheme: dark) { :root { background: #121824; color: #f4f6fb; } body { background: radial-gradient(circle at 50% 18%, #1b2b4d 0, #121824 42rem); } .panel { background: #1b2332; outline-color: rgba(255, 255, 255, .1); box-shadow: 0 24px 80px -42px rgba(0, 0, 0, .85); } .panel__head { border-color: rgba(255, 255, 255, .1); color: #aeb8ca; } .copy { color: #b5bfce; } input { border-color: rgba(255, 255, 255, .16); background: #131a27; } button { background: #5a88ff; } button:hover { background: #7aa0ff; } .error { background: rgba(251, 107, 91, .18); color: #ffb3a8; } }
    </style>
  </head>
  <body>
    <main class="panel">
      <div class="panel__head"><span class="signal"></span> Corto</div>
      <div class="panel__body">
        <h1>Questo link è protetto.</h1>
        <p class="copy">Inserisci la password per continuare verso la destinazione.</p>
        ${
          error === "throttled"
            ? `<p class="error">Troppi tentativi. Riprova tra qualche minuto.</p>`
            : error === "invalid"
              ? `<p class="error">Password errata. Riprova.</p>`
              : ""
        }
        <form method="post" action="/${escapeHtml(slug)}">
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" maxlength="128" autofocus required />
          <button type="submit">Sblocca il link</button>
        </form>
      </div>
    </main>
  </body>
</html>`,
})
