export type UserRole = 'admin' | 'verifier' | 'data_entry';

export interface UserProfile {
  id: string;
  full_name: string;
  designation: string;
  department: string;
  role: UserRole;
}