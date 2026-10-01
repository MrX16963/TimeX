import { spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(npm, ["run", "build"], {
  ...process.env,
  VITE_BASE_PATH: "./",
});
run(npm, ["exec", "electron-builder", "--", "--win", "nsis", "portable", "--x64"]);
