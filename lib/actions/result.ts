export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export function ok(): ActionResult;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
    return { ok: true, data };
}

export function fail(error: string): ActionResult<never> {
    return { ok: false, error };
}

export function logAndFail(context: string, e: unknown, error: string): ActionResult<never> {
    console.error(`[${context}]`, e);
    return { ok: false, error };
}
