import { apiRequest } from './apiClient';
import type {
  AutoRuleDetailResponse,
  AutoRulesListQuery,
  AutoRulesListResponse,
  AutoRulesMetaResponse,
  CreateAutoRulePayload,
  UpdateAutoRulePayload,
} from '../types/autoRules';

function buildQueryString(query: AutoRulesListQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export const autoRulesService = {
  getMeta() {
    return apiRequest<AutoRulesMetaResponse>('/auto-rules/meta', {
      method: 'GET',
      requiresAuth: true,
    });
  },
  listAutoRules(query: AutoRulesListQuery = {}) {
    return apiRequest<AutoRulesListResponse>(`/auto-rules${buildQueryString(query)}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },
  getAutoRuleDetail(ruleId: string) {
    return apiRequest<AutoRuleDetailResponse>(`/auto-rules/${ruleId}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },
  createAutoRule(payload: CreateAutoRulePayload) {
    return apiRequest<AutoRuleDetailResponse>('/auto-rules', {
      method: 'POST',
      requiresAuth: true,
      body: payload,
    });
  },
  updateAutoRule(ruleId: string, payload: UpdateAutoRulePayload) {
    return apiRequest<AutoRuleDetailResponse>(`/auto-rules/${ruleId}`, {
      method: 'PATCH',
      requiresAuth: true,
      body: payload,
    });
  },
  deleteAutoRule(ruleId: string) {
    return apiRequest<{ id: string }>(`/auto-rules/${ruleId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  },
  reorderAutoRules(orderedIds: string[]) {
    return apiRequest<AutoRulesListResponse>('/auto-rules/reorder', {
      method: 'POST',
      requiresAuth: true,
      body: { orderedIds },
    });
  },
};
