import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_ANON_KEY;

function createStubBrowserClient() {
  return {
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: "Supabase client is not configured." } }),
      signUp: async () => ({ data: null, error: { message: "Supabase client is not configured." } }),
      signOut: async () => ({ error: { message: "Supabase client is not configured." } }),
    },
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
    rpc: async () => ({ data: null, error: { message: "Supabase client is not configured." } }),
  } as any;
}

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    return createStubBrowserClient()
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
};