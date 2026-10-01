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
- A day-by-day, 24-hour calendar with a geometric seven-day selector, individually colored tasks, and editable no-reminder, 5-, 10-, 15-, 30-, or 60-minute alerts.
- Prioritize tasks by importance and urgency with the four-quadrant Eisenhower matrix.
- 25-minute Pomodoro focus timer with start, pause, and reset controls.
- Create and edit personal notes and save guided plans as task lists.
- Four dark palettes: noir-and-pearl, arctic blue, forest emerald, and amethyst violet.
- A black-and-silver gradient visual style, four coordinated accent palettes, and a custom color picker; theme and accent preferences save with the user's workspace.
- Without a connected account, tasks, notes, plans, points, language, and theme are stored in browser/app storage on that device.
- Optional email, Google, and Facebook sign-in, an isolated private cloud workspace per account, and saved assistant conversation history.
- MrX can run the open Qwen2 0.5B instruction model locally in browsers that support WebGPU. The roughly 278 MB model is downloaded only after the user chooses **Download free AI model**, cached on that device, and used without sending prompts or task data to an AI provider. Explicit task/note/plan actions are saved locally.
- A built-in rule-based MrX planner remains available with no model download, account, or internet. It is a fallback, not a trained AI model. Optional Gemini chat is available for signed-in accounts only when the Supabase Edge Function is configured.
- Optional authenticated Gemini chat for signed-in accounts when an owner configures the Supabase Edge Function and its server-side API key.
- Installable as a progressive web app (PWA) on supported browsers, with an offline app shell after the first visit.
- Downloadable native Windows and Android apps from GitHub Releases.

Scheduled tasks and reminders are saved with the user's workspace. Android uses native local notifications, which can fire while TimeX is closed after notification permission is granted. Web browsers and the Windows app schedule reminders while TimeX is open; browser notifications require a supported browser and permission.

## Accounts, database, and chat

The Supabase project URL for this app is `https://idsrpsleoogqpaculctf.supabase.co`. Email/social accounts and private cloud workspaces require its public anon/publishable key. Supabase Auth receives and manages email/password credentials and Google/Facebook OAuth identities; the `profiles` table stores the display name, while each user's workspace and conversation are protected by row-level security. MrX's on-device Qwen2 language model and built-in planner do not require Supabase. Optional Gemini chat requires a server-side Google AI API key and the Supabase Edge Function.

To activate accounts and per-user cloud storage:

1. In the Supabase SQL Editor for project `idsrpsleoogqpaculctf`, run `supabase/migrations/20261001100000_user_accounts_and_assistant.sql` to create the private workspace, profile, chat tables, and row-level security policies.
2. In Supabase **Project Settings → API Keys**, copy the public anon/publishable key. Add it as a GitHub **Actions variable** named `VITE_SUPABASE_ANON_KEY` (Repository → Settings → Secrets and variables → Actions → Variables). `VITE_SUPABASE_URL` is already set to this project's URL. For local development, copy `.env.example` to `.env.local` and fill in the public key. This public client key is intended for frontend use with RLS; never use the Supabase service-role/secret key in the app or GitHub variables.
3. In Supabase Authentication, enable Email and whichever Google and Facebook providers you want to offer. Register each provider's OAuth credentials with Supabase. Allow the website redirect `https://mrx16963.github.io/TimeX/app.html` and the native app redirects `com.mrxosa.timex://login-callback` and `timex://login-callback` in Supabase's redirect URL settings. Configure email confirmations and password rules to match your needs.
4. Deploy the database migration and Edge Function from an authenticated Supabase CLI session (`npx supabase login`, `npx supabase link --project-ref idsrpsleoogqpaculctf`, `npx supabase db push`, then `npx supabase functions deploy timex-assistant`). In **Supabase → Edge Functions → Secrets**, set `GEMINI_API_KEY` to a key from Google AI Studio. The function uses `gemini-2.5-flash` by default; optionally set `GEMINI_MODEL`. Keep the Gemini key only in Supabase server-side secrets—never in GitHub Actions variables or frontend builds.

`profiles`, `user_workspaces`, and `assistant_messages` enforce per-user access with Supabase Auth row-level security. Users see only their own saved workspace and conversations. The AI provider receives the recent chat context when the signed-in user sends a message; the key stays on the server. The assistant supports normal discussion plus validated note and plan actions that are saved to the signed-in user's workspace.

Email sign-in, Google/Facebook OAuth, and cross-device cloud saving depend on completing the Supabase setup above. Google/Facebook login also requires OAuth credentials from those providers. The public `VITE_SUPABASE_ANON_KEY` is not currently configured in this repository's deployment settings, so those online account flows remain unavailable in published builds until the owner adds it. Gemini chat requires a Google Gemini API key stored in Supabase secrets. The on-device Qwen model can work without those services on a WebGPU-compatible device after its first download.

## Limitations

The on-device Qwen2 model is an open, general-purpose 0.5B language model served by [Hugging Face](https://huggingface.co/mlc-ai/Qwen2-0.5B-Instruct-q4f16_1-MLC) through [WebLLM](https://github.com/mlc-ai/web-llm). Its first download is about 278 MB and needs internet, free device storage, and a browser with WebGPU enabled; afterward, cached model files can be reused offline (the browser may evict caches). WebGPU is not available in every browser or phone, and generation speed and answer quality vary by device; the built-in rule-based MrX helper remains available when local inference is unsupported. TimeX does not currently publish a signed native iOS `.ipa`; install the website as a Home Screen app from Safari instead. This does not require an App Store account, but iOS background reminders and native-app capabilities are not available through the PWA. Gemini chat and cross-device accounts remain unavailable until the Supabase setup above is completed. Browser and Windows reminders require TimeX to remain open; Android reminder delivery depends on notification permission and device alarm settings.

## Website and browser-installable app

The product website is served at `/TimeX/`; the app itself opens at `/TimeX/app.html`. On the deployed HTTPS site, choose **Install TimeX** on the website or use the browser's install option. Windows installation is supported in browsers such as Chrome and Edge. On Android, open the site in Chrome and choose **Install app** or **Add to Home screen**. On iPhone and iPad, use Safari's **Share → Add to Home Screen**.

## Native Windows and Android downloads

The GitHub Releases workflow packages:

- `TimeX-nsis-x64.exe`: a Windows 64-bit setup installer.
- `TimeX-Portable-x64.exe`: a Windows 64-bit portable app.
- `TimeX-Android.apk`: a native Android app that can be installed directly from the downloaded file.

Open the [latest GitHub Release](https://github.com/MrX16963/TimeX/releases/latest) to download the files. A versioned GitHub Release is built when a `v*` tag is pushed. To publish the next build from the repository, run **Build and publish TimeX apps** from the GitHub Actions tab; the workflow creates a release and uploads all three installers.

Windows SmartScreen or Android's unknown-app warning may appear because these direct-download apps are not signed through the Microsoft Store or Google Play. Confirm installation only for a release downloaded from this official repository. The Android APK is a directly installable debug-signed build. Installing a newer APK may require removing the previous version first; removing it also removes data kept on that device. Google Play publication and stable Android app-signing credentials are not configured.

On Android, pressing the system Back button once returns to Today and shows an exit prompt; pressing it again within two seconds exits the app. The browser-based progressive web app remains available as a separate install option and can reopen its cached app shell offline.

## Publishing on GitHub Pages

The `Deploy TimeX website` GitHub Actions workflow builds the static site and publishes it to GitHub Pages when changes are pushed to `mrx16963-timex-productivity-app`. The `Build and publish TimeX apps` workflow creates Windows and Android installers for GitHub Releases. In the GitHub repository settings, make sure Pages uses **GitHub Actions** as its build and deployment source. The project URL is `https://mrx16963.github.io/TimeX/`.

Google can only index the deployed website after it is publicly reachable. Once it is live, add `https://mrx16963.github.io/TimeX/` as a property in Google Search Console, complete Google's site-ownership verification, and submit `https://mrx16963.github.io/TimeX/sitemap.xml`. Publishing does not guarantee Google indexing or search ranking.

Browser or native-app storage can be cleared by the user or system. With Supabase configured, signed-in workspaces synchronize to the user's private cloud row; otherwise, data remains on the current device. Export and backup controls are not yet available.
