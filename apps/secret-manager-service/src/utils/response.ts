import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiResponse } from '../types';

export const ok = <T>(
  c: Context,
  data: T,
  message = 'Success',
  statusCode: ContentfulStatusCode = 200,
) => {
  const response: ApiResponse<T> = { success: true, data, message, statusCode };
  return c.json(response, statusCode);
};

export const fail = (
  c: Context,
  message: string,
  statusCode: ContentfulStatusCode,
) => {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    message,
    statusCode,
  };
  return c.json(response, statusCode);
};
