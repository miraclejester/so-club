import type { ZodString } from 'zod';
import { z } from 'zod';
import { RsvpStatus } from '@/prisma/generated/prisma/enums';

export const MediaSourceSchema = z.enum(['TMDB']);
// TMDB ids should be numeric
export const TmdbExternalIdSchema = z.string().regex(/^\d+$/, 'Invalid movie id');
export const RsvpStatusSchema = z.enum(RsvpStatus);
export const EmailSchema = z.email().trim().toLowerCase();
export const SearchQuerySchema: ZodString = z.string().trim().min(2).max(100);
export const ScheduleSessionsSchema = z.object({
    scheduledFor: z
        .string()
        .refine((v) => v.length > 0 && !Number.isNaN(new Date(v).getTime()), 'Please choose a valid date and time')
        .transform((v) => new Date(v))
        .refine((d) => d.getTime() > Date.now(), 'Please pick a time in the future'),
    location: optionalText(200),
    notes: optionalText(2000),
});

function optionalText(max: number) {
    return z
        .string()
        .trim()
        .max(max)
        .nullish()
        .transform((v) => v || null);
}

export function singleStringParamUrl(regexError: string, defaultValue: string = '', max: number = 512) {
    return z
        .string()
        .max(max)
        .regex(/^\/(?![/\\])[^\\\s]*$/, regexError)
        .catch(defaultValue);
}
