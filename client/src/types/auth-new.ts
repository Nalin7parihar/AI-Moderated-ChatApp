export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string; // This will be the name field from User model
  password: string;
}

export interface RegisterRequest {
  name: string;     // Matches UserCreate schema
  email: string;
  password: string;
}

export interface TokenData {
  id: number;       // Matches your TokenData schema (int not string)
}
