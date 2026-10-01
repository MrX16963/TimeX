# TimeX

TimeX includes an English product website and an Arabic-first, responsive time-management app. It brings daily tasks, the Eisenhower matrix, a focus timer, notes, and a guided planning assistant into one calm workspace.

## Run locally

```sh
npm install
npm run dev
```

Use `npm run build` for a production build and `npm test` for focused unit tests.

## Features

- Arabic (default) and English interface, including right-to-left layout support.
- Add, complete, and remove tasks; completion awards 10 points.
- Prioritize tasks by importance and urgency with the four-quadrant Eisenhower matrix.
- 25-minute Pomodoro focus timer with start, pause, and reset controls.
- Create and edit personal notes and save guided plans as task lists.
- Four color themes: light, midnight, sage, and lavender.
- Tasks, notes, plans, points, language, and theme are stored in browser local storage on the current device.
- Installable as a progressive web app (PWA) on supported browsers, with an offline app shell after the first visit.

## Planning assistant and privacy

The planning assistant is a guided, deterministic in-app helper. It turns a goal into five actionable prompts and can add those prompts to the task list. It does not call an AI model or send user data to a service. No API credentials or backend are configured in this repository. Data remains in the browser profile and is not synchronized across devices.

## Limitations

## Website and installable app

The product website is served at `/TimeX/`; the app itself opens at `/TimeX/app.html`. On the deployed HTTPS site, choose **Install TimeX** on the website or use the browser's install option. Windows installation is supported in browsers such as Chrome and Edge. On Android, open the site in Chrome and choose **Install app** or **Add to Home screen**. On iPhone and iPad, use Safari's **Share → Add to Home Screen**.

TimeX is an installable progressive web app, not a native `.exe` or `.apk` package. A browser that supports direct PWA installation opens its native install prompt; otherwise, the website shows browser-specific instructions. The service worker caches the app shell after an online visit so the app can reopen offline. Tasks and notes continue to be stored locally on the device.

## Publishing on GitHub Pages

The `Deploy TimeX website` GitHub Actions workflow builds the static site and publishes it to GitHub Pages when changes are pushed to `mrx16963-timex-productivity-app`. In the GitHub repository settings, make sure Pages uses **GitHub Actions** as its build and deployment source. After the workflow succeeds, the project URL is `https://mrx16963.github.io/TimeX/`.

Google can only index the deployed website after it is publicly reachable. Once it is live, add `https://mrx16963.github.io/TimeX/` as a property in Google Search Console, complete Google's site-ownership verification, and submit `https://mrx16963.github.io/TimeX/sitemap.xml`. Publishing does not guarantee Google indexing or search ranking.

This MVP has no accounts, cross-device sync, notifications, or external AI integration. Browser storage can be cleared by the user or browser; export and cloud backup are not yet available. This PWA does not produce native Android APKs, iOS App Store packages, or desktop installers.
