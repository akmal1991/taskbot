let csrfToken = '';
export const setCsrfToken = (token: string) => { csrfToken = token; };
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && options.body) headers.set('Content-Type', 'application/json');
  if (options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) headers.set('X-CSRF-Token', csrfToken);
  let response: Response;
  try { response = await fetch(`/api${path}`, { ...options, headers, credentials: 'same-origin', cache: 'no-store' }); }
  catch { throw new ApiError('Network unavailable. Check your connection and retry.', 0); }
  if (response.status === 401) window.dispatchEvent(new Event('unitask:unauthorized'));
  let data: any;
  try { data = await response.json(); }
  catch { throw new ApiError('Invalid server response.', response.status); }
  if (!data || typeof data !== 'object') throw new ApiError('Invalid server response.', response.status);
  if (!response.ok) {
    throw new ApiError(typeof data.error === 'string' ? data.error : 'Request failed.', response.status);
  }
  return data as T;
}
