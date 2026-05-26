import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_ANON_KEY;

function createStubServerClient() {
  return {
    from() {
      const chain = () => ({
        eq: () => ({ single: async () => ({ data: null, error: { message: "Supabase client is not configured." } }) }),
        single: async () => ({ data: null, error: { message: "Supabase client is not configured." } }),
      })
      return {
        select: () => chain(),
        insert: async () => ({ data: null, error: { message: "Supabase client is not configured." } }),
        update: async () => ({ data: null, error: { message: "Supabase client is not configured." } }),
        delete: async () => ({ data: null, error: { message: "Supabase client is not configured." } }),
      }
    },
    auth: {
      getUser: async () => ({ data: { user: null }, error: { message: "Supabase client is not configured." } }),
      getSession: async () => ({ data: { session: null }, error: { message: "Supabase client is not configured." } }),
    },
    rpc: async () => ({ data: null, error: { message: "Supabase client is not configured." } }),
  } as any;
}

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  if (!supabaseUrl || !supabaseKey) {
    return createStubServerClient()
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};

type ServerCookieStore = Awaited<ReturnType<typeof cookies>>

function clearSupabaseAuthCookies(cookieStore: ServerCookieStore) {
  if (typeof cookieStore.delete !== "function") {
    return
  }

  const cookies = cookieStore.getAll()
  cookies.forEach((cookie) => {
    if (cookie?.name?.startsWith?.("sb-")) {
      cookieStore.delete?.(cookie.name)
    }
  })
}

export async function getServerAuth(cookieStore: ServerCookieStore) {
  const supabase = createClient(cookieStore)

  try {
    const authResponse = await supabase.auth.getUser()

    if (authResponse.error?.code === "refresh_token_not_found") {
      clearSupabaseAuthCookies(cookieStore)
    }

    return {
      supabase,
      data: authResponse.data,
      error: authResponse.error,
    }
  } catch (error) {
    console.error("[supabase] auth.getUser failed:", error)
    clearSupabaseAuthCookies(cookieStore)

    return {
      supabase,
      data: { user: null },
      error: {
        message: (error as any)?.message ?? "Unknown Supabase auth error",
        code: (error as any)?.code,
        status: (error as any)?.status,
      },
    }
  }
}
