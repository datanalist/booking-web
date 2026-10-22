type RealtimeListener = (event: { data: string }) => void;

type RealtimeSocket = {
  addEventListener(type: string, listener: RealtimeListener): void;
  close(): void;
};

type OpenChatRealtimeOptions = {
  readonly url: string;
  readonly topics: readonly string[];
  readonly subscribe: (clientId: string) => Promise<void>;
  readonly onData: (topic: string, data: string) => void;
  readonly openSocket?: (url: string) => RealtimeSocket;
  readonly schedule?: (run: () => void, delayMs: number) => () => void;
};

const RECONNECT_MS = 1000;

/** SSE PocketBase: подписка после `PB_CONNECT`, повтор при обрыве. */
export function openChatRealtime(options: OpenChatRealtimeOptions): () => void {
  let stopped = false;
  let socket: RealtimeSocket | null = null;
  let cancelRetry: (() => void) | null = null;
  const openSocket = options.openSocket ?? ((url: string) => new EventSource(url));
  const schedule = options.schedule ?? defaultSchedule;

  function connect(): void {
    if (stopped) {
      return;
    }
    socket = openSocket(options.url);
    socket.addEventListener("PB_CONNECT", (event) => {
      const clientId = readClientId(event.data);
      if (clientId === null || stopped) {
        return;
      }
      void options.subscribe(clientId).catch(() => undefined);
    });
    for (const topic of options.topics) {
      socket.addEventListener(topic, (event) => {
        options.onData(topic, event.data);
      });
    }
    socket.addEventListener("error", () => {
      socket?.close();
      socket = null;
      if (stopped) {
        return;
      }
      cancelRetry?.();
      cancelRetry = schedule(connect, RECONNECT_MS);
    });
  }

  connect();
  return () => {
    stopped = true;
    cancelRetry?.();
    socket?.close();
    socket = null;
  };
}

export function readClientId(data: string): string | null {
  const parsed = parseJson(data);
  if (parsed === null || typeof parsed.clientId !== "string" || parsed.clientId.trim().length === 0) {
    return null;
  }
  return parsed.clientId;
}

function parseJson(data: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(data);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function defaultSchedule(run: () => void, delayMs: number): () => void {
  const timer = setTimeout(run, delayMs);
  return () => {
    clearTimeout(timer);
  };
}
