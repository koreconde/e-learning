export class ServiceFailure extends Error {
  constructor(message: string, public status: number, public retryable: boolean) {
    super(message);
    this.name = "ServiceFailure";
  }
}

/** Only expose structured, safe service messages, never raw response bodies. */
export async function readServiceFailure(response: Response, fallback: string): Promise<ServiceFailure> {
  let body: { message?: string; error?: string; details?: string; props?: { retryable?: boolean } } = {};
  try {
    body = await response.clone().json();
    if (typeof body.details === "string") {
      try {
        const upstream = JSON.parse(body.details);
        body = { ...body, message: upstream.message ?? body.message, props: upstream.props ?? body.props };
      } catch { /* Keep the safe outer message. */ }
    }
  } catch { /* Non-JSON responses use the local fallback. */ }
  const retryable = body.props?.retryable !== false && (response.status === 429 || response.status >= 500);
  return new ServiceFailure(body.message || body.error || fallback, response.status, retryable);
}

export async function functionFailure(error: unknown, fallback: string): Promise<ServiceFailure> {
  const context = error && typeof error === "object" && "context" in error ? error.context : null;
  if (context instanceof Response) return readServiceFailure(context, fallback);
  return new ServiceFailure(fallback, 0, true);
}