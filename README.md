# coin-flipper-application

[![a11y and lighthouse](https://github.com/alvarezeman4-bit/coin-flipper-application/actions/workflows/a11y.yml/badge.svg)](https://github.com/alvarezeman4-bit/coin-flipper-application/actions/workflows/a11y.yml)
[![Deploy](https://github.com/alvarezeman4-bit/coin-flipper-application/actions/workflows/deploy.yml/badge.svg)](https://github.com/alvarezeman4-bit/coin-flipper-application/actions/workflows/deploy.yml)

A small, accessible coin flip web app. This repo includes automated accessibility checks (axe) and Lighthouse audits via GitHub Actions.

## 🌐 Access the App

**Web App URL:** https://alvarezeman4-bit.github.io/coin-flipper-application/

Open this link directly in your browser or on your phone - no GitHub login required!

## Running locally

1. Start the static server:

   npm install

   npm run start

   Open http://127.0.0.1:8080 in your browser.

2. Quick smoke test (verifies key assets are served):

   npm run smoke

3. Automated checks (optional):

   - Accessibility (jsdom): npm run test
   - Accessibility (puppeteer - requires Chrome): npm run a11y
   - Lighthouse (requires Chrome): npm run lighthouse

4. For submission to your professor:

   - You can share the GitHub repo link (https://github.com/alvarezeman4-bit/coin-flipper-application) or the release tag `v1.0.0` which is available at the Releases page in the repo.
   - If your professor needs a zip, create it with: `git archive --format zip --output coin-flipper-v1.0.0.zip v1.0.0`
## Release

This repository uses semantic release tags; I'll create a v1.0.0 tag and release when you're ready to publish.

