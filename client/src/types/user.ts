// Base User (matches UserRead from schemas.py)
export interface User {
  id: number;
  name: string;
  email: string;
}

// User with admin info (matches UserReadWithAdminInfo from schemas.py)
export interface UserWithAdminInfo extends User {
  violation_count: number;
  is_banned: boolean;
}

// Extended user type for admin panel (includes additional fields for UI)
export interface AdminUser extends User {
  username: string;  // For backward compatibility with UI
  full_name?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}
