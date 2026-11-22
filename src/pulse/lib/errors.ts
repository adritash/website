/** Typed application errors. `code` is stable and safe to log or show to admins. */
export class PulseError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly options: { retryable?: boolean; cause?: unknown; status?: number } = {}
  ) {
    super(message);
    this.name = "PulseError";
  }
  get retryable() {
    return this.options.retryable ?? false;
  }
}

export class NotFoundError extends PulseError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, { status: 404 });
  }
}

export class ConfigError extends PulseError {
  constructor(message: string) {
    super("CONFIG", message);
  }
}

export class ProviderError extends PulseError {
  constructor(code: string, message: string, retryable: boolean, cause?: unknown) {
    super(code, message, { retryable, cause });
  }
}

export class LimitError extends PulseError {
  constructor(code: string, message: string) {
    super(code, message, { status: 429 });
  }
}

export function errorCode(error: unknown): string {
  if (error instanceof PulseError) return error.code;
  if (error instanceof Error && error.name === "AbortError") return "TIMEOUT";
  return "UNEXPECTED";
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 500);
  return String(error).slice(0, 500);
}
