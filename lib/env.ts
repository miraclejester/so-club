import { z } from 'zod';

const EnvSchema = z.object({
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    AUTH_GITHUB_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),
    AUTH_RESEND_KEY: z.string().min(1),
    TMDB_ACCESS_TOKEN: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function env(): Env {
    if (cached) {
        return cached;
    }

    if (process.env.NODE_ENV !== 'production' && process.env.SKIP_ENV_VALIDATION === '1') {
        cached = process.env as unknown as Env;
        return cached;
    }

    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
        const bad = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
        throw new Error(`Invalid or missing environment variables: ${bad}`);
    }

    cached = parsed.data;
    return cached;
}
