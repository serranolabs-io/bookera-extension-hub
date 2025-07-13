import { genShortID } from '../util';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const getUsername = (user: SupabaseUser): string => {
  return user?.name === '' ? user.email : user.name;
};

export const getUserId = (user: SupabaseUser) => {
  return user.id;
};
