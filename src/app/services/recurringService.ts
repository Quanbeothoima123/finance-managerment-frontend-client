import { apiRequest } from './apiClient';
import type {
  CreateRecurringRulePayload,
  RecurringDetailResponse,
  RecurringListQuery,
  RecurringListResponse,
  RecurringMetaResponse,
  RecurringOccurrencesResponse,
  UpdateRecurringRulePayload,
} from '../types/recurring';

function buildQueryString(query: RecurringListQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export const recurringService = {
  getMeta() {
    return apiRequest<RecurringMetaResponse>('/recurring/meta', {
      method: 'GET',
      requiresAuth: true,
    });
  },
  listRecurringRules(query: RecurringListQuery = {}) {
    return apiRequest<RecurringListResponse>(`/recurring${buildQueryString(query)}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },
  getRecurringRuleDetail(ruleId: string) {
    return apiRequest<RecurringDetailResponse>(`/recurring/${ruleId}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },
  createRecurringRule(payload: CreateRecurringRulePayload) {
    return apiRequest<RecurringDetailResponse>('/recurring', {
      method: 'POST',
      requiresAuth: true,
      body: payload,
    });
  },
  updateRecurringRule(ruleId: string, payload: UpdateRecurringRulePayload) {
    return apiRequest<RecurringDetailResponse>(`/recurring/${ruleId}`, {
      method: 'PATCH',
      requiresAuth: true,
      body: payload,
    });
  },
  deleteRecurringRule(ruleId: string) {
    return apiRequest<{ deleted: boolean; id: string }>(`/recurring/${ruleId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  },
  getOccurrences(ruleId: string, limit = 20) {
    return apiRequest<RecurringOccurrencesResponse>(`/recurring/${ruleId}/occurrences?limit=${limit}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },
  pause(ruleId: string) {
    return apiRequest<RecurringDetailResponse>(`/recurring/${ruleId}/pause`, {
      method: 'PATCH',
      requiresAuth: true,
    });
  },
  resume(ruleId: string) {
    return apiRequest<RecurringDetailResponse>(`/recurring/${ruleId}/resume`, {
      method: 'PATCH',
      requiresAuth: true,
    });
  },
  skipNext(ruleId: string) {
    return apiRequest<RecurringDetailResponse>(`/recurring/${ruleId}/skip-next`, {
      method: 'POST',
      requiresAuth: true,
    });
  },
  runNow(ruleId: string) {
    return apiRequest<RecurringDetailResponse>(`/recurring/${ruleId}/run-now`, {
      method: 'POST',
      requiresAuth: true,
    });
  },
  duplicate(ruleId: string) {
    return apiRequest<RecurringDetailResponse>(`/recurring/${ruleId}/duplicate`, {
      method: 'POST',
      requiresAuth: true,
    });
  },
  pauseRecurringRule(ruleId: string) {
    return this.pause(ruleId);
  },
  resumeRecurringRule(ruleId: string) {
    return this.resume(ruleId);
  },
  skipNextOccurrence(ruleId: string) {
    return this.skipNext(ruleId);
  },
  runRecurringRuleNow(ruleId: string) {
    return this.runNow(ruleId);
  },
};
