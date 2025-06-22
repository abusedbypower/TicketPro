export interface UserProfile {
  user_id: string;
  full_name?: string;
  role?: 'admin' | 'hr_manager' | 'it_manager' | 'manager' | 'employee' | 'user';
  department?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email?: string;
  created_at?: string;
}