import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';

export type User = { id: string; name: string; email: string; role: 'client' | 'star' | 'admin' };
type Payload = Record<string, unknown>;
function fail(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (['42P01', 'PGRST205', 'PGRST202'].includes(error.code || '')) {
    throw Error('La base StarCast n’est pas initialisée. Exécutez supabase/setup.sql dans le SQL Editor de Supabase.');
  }
  throw Error(error.message);
}
async function currentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  fail(error);
  if (!user) return null;
  const profile = await supabase.from('starcast_profiles').select('name,role').eq('id', user.id).single();
  fail(profile.error);
  return { id: user.id, email: user.email || '', name: profile.data.name, role: profile.data.role };
}
async function rpc(name: string, args: Payload): Promise<unknown> {
  const { data, error } = await supabase.rpc(name, args);
  fail(error);
  return data;
}
export async function api<T = unknown>(path: string, raw?: unknown, verb?: string): Promise<T> {
  const body = (raw || {}) as Payload;
  const method = verb || (raw ? 'POST' : 'GET');
  let result: unknown;
  if (path === '/auth/me') result = { user: await currentUser() };
  else if (path === '/auth/logout') {
    const { error } = await supabase.auth.signOut(); fail(error); result = {};
  } else if (path === '/auth/login') {
    const { error } = await supabase.auth.signInWithPassword({ email: String(body.email), password: String(body.password) });
    fail(error); result = { user: await currentUser() };
  } else if (path === '/auth/register') {
    if (String(body.password).length < 10) throw Error('Mot de passe de 10 caractères minimum requis.');
    if (!String(body.name || '').trim()) throw Error('Nom requis.');
    const role = body.role === 'star' ? 'star' : 'client';
    if (role === 'star' && (!body.consent || !body.handle)) throw Error('Profil social et autorisation requis.');
    const { data, error } = await supabase.auth.signUp({
      email: String(body.email), password: String(body.password),
      options: { emailRedirectTo: window.location.origin + '/connexion', data: {
        name: String(body.name).trim(), role, handle: body.handle, city: body.city, ai_consent: body.consent === true,
      } },
    });
    fail(error);
    result = { user: data.session ? await currentUser() : null, needsConfirmation: !data.session };
  } else if (path === '/stars' && method === 'GET') {
    result = await rpc('starcast_list_stars', {});
  } else if (path.match(/^\/stars\/[^/]+$/) && method === 'PATCH') {
    result = await rpc('starcast_admin_star', { star_id: path.split('/')[2], payload: body });
  } else if (path === '/profile') {
    if (method === 'PATCH') result = await rpc('starcast_save_profile', { payload: body });
    else {
      const user = await currentUser();
      if (!user || user.role !== 'star') throw Error('Compte star requis.');
      const { data, error } = await supabase.from('starcast_stars').select('data').eq('user_id', user.id).single();
      fail(error); result = data?.data;
    }
  } else if (path === '/reviews') {
    const { data, error } = await supabase.from('starcast_reviews').select('data').order('created_at');
    fail(error); result = data?.map(r => r.data) || [];
  } else if (path === '/orders') {
    if (method === 'POST') result = await rpc('starcast_create_order', { payload: body });
    else {
      if (!await currentUser()) throw Error('Connexion nécessaire.');
      const { data, error } = await supabase.from('starcast_orders').select('data').order('created_at', { ascending: false });
      fail(error); result = data?.map(r => r.data) || [];
    }
  } else {
    const match = path.match(/^\/orders\/([^/]+)(?:\/(messages|review))?$/);
    if (!match) throw Error('Route introuvable.');
    if (match[2] === 'messages') {
      if (method === 'POST') result = await rpc('starcast_send_message', { project_id: match[1], content: String(body.content || '') });
      else {
        const { data, error } = await supabase.from('starcast_messages').select('data').eq('order_id', match[1]).order('created_at');
        fail(error); result = data?.map(r => r.data) || [];
      }
    } else if (match[2] === 'review') {
      result = await rpc('starcast_post_review', { project_id: match[1], stars_rating: body.rating, content: body.content });
    } else if (method === 'PATCH') {
      result = await rpc('starcast_update_order', { project_id: match[1], payload: body });
    } else {
      const { data, error } = await supabase.from('starcast_orders').select('data').eq('id', match[1]).maybeSingle();
      fail(error); if (!data) throw Error('Projet introuvable ou accès refusé.'); result = data.data;
    }
  }
  return result as T;
}
const Context = createContext<{ user: User | null; loading: boolean; error: string; refresh: () => Promise<void> }>({
  user: null, loading: true, error: '', refresh: async () => {},
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function refresh() {
    try { setUser(await currentUser()); setError(''); }
    catch (e) { setUser(null); setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    refresh();
    // Supabase warns against awaiting other Auth methods inside its callback.
    const { data } = supabase.auth.onAuthStateChange(() => { setTimeout(() => { refresh(); }, 0); });
    return () => data.subscription.unsubscribe();
  }, []);
  return <Context.Provider value={{ user, loading, error, refresh }}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
export function useRemote<T>(path: string, initial: T) {
  const { user } = useAuth();
  const [data, setData] = useState(initial), [error, setError] = useState('');
  async function refresh() {
    try { setData(await api<T>(path)); setError(''); }
    catch (e) { setError((e as Error).message); }
  }
  useEffect(() => {
    let active = true;
    setData(initial);
    api<T>(path).then(value => { if (active) { setData(value); setError(''); } })
      .catch(e => { if (active) setError((e as Error).message); });
    return () => { active = false; };
  }, [path, user?.id]);
  return { data, error, refresh };
}
