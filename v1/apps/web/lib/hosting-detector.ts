const THIRD_PARTY_SUFFIXES = [
  "vercel.app",
  "netlify.app",
  "onrender.com",
  "railway.app",
  "herokuapp.com",
  "pages.dev",
  "fly.dev",
  "repl.co",
  "glitch.me",
  "surge.sh",
  "github.io",
  "web.app",
  "firebaseapp.com",
  "deno.dev",
  "cyclic.app",
];

export function isThirdPartyHost(domain: string): boolean {
  return THIRD_PARTY_SUFFIXES.some(
    (suffix) => domain === suffix || domain.endsWith(`.${suffix}`)
  );
}