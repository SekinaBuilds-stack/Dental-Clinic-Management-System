import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

/** Turn any axios/Nest error into one readable sentence (never an object). */
export function errMsg(e: unknown): string {
  const err = e as { response?: { status?: number; data?: { message?: unknown } }; message?: string };
  const m = err?.response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  if (err?.response?.status === 401) return 'Your session has expired. Please sign in again.';
  if (err?.response?.status === 403) return 'You do not have permission to view this.';
  if (err?.response?.status === 404) return 'This service is not available on the server.';
  return err?.message || 'Something went wrong.';
}

/** GET a list. `data` is always an array, so `.map` can never crash the page. */
export function useList<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    api
      .get(path)
      .then((res) => {
        if (!live) return;
        const body = res.data;
        setData(Array.isArray(body) ? body : []);
        setError('');
      })
      .catch((e) => live && setError(errMsg(e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}

/** GET a single object (report cards). */
export function useObject<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    api
      .get(path)
      .then((res) => live && (setData(res.data ?? null), setError('')))
      .catch((e) => live && setError(errMsg(e)));
    return () => {
      live = false;
    };
  }, [path]);
  return { data, error };
}
