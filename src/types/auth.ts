export interface User {
  id: string;
  email: string;
  display_name?: string | null;
  created_at: string;
  is_admin: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
}

export interface MagicLinkRequest {
  email: string;
  login_url?: string;
}

export interface MagicLinkConfirm {
  token: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}
