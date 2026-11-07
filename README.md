# tools

Small browser-based teaching tools, served at `https://tools.singh.gg/<tool-name>/`.

| Tool | Folder | URL |
|---|---|---|
| Gradescope PDF Trimmer | `apps/gradescope-trimmer` | `/gradescope-trimmer/` |
| Moodle → Lea Grade Export | `apps/moodlea` | `/moodlea/` |
| Course Calendar Builder | `apps/course-calendar-builder` | `/course-calendar-builder/` |
| Table of Objectives Builder | `apps/table-of-objectives` | `/table-of-objectives/` |

## Develop

```bash
npm install
npm run dev -w gradescope-trimmer
```

## Build

```bash
npm run build                        # all tools → dist/
node scripts/build.mjs moodlea       # just one tool
```

`scripts/build.mjs` copies `site/` (the landing page) into `dist/` and each app's own build output into `dist/<folder>/`.

## Add a tool

1. Put it in `apps/<tool-name>/` with a `package.json` that has a `build` script writing to `dist/`.
2. If it uses Vite, set `base: './'` (or `'/<tool-name>/'`).
3. Add a card for it in `site/index.html`.

To bring in an existing repo with its full history, rewrite a copy so every commit already lives under `apps/<tool-name>/`, then merge it. Unlike `git subtree add`, this keeps `git log apps/<tool-name>` and `git blame` working back to the first commit:

```bash
git clone <repo-url> /tmp/<tool-name> && cd /tmp/<tool-name>
git filter-repo --to-subdirectory-filter apps/<tool-name> --tag-rename '':'<tool-name>-'
cd -  # back to this repo
git fetch /tmp/<tool-name> main
git merge --allow-unrelated-histories FETCH_HEAD
```

Then delete the app's own `package-lock.json` (workspaces share the root one) and move any `.github/workflows` files to the repo root.

## Deploy

Vercel project, root directory = repo root; settings come from `vercel.json`. Domain: `tools.singh.gg`.
