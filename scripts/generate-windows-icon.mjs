import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const iconDirectory = path.join(root, "public", "icons");
const sizes = [180, 192];
const entries = await Promise.all(
  sizes.map(async (size) => ({
    size,
    data: await readFile(path.join(iconDirectory, `icon-${size}.png`)),
  })),
);

const directorySize = 6 + entries.length * 16;
let offset = directorySize;
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(entries.length, 4);
const directory = entries.map(({ size, data }) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0);
  entry.writeUInt8(size === 256 ? 0 : size, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(data.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += data.length;
  return entry;
});

await mkdir(iconDirectory, { recursive: true });
await writeFile(
  path.join(iconDirectory, "timex.ico"),
  Buffer.concat([header, ...directory, ...entries.map(({ data }) => data)]),
);
console.log("Generated a multi-resolution Windows application icon.");
