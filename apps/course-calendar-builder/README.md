# Course Calendar Builder

Describe a course calendar as JSON (activity types and their colours, columns, and the activities in each week) and see it rendered as a week-by-week table as you type. Export the calendar as HTML and CSS to embed elsewhere, or export and import the JSON to keep working on it later.

Lives at [tools.singh.gg/course-calendar-builder](https://tools.singh.gg/course-calendar-builder/).

## Development

Requires Node 20.19+. Run `npm install` from the root of the tools repo (it's an npm workspace), then from this folder:

```sh
npm run dev        # dev server
npm run build      # production build into dist/
npm run preview    # serve the dist/ build locally

npm run lint       # Biome: formatting and lint
npm run typecheck  # TypeScript
npm run check      # both
```

GitHub Actions runs lint, type check and a build on every push and pull request (`.github/workflows/course-calendar-builder.yml` at the repo root). Pushing to `main` deploys it with the rest of the tools repo.
