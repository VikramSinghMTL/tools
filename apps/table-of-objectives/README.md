# Table of Objectives Builder

Build a table of general and specific learning objectives, check them against Bloom's taxonomy, and export the result to Word.

Requires Node 20.19+.

```sh
npm install
npm run dev      # dev server at http://localhost:8080
npm run build    # production build into dist/
npm run preview  # serve the dist/ build locally
npm test         # run the Verify rule tests
```

## Deploying

`dist/` is not committed. Run `npm run build` and upload the contents of `dist/` to any static web host, or point a host such as Netlify, Vercel or Cloudflare Pages at this repo with build command `npm run build` and output folder `dist`.

## Where tables are kept

Every table is saved automatically in the browser's localStorage. Nothing is sent to a server, and tables don't sync between browsers or devices. Use **Export backup** in the table menu to keep a copy as a `.json` file; **Import backup** adds one back as a new table. Files saved by older versions of the app still import. `sample-data.json` is an example course you can import.

## Verify

Turning on **Verify** in the toolbar checks the table as you edit (each text box is re-checked when you leave it). The rules live in `src/verify.js`, with tests in `src/verify.test.js`.

Checking that an objective starts with a verb uses a list of English verbs from [WordNet](https://wordnet.princeton.edu/) (`src/verbs-en.js`, licence in `public/LICENSE-WordNet.txt`). To regenerate it, see the instructions at the top of `scripts/build-verb-list.mjs`.
