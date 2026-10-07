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
- MrX's built-in Arabic/English planning helper works immediately on-device with no model download, API key, account, or internet. It can draft goal-specific study, fitness, and project plans; add plan steps to tasks; save notes; and recommend a next task using due dates and Eisenhower priority. It is a practical rules-based assistant, not a generative language model.
- Optional Gemini chat is available for signed-in accounts when the Supabase Edge Function is configured. It receives open-task context, can save requested tasks/notes/plans, and uses Google Search grounding for explicit web research requests, showing source links with the answer. Without that setup, MrX uses its on-device planning helper.
- Installable as a progressive web app (PWA) on supported browsers, with an offline app shell after the first visit.
- Downloadable native Windows and Android apps from GitHub Releases.

Scheduled tasks and reminders are saved with the user's workspace. Android uses native local notifications, which can fire while TimeX is closed after notification permission is granted. Web browsers and the Windows app schedule reminders while TimeX is open; browser notifications require a supported browser and permission.

## Accounts, database, and chat

The Supabase project URL for this app is `https://idsrpsleoogqpaculctf.supabase.co`. Email/social accounts and private cloud workspaces require its public anon/publishable key. Supabase Auth receives and manages email/password credentials and Google/Facebook OAuth identities; the `profiles` table stores the display name, while each user's workspace and conversation are protected by row-level security. MrX's built-in planner does not require Supabase. Optional Gemini chat requires a server-side Google AI API key and the Supabase Edge Function.

All `.env*` and `env.*` files, signing keystores, private keys, Android `local.properties`, and `google-services.json` are excluded from Git. Set local `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variables in an ignored `.env.local` file if needed; any `VITE_` value is bundled into the public website and must never contain a private key. Keep Gemini/provider keys in Supabase Edge Function secrets and Android release-signing credentials in GitHub Actions secrets. GitHub secret scanning and push protection are enabled for this public repository; the application source remains public, so never commit credentials or put server secrets in frontend code.

To activate accounts and per-user cloud storage:

1. In the Supabase SQL Editor for project `idsrpsleoogqpaculctf`, run all migrations in timestamp order: `supabase/migrations/20261001100000_user_accounts_and_assistant.sql` creates the private workspace, profile, chat tables, and row-level security policies; `supabase/migrations/20261002100000_assistant_message_sources.sql` adds safe storage for Google grounding links; `supabase/migrations/20261003100000_workspace_realtime.sql` enables live updates for signed-in workspaces. Alternatively, use `npx supabase db push` from a linked Supabase CLI session.
2. In Supabase **Project Settings → API Keys**, copy the public anon/publishable key. Add it as a GitHub **Actions variable** named `VITE_SUPABASE_ANON_KEY` (Repository → Settings → Secrets and variables → Actions → Variables). `VITE_SUPABASE_URL` is already set to this project's URL. For local development, create an ignored `.env.local` file and enter `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. This public client key is intended for frontend use with RLS; never use the Supabase service-role/secret key in the app or GitHub variables.
3. In Supabase Authentication, enable Email and whichever Google and Facebook providers you want to offer. Register each provider's OAuth credentials with Supabase. Allow the website redirect `https://mrx16963.github.io/TimeX/app.html` and the native app redirects `com.mrxosa.timex://login-callback` and `timex://login-callback` in Supabase's redirect URL settings. Configure email confirmations and password rules to match your needs.
4. Deploy the database migration and Edge Function from an authenticated Supabase CLI session (`npx supabase login`, `npx supabase link --project-ref idsrpsleoogqpaculctf`, `npx supabase db push`, then `npx supabase functions deploy timex-assistant`). In **Supabase → Edge Functions → Secrets**, set `GEMINI_API_KEY` to a key from Google AI Studio. The function uses `gemini-2.5-flash` by default; optionally set `GEMINI_MODEL`. Keep the Gemini key only in Supabase server-side secrets—never in GitHub Actions variables or frontend builds.

`profiles`, `user_workspaces`, and `assistant_messages` enforce per-user access with Supabase Auth row-level security. Users see only their own saved workspace and conversations, including saved search citations. Workspace edits are saved to the account and live workspace changes are delivered to other signed-in devices after the Realtime migration is applied. When the Gemini function is configured, the provider receives recent chat context and active task titles; Google Search grounding is enabled only for requests asking for current information or web sources. The API key stays on the server. Without that setup, MrX uses its built-in local planner; it can create plan and task actions without sending the request to a provider.

Email sign-in, Google/Facebook OAuth, and cross-device cloud saving depend on completing the Supabase setup above. Google/Facebook login also requires OAuth credentials from those providers. The public `VITE_SUPABASE_ANON_KEY` is not currently configured in this repository's deployment settings, so those online account flows remain unavailable in published builds until the owner adds it. Gemini chat requires a Google Gemini API key stored in Supabase secrets. The built-in MrX planner works without those services and does not download a language model.

## Limitations

MrX's built-in planner is rules-based rather than a generative language model; this keeps the app usable without a large model download, API key, or compatible GPU. Optional Gemini chat is available only after the Supabase Edge Function is configured. TimeX does not currently publish a signed native iOS `.ipa`; install the website as a Home Screen app from Safari instead. This does not require an App Store account, but iOS background reminders and native-app capabilities are not available through the PWA. Gemini chat and cross-device accounts remain unavailable until the Supabase setup above is completed. Browser and Windows reminders require TimeX to remain open; Android reminder delivery depends on notification permission and device alarm settings.

## Website and browser-installable app

The product website is served at `/TimeX/`; the app itself opens at `/TimeX/app.html`. On the deployed HTTPS site, choose **Install TimeX** on the website or use the browser's install option. Windows installation is supported in browsers such as Chrome and Edge. On Android, open the site in Chrome and choose **Install app** or **Add to Home screen**. On iPhone and iPad, use Safari's **Share → Add to Home Screen**.

## Native Windows and Android downloads

The GitHub Releases workflow packages:

- `TimeX-nsis-x64.exe`: a Windows 64-bit setup installer.
- `TimeX-Portable-x64.exe`: a Windows 64-bit portable app.
- `TimeX-Android.apk`: a native Android app that can be installed directly from the downloaded file.

The website serves the latest Android APK directly from its own download path to avoid GitHub release-page redirects; the Pages workflow refreshes that copy whenever a release is published. Windows download links are pinned to the latest release tag, skipping the extra "latest release" redirect. The Windows installer version is set from the release tag before packaging, so Windows can recognize it as a newer update rather than reinstalling the old `1.0.5` package version. A versioned GitHub Release is built when a `v*` tag is pushed. To publish the next build from the repository, run **Build and publish TimeX apps** from the GitHub Actions tab; the workflow creates a release and uploads all three installers.

Windows displays an “unknown publisher” warning until TimeX is signed with a trusted Authenticode code-signing certificate. The Windows release workflow uses `WINDOWS_CERTIFICATE_BASE64` (base64-encoded PFX) and `WINDOWS_CERTIFICATE_PASSWORD` Actions secrets when configured; without a certificate the app still builds unsigned, and SmartScreen reputation may take time to establish even after signing. A certificate must be obtained for the publisher's real identity—do not bypass SmartScreen for files from untrusted sources. Install a newer Windows setup package over the existing installation to update it without removing its app data. New Android APKs use the same persistent signing key and higher version code, so Android can install them over the current version while retaining app data. The older v1.0.8 APK used a temporary debug key; upgrading from it to the first persistently signed APK requires a one-time uninstall because Android does not allow replacing an app signed by a different key. Sync or export local-only data before that migration; subsequent Android updates will install in place.

The Android release workflow requires these repository Actions secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD`. The private signing key is generated once for this repository and must be preserved permanently; losing or replacing it prevents in-place updates of installed Android releases. Keep a secure backup of the original keystore and its passwords before rotating or deleting any of these secrets.

On Android, pressing the system Back button once returns to Today and shows an exit prompt; pressing it again within two seconds exits the app. The browser-based progressive web app remains available as a separate install option and can reopen its cached app shell offline.

## Publishing on GitHub Pages

The `Deploy TimeX website` GitHub Actions workflow builds the static site and publishes it to GitHub Pages when changes are pushed to `mrx16963-timex-productivity-app`. The `Build and publish TimeX apps` workflow creates Windows and Android installers for GitHub Releases. In the GitHub repository settings, make sure Pages uses **GitHub Actions** as its build and deployment source. The project URL is `https://mrx16963.github.io/TimeX/`.

Google can only index the deployed website after it is publicly reachable. Once it is live, add `https://mrx16963.github.io/TimeX/` as a property in Google Search Console, complete Google's site-ownership verification, and submit `https://mrx16963.github.io/TimeX/sitemap.xml`. Publishing does not guarantee Google indexing or search ranking.

Browser or native-app storage can be cleared by the user or system. With Supabase configured, signed-in workspaces synchronize to the user's private cloud row; otherwise, data remains on the current device. Export and backup controls are not yet available.
