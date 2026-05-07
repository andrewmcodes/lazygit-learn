#!/usr/bin/env bash
# ── keypeck deploy script ─────────────────────────────────────────────────────
# Uses: gh (GitHub CLI), mise, pnpm (via mise)
# Run once from inside the project directory.
# Usage: ./deploy.sh [repo-name] [your-subdomain]
#   e.g. ./deploy.sh keypeck keypeck.yoursite.com
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_NAME="${1:-keypeck}"
SUBDOMAIN="${2:-}"

# ── Preflight checks ──────────────────────────────────────────────────────────
echo "▶ Checking required tools..."

for cmd in gh mise git; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "✗ '$cmd' not found. Install it and re-run." >&2
    exit 1
  fi
done

if ! gh auth status &>/dev/null; then
  echo "✗ Not authenticated with GitHub. Run: gh auth login" >&2
  exit 1
fi

# ── Install tools via mise ────────────────────────────────────────────────────
echo "▶ Installing tools via mise (.mise.toml)..."
mise trust --yes
mise install

# Verify pnpm is now available via mise shims
eval "$(mise activate bash --shims 2>/dev/null || true)"
export PATH="$HOME/.local/share/mise/shims:$PATH"

if ! command -v pnpm &>/dev/null; then
  echo "✗ pnpm not available after mise install. Check your mise config." >&2
  exit 1
fi
echo "  node  $(node --version)"
echo "  pnpm  $(pnpm --version)"

# ── Install dependencies ──────────────────────────────────────────────────────
echo "▶ Installing dependencies with pnpm..."
pnpm install

# ── Smoke-test the build ──────────────────────────────────────────────────────
echo "▶ Building..."
pnpm build
echo "  Build output: $(du -sh dist | cut -f1) in dist/"

# ── Git init + GitHub repo ────────────────────────────────────────────────────
if [ ! -d .git ]; then
  echo "▶ Initialising git repo..."
  git init
  git add .
  git commit -m "chore: initial commit"
fi

echo "▶ Creating GitHub repo '$REPO_NAME'..."
# --public: change to --private if preferred
if gh repo view "$REPO_NAME" &>/dev/null; then
  echo "  Repo already exists — skipping creation."
else
  gh repo create "$REPO_NAME" \
    --public \
    --source=. \
    --remote=origin \
    --push \
    --description "keypeck — drill the keyboard shortcuts of the tools you use (lazygit, tmux, and more)"
  echo "  ✓ Repo created and pushed."
fi

GH_USER=$(gh api user --jq '.login')
REPO_URL="https://github.com/$GH_USER/$REPO_NAME"

# ── Done — print Cloudflare Pages instructions ────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Code is live at: $REPO_URL"
echo ""
echo "Next: connect to Cloudflare Pages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://dash.cloudflare.com → Workers & Pages → Create"
echo "2. Connect to Git → select '$REPO_NAME'"
echo "3. Use these build settings:"
echo ""
echo "   Framework preset : None (or Vite)"
echo "   Build command     : pnpm build"
echo "   Output directory  : dist"
echo "   Node version      : 24   (set in Settings → Environment Variables)"
echo "                            NODE_VERSION = 24"
echo ""
echo "4. Deploy. Your app will be live at:"
echo "   https://$REPO_NAME.pages.dev"
echo ""

if [ -n "$SUBDOMAIN" ]; then
  echo "5. Subdomain — add this DNS record in your Cloudflare zone:"
  echo ""
  echo "   Type  : CNAME"
  echo "   Name  : ${SUBDOMAIN%%.*}"
  echo "   Target: $REPO_NAME.pages.dev"
  echo "   Proxy : ✓ (orange cloud)"
  echo ""
  echo "   Then in your Pages project:"
  echo "   Settings → Custom Domains → Add → $SUBDOMAIN"
  echo ""
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
