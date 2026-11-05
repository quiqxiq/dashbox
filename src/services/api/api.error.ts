export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string = 'UNKNOWN',
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(status: number, body: unknown): ApiError {
    let message = `HTTP ${status}`;

    if (typeof body === 'object' && body !== null && 'message' in body) {
      const value = (body as { message: unknown }).message;
      if (typeof value === 'string') message = value;
    }

    return new ApiError(message, status, statusToCode(status), body);
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }

  get isAuth(): boolean {
    return this.status === 401 || this.status === 403;
  }

  get isRetryable(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}

function statusToCode(status: number): string {
  switch (status) {
    case 0:
      return 'NETWORK';
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 500:
      return 'SERVER_ERROR';
    default:
      return 'UNKNOWN';
  }
}
