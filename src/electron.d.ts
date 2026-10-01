interface Window {
  timexExternal?: {
    openExternal(url: string): Promise<void>;
  };
}
