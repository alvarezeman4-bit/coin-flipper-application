# coin-flipper-application

[![a11y and lighthouse](https://github.com/alvarezeman4-bit/coin-flipper-application/actions/workflows/a11y.yml/badge.svg)](https://github.com/alvarezeman4-bit/coin-flipper-application/actions/workflows/a11y.yml)

A small, accessible coin flip web app. This repo includes automated accessibility checks (axe) and Lighthouse audits via GitHub Actions.

## Running locally

- Start a static server and open http://127.0.0.1:8080
  - Quick: npx http-server -p 8080

- Run automated checks locally:
  - Accessibility (jsdom): npm run test
  - Accessibility (puppeteer): npm run a11y
  - Lighthouse: npm run lighthouse

## Release

This repository uses semantic release tags; I'll create a v1.0.0 tag and release when you're ready to publish.

