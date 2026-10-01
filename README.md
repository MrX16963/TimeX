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
- Without a connected account, tasks, notes, plans, points, language, and theme are stored in browser/app storage on that device.
- Optional email, Google, and Facebook sign-in, an isolated private cloud workspace per account, and saved assistant conversation history.
- An authenticated AI conversation that can discuss goals, create plans, and save notes when a server-side AI provider is configured.
- Installable as a progressive web app (PWA) on supported browsers, with an offline app shell after the first visit.
- Downloadable native Windows and Android apps from GitHub Releases.

## Accounts, database, and chat

Account and AI features are intentionally unavailable until the owner configures a Supabase project and an AI provider. The app never pretends to create an account or answer with an AI when these services are missing. Until configuration is complete, the device-local planner remains available.

To activate accounts and per-user cloud storage:

1. Create a Supabase project and run `supabase/migrations/20261001100000_user_accounts_and_assistant.sql` in its SQL Editor, or link the project and run `npx supabase db push`.
2. Add your Supabase project URL and public anon/publishable key as `.env.local` values using `.env.example`. Add the same two values as GitHub **Actions variables** named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable sign-in in the website and packaged apps. The anon key is designed to be public; never put the Supabase service-role key in the frontend or these variables.
3. In Supabase Authentication, enable Email and whichever Google and Facebook providers you want to offer. Register each provider's OAuth credentials with Supabase. Allow the website redirect `https://mrx16963.github.io/TimeX/app.html` and the native app redirects `com.mrxosa.timex://login-callback` and `timex://login-callback` in Supabase's redirect URL settings. Configure email confirmations and password rules to match your needs.
4. Deploy the authenticated assistant Edge Function with `npx supabase functions deploy timex-assistant`. Set its server-side AI credentials with `npx supabase secrets set OPENAI_API_KEY=...`; optionally set `OPENAI_MODEL`. Store AI and social provider secrets only in their intended provider/Supabase secret settings, never in frontend build variables or committed files.

`profiles`, `user_workspaces`, and `assistant_messages` enforce per-user access with Supabase Auth row-level security. Users see only their own saved workspace and conversations. The AI provider receives the recent chat context when the signed-in user sends a message; the key stays on the server. The assistant supports normal discussion plus validated note and plan actions that are saved to the signed-in user's workspace.

Email sign-in, Google/Facebook OAuth, cross-device cloud saving, and live AI chat all depend on the external Supabase project settings above. Google/Facebook login also requires OAuth credentials from those providers. AI chat additionally requires an OpenAI API key stored in Supabase secrets. The app's guided five-step planner works locally without those services.

## Limitations

## Website and browser-installable app

The product website is served at `/TimeX/`; the app itself opens at `/TimeX/app.html`. On the deployed HTTPS site, choose **Install TimeX** on the website or use the browser's install option. Windows installation is supported in browsers such as Chrome and Edge. On Android, open the site in Chrome and choose **Install app** or **Add to Home screen**. On iPhone and iPad, use Safari's **Share → Add to Home Screen**.

## Native Windows and Android downloads

The GitHub Releases workflow packages:

- `TimeX-nsis-x64.exe`: a Windows 64-bit setup installer.
- `TimeX-Portable-x64.exe`: a Windows 64-bit portable app.
- `TimeX-Android.apk`: a native Android app that can be installed directly from the downloaded file.

Open the [latest GitHub Release](https://github.com/MrX16963/TimeX/releases/latest) to download the files. A versioned GitHub Release is built when a `v*` tag is pushed. To publish the next build from the repository, run **Build and publish TimeX apps** from the GitHub Actions tab; the workflow creates a release and uploads all three installers.

Windows SmartScreen or Android's unknown-app warning may appear because these direct-download apps are not signed through the Microsoft Store or Google Play. Confirm installation only for a release downloaded from this official repository. The Android APK is a directly installable debug-signed build. Installing a newer APK may require removing the previous version first; removing it also removes data kept on that device. Google Play publication and stable Android app-signing credentials are not configured.

The browser-based progressive web app remains available as a separate install option and can reopen its cached app shell offline.

## Publishing on GitHub Pages

The `Deploy TimeX website` GitHub Actions workflow builds the static site and publishes it to GitHub Pages when changes are pushed to `mrx16963-timex-productivity-app`. The `Build and publish TimeX apps` workflow creates Windows and Android installers for GitHub Releases. In the GitHub repository settings, make sure Pages uses **GitHub Actions** as its build and deployment source. The project URL is `https://mrx16963.github.io/TimeX/`.

Google can only index the deployed website after it is publicly reachable. Once it is live, add `https://mrx16963.github.io/TimeX/` as a property in Google Search Console, complete Google's site-ownership verification, and submit `https://mrx16963.github.io/TimeX/sitemap.xml`. Publishing does not guarantee Google indexing or search ranking.

Browser or native-app storage can be cleared by the user or system. With Supabase configured, signed-in workspaces synchronize to the user's private cloud row; otherwise, data remains on the current device. Export and backup controls are not yet available.
