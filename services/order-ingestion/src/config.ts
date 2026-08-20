function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} — see .env.example`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  zippWebhookSecret: required('ZIPP_WEBHOOK_SECRET'),
  munchlyWebhookSecret: required('MUNCHLY_WEBHOOK_SECRET'),
};
