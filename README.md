# TimeX

TimeX is an Arabic-first, responsive time-management app. It brings daily tasks, the Eisenhower matrix, a focus timer, notes, and a guided planning assistant into one calm workspace.

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

## Planning assistant and privacy

The planning assistant is a guided, deterministic in-app helper. It turns a goal into five actionable prompts and can add those prompts to the task list. It does not call an AI model or send user data to a service. No API credentials or backend are configured in this repository. Data remains in the browser profile and is not synchronized across devices.

## Limitations

This MVP has no accounts, cross-device sync, notifications, or external AI integration. Browser storage can be cleared by the user or browser; export and cloud backup are not yet available.
