declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const LOCAL_FUNCTIONS_URL = "http://127.0.0.1:54321/functions/v1";
const LOCAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const DEFAULT_DEMO_AUTH_USER_ID = "00000000-0000-0000-0000-000000000001";

function readEnv(name: string): string | undefined {
  return process?.env?.[name];
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const value = readEnv(name);

  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

export const apiRuntimeConfig = {
  useMockApi: parseBooleanEnv("EXPO_PUBLIC_USE_MOCK_API", true),
  functionsBaseUrl: readEnv("EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL") ?? LOCAL_FUNCTIONS_URL,
  supabaseAnonKey: readEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY") ?? LOCAL_SUPABASE_ANON_KEY,
  demoAuthUserId: readEnv("EXPO_PUBLIC_DEMO_AUTH_USER_ID") ?? DEFAULT_DEMO_AUTH_USER_ID,
} as const;

export function getApiRuntimeInfo() {
  return {
    mode: apiRuntimeConfig.useMockApi ? "mock" : "live",
    functionsBaseUrl: apiRuntimeConfig.functionsBaseUrl,
    demoAuthUserId: apiRuntimeConfig.demoAuthUserId,
  };
}
