import type { ApiResponse, ApiError } from '@chat-peninsular/types';

export function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

export function fail(error: ApiError): ApiResponse<null> {
  return { data: null, error };
}
