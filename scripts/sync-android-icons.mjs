import { copyFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const resourceRoot = path.join(root, "android", "app", "src", "main", "res");
const icon = path.join(root, "public", "icons", "icon-512.png");
const directories = await readdir(resourceRoot, { withFileTypes: true });
const mipmapDirectories = directories.filter(
  (entry) => entry.isDirectory() && entry.name.startsWith("mipmap-"),
);

if (mipmapDirectories.length === 0) {
  throw new Error("Android mipmap directories are missing; run `npx cap add android` first.");
}

for (const directory of mipmapDirectories) {
  if (directory.name === "mipmap-anydpi-v26") continue;
  const targetDirectory = path.join(resourceRoot, directory.name);
  for (const name of ["ic_launcher.png", "ic_launcher_round.png"]) {
    await copyFile(icon, path.join(targetDirectory, name));
  }

  await copyFile(icon, path.join(targetDirectory, "ic_launcher_foreground.png"));
}

console.log(`Updated ${mipmapDirectories.length - 1} Android launcher icon densities.`);
