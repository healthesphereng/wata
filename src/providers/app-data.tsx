'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Child {
  id: string;
  family_id: string;
  name: string;
  birth_date: string | null;
  sex: 'male' | 'female' | 'other' | null;
}

interface AppData {
  userId: string;
  familyId: string | null;
  children: Child[];
  loading: boolean;
  selectedChild: Child | null;
  selectChild: (id: string) => void;
  addChild: (name: string, birthDate?: string | null, sex?: Child['sex']) => Promise<void>;
  updateChild: (id: string, patch: Partial<Pick<Child, 'name' | 'birth_date'>>) => Promise<void>;
}

const AppDataContext = createContext<AppData | null>(null);

const SELECTED_KEY = 'wata:selected-child';

/**
 * Loads the signed-in user's family and children (online — you set up your
 * baby once) and tracks which child is currently selected. Event logging is
 * offline-first and lives in the separate useEvents hook.
 */
export function AppDataProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [kids, setKids] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id')
      .limit(1)
      .maybeSingle();
    const fam = membership?.family_id ?? null;
    setFamilyId(fam);

    if (fam) {
      const { data: rows } = await supabase
        .from('children')
        .select('id, family_id, name, birth_date, sex')
        .is('archived_at', null)
        .order('created_at', { ascending: true });
      setKids(rows ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  // Restore / default the selected child once children are known.
  useEffect(() => {
    if (kids.length === 0) {
      setSelectedId(null);
      return;
    }
    const stored = typeof window !== 'undefined' ? localStorage.getItem(SELECTED_KEY) : null;
    const valid = stored && kids.some((k) => k.id === stored) ? stored : kids[0].id;
    setSelectedId(valid);
  }, [kids]);

  const selectChild = useCallback((id: string) => {
    setSelectedId(id);
    localStorage.setItem(SELECTED_KEY, id);
  }, []);

  const addChild = useCallback(
    async (name: string, birthDate?: string | null, sex?: Child['sex']) => {
      if (!familyId) throw new Error('No family yet');
      const { data, error } = await supabase
        .from('children')
        .insert({
          family_id: familyId,
          name: name.trim(),
          birth_date: birthDate ?? null,
          sex: sex ?? null,
        })
        .select('id, family_id, name, birth_date, sex')
        .single();
      if (error) throw new Error(error.message);
      setKids((prev) => [...prev, data]);
      selectChild(data.id);
    },
    [familyId, supabase, selectChild]
  );

  const updateChild = useCallback(
    async (id: string, patch: Partial<Pick<Child, 'name' | 'birth_date'>>) => {
      const { data, error } = await supabase
        .from('children')
        .update(patch)
        .eq('id', id)
        .select('id, family_id, name, birth_date, sex')
        .single();
      if (error) throw new Error(error.message);
      setKids((prev) => prev.map((k) => (k.id === id ? data : k)));
    },
    [supabase]
  );

  const value = useMemo<AppData>(
    () => ({
      userId,
      familyId,
      children: kids,
      loading,
      selectedChild: kids.find((k) => k.id === selectedId) ?? null,
      selectChild,
      addChild,
      updateChild,
    }),
    [userId, familyId, kids, loading, selectedId, selectChild, addChild, updateChild]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
