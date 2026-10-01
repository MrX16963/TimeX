import { describe, expect, it } from "vitest";
import {
  initializeLocalAi,
  isLocalAiSupported,
  MRX_MODEL_ID,
  MRX_MODEL_SIZE_MB,
} from "./local-ai";

describe("MrX on-device language model", () => {
  it("uses a compact Qwen model and exposes WebGPU availability", () => {
    expect(MRX_MODEL_ID).toBe("Qwen2-0.5B-Instruct-q4f16_1-MLC");
    expect(MRX_MODEL_SIZE_MB).toBe(278);
    expect(isLocalAiSupported()).toBeTypeOf("boolean");
  });

  it("reports unsupported browsers instead of pretending the model loaded", async () => {
    if (!isLocalAiSupported()) {
      await expect(initializeLocalAi(() => undefined)).rejects.toThrow(
        "WebGPU is not available",
      );
    }
  });
});
