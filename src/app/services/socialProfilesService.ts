import { apiRequest } from "./apiClient";
import type {
  OnboardingPayload,
  SocialProfile,
  UpdateProfilePayload,
} from "../types/community";

export const socialProfilesService = {
  getMyProfile() {
    return apiRequest<SocialProfile>("/community/profiles/me", {
      method: "GET",
      requiresAuth: true,
    });
  },

  updateMyProfile(payload: UpdateProfilePayload) {
    return apiRequest<SocialProfile>("/community/profiles/me", {
      method: "PATCH",
      requiresAuth: true,
      body: payload as unknown as Record<string, unknown>,
    });
  },

  completeOnboarding(payload: OnboardingPayload) {
    return apiRequest<SocialProfile>("/community/profiles/me/onboarding", {
      method: "POST",
      requiresAuth: true,
      body: payload as unknown as Record<string, unknown>,
    });
  },

  getProfileByUsername(username: string) {
    return apiRequest<SocialProfile>(
      `/community/profiles/u/${encodeURIComponent(username)}`,
      { method: "GET", requiresAuth: true },
    );
  },

  getProfileById(profileId: string) {
    return apiRequest<SocialProfile>(`/community/profiles/${profileId}`, {
      method: "GET",
      requiresAuth: true,
    });
  },
};
