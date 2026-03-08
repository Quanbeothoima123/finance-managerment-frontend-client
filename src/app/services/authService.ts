import { apiRequest } from './apiClient';
import type {
  AuthSuccessPayload,
  AuthUser,
  EmailOtpPayload,
  ForgotPasswordResetPayload,
  LoginPayload,
  RegisterPayload,
} from '../types/auth';

interface RegisterResponse {
  user: AuthUser;
  verificationRequired: boolean;
}

interface EmailVerificationRequestResponse {
  alreadyVerified: boolean;
}

interface ForgotPasswordVerifyResponse {
  resetToken: string;
}

export const authService = {
  register(payload: RegisterPayload) {
    return apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    });
  },

  requestEmailVerification(payload: { email: string }) {
    return apiRequest<EmailVerificationRequestResponse>('/auth/email-verification/request', {
      method: 'POST',
      body: payload,
    });
  },

  verifyEmail(payload: EmailOtpPayload) {
    return apiRequest<null>('/auth/email-verification/verify', {
      method: 'POST',
      body: payload,
    });
  },

  loginWithPassword(payload: LoginPayload) {
    return apiRequest<AuthSuccessPayload>('/auth/login', {
      method: 'POST',
      body: payload,
    });
  },

  requestLoginOtp(payload: { email: string }) {
    return apiRequest<null>('/auth/otp/request', {
      method: 'POST',
      body: payload,
    });
  },

  verifyLoginOtp(payload: EmailOtpPayload) {
    return apiRequest<AuthSuccessPayload>('/auth/otp/verify', {
      method: 'POST',
      body: payload,
    });
  },

  requestForgotPassword(payload: { email: string }) {
    return apiRequest<null>('/auth/forgot-password/request', {
      method: 'POST',
      body: payload,
    });
  },

  verifyForgotPasswordOtp(payload: EmailOtpPayload) {
    return apiRequest<ForgotPasswordVerifyResponse>('/auth/forgot-password/verify', {
      method: 'POST',
      body: payload,
    });
  },

  resetPassword(payload: ForgotPasswordResetPayload) {
    return apiRequest<null>('/auth/forgot-password/reset', {
      method: 'POST',
      body: payload,
    });
  },

  refreshSession() {
    return apiRequest<AuthSuccessPayload>('/auth/refresh', {
      method: 'POST',
    });
  },

  logout() {
    return apiRequest<null>('/auth/logout', {
      method: 'POST',
    });
  },

  me() {
    return apiRequest<AuthUser>('/auth/me', {
      method: 'GET',
      requiresAuth: true,
    });
  },
};
