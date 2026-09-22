// Supabase's PostgrestError/AuthError shapes are plain objects, not Error
// instances — String(err) on one gives "[object Object]" rather than its
// actual message.
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) return String((err as { message: unknown }).message);
  return String(err);
}
