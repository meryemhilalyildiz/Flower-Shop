import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { checkAdminAccess } from '../services/adminApi';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function useAdminAuth() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setProfile(user);
          const adminCheck = await checkAdminAccess(user.id);
          setIsAdmin(adminCheck);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Auth hatası:', error);
        setProfile(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    loadAuth();

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setProfile(session.user);
        const adminCheck = await checkAdminAccess(session.user.id);
        setIsAdmin(adminCheck);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { loading, profile, isAdmin };
}
