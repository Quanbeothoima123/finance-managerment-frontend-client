export interface FieldError {
  field?: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: FieldError[] | null;
}

export interface AuthUser {
  id: string;
  publicId: string;
  displayName: string;
  email: string;
  birthDate?: string | null;
  avatarUrl?: string | null;
  status: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
  rememberMe: boolean;
}

export interface AuthSuccessPayload {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterPayload {
  displayName: string;
  birthDate?: string | null;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface EmailOtpPayload {
  email: string;
  code: string;
}

export interface ForgotPasswordResetPayload {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmNewPassword: string;
}
