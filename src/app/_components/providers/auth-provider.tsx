'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/app/_lib/supabase/client';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import type { Profile } from '@/app/_lib/types/database';

/**
 * Auth provider component that initializes and maintains the auth state.
 * Listens for auth state changes from Supabase and updates the Zustand store.
 */
export function AuthProvider({ 
  children,
  initialUser,
}: { 
  children: React.ReactNode;
  initialUser?: Profile | null;
}) {
  const { setUser, setLoading } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Set initial user from server-side fetch only once
    if (!initialized.current) {
      if (initialUser !== undefined) {
        setUser(initialUser);
      }
      initialized.current = true;
    }

    const supabase = createClient();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only fetch profile on significant events to avoid spam
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        return;
      }

      // Only refetch if it's a fresh sign-in
      if (event === 'SIGNED_IN') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser(profile);
        }
      }
    });

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };
    // Removed initialUser from dependencies to prevent re-render loops
  }, [setUser, setLoading]);

  return <>{children}</>;
}
