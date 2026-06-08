type Level = "info" | "warn" | "error" | "debug";

type LogEntry = {
  ts: string;
  level: Level;
  msg: string;
  [key: string]: unknown;
};

function write(level: Level, msg: string, ctx?: Record<string, unknown>) {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...ctx,
  };
  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => write("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => write("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => write("error", msg, ctx),
  debug: (msg: string, ctx?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") write("debug", msg, ctx);
  },
};
