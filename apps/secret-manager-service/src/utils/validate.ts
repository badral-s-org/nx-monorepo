import { validator } from 'hono/validator';
import type { ValidationTargets } from 'hono';
import type { z } from 'zod';
import { fail } from './response';

// Validates a request part against a zod schema and replies with a 400 in the
// standard ApiResponse shape when it does not match.
export const validate = <
  Target extends keyof ValidationTargets,
  Schema extends z.ZodTypeAny,
>(
  target: Target,
  schema: Schema,
) =>
  validator(target, (value, c) => {
    const parsed = schema.safeParse(value);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue?.path.join('.');
      return fail(
        c,
        issue
          ? `${path ? `${path}: ` : ''}${issue.message}`
          : 'Invalid request',
        400,
      );
    }

    return parsed.data as z.output<Schema>;
  });
