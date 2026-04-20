import { useMemo, useCallback } from "react";
import {
  useAppData,
  type AutoRule,
  type Transaction,
} from "../contexts/AppDataContext";

export interface AutoRuleMatch {
  rule: AutoRule;
  /** Which fields this rule auto-set */
  fieldsSet: {
    categoryId?: string;
    merchantId?: string;
    tagIds?: string[];
  };
}

export interface HistorySuggestion {
  type: "category" | "tag";
  id: string;
  name: string;
  color: string;
  confidence: number; // 0-1
}

/**
 * Evaluate auto-rules against the current form state.
 * Returns the best matching rule (most specific = most conditions)
 * and the fields it would set.
 */
export function useAutoRules() {
  const { autoRules, transactions, categories, merchants, tags } = useAppData();

  const evaluateRules = useCallback(
    (form: {
      description: string;
      merchantId: string;
      accountId: string;
      amount: string;
      type: string;
    }): AutoRuleMatch | null => {
      const enabledRules = autoRules.filter((r) => r.enabled);
      if (enabledRules.length === 0) return null;

      const desc = form.description.toLowerCase();
      const amount = parseFloat(form.amount) || 0;
      const merchant = merchants.find((m) => m.id === form.merchantId);
      const merchantName = merchant?.name?.toLowerCase() || "";

      // Evaluate each rule, score by number of matching conditions
      let bestMatch: { rule: AutoRule; score: number } | null = null;

      for (const rule of enabledRules) {
        let allMatch = true;
        let score = 0;

        for (const cond of rule.conditions) {
          let condMatch = false;
          const condVal =
            typeof cond.value === "string"
              ? cond.value.toLowerCase()
              : cond.value;

          switch (cond.field) {
            case "description":
              if (
                cond.operator === "contains" &&
                desc.includes(condVal as string)
              )
                condMatch = true;
              if (cond.operator === "equals" && desc === condVal)
                condMatch = true;
              break;
            case "merchant":
              if (
                cond.operator === "contains" &&
                merchantName.includes(condVal as string)
              )
                condMatch = true;
              if (
                cond.operator === "equals" &&
                merchantName === (condVal as string)
              )
                condMatch = true;
              break;
            case "amount":
              if (
                cond.operator === "greater_than" &&
                amount > (cond.value as number)
              )
                condMatch = true;
              if (
                cond.operator === "less_than" &&
                amount < (cond.value as number)
              )
                condMatch = true;
              if (
                cond.operator === "equals" &&
                amount === (cond.value as number)
              )
                condMatch = true;
              break;
          }

          if (!condMatch) {
            allMatch = false;
            break;
          }
          // More specific match (longer string) gets higher score
          score += cond.field === "description" ? String(cond.value).length : 1;
        }

        if (allMatch && rule.conditions.length > 0) {
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { rule, score };
          }
        }
      }

      if (!bestMatch) return null;

      // Build fields set
      const fieldsSet: AutoRuleMatch["fieldsSet"] = {};
      const addedTags: string[] = [];
      for (const action of bestMatch.rule.actions) {
        switch (action.type) {
          case "set_category":
            fieldsSet.categoryId = action.value;
            break;
          case "set_merchant":
            fieldsSet.merchantId = action.value;
            break;
          case "add_tag":
            addedTags.push(action.value);
            break;
        }
      }
      if (addedTags.length > 0) fieldsSet.tagIds = addedTags;

      return { rule: bestMatch.rule, fieldsSet };
    },
    [autoRules, merchants],
  );

  /**
   * History-based suggestions: look at last 10 similar transactions
   * and suggest categories/tags that appear in >70% of them.
   */
  const getSuggestions = useCallback(
    (form: {
      description: string;
      merchantId: string;
      type: string;
    }): HistorySuggestion[] => {
      const desc = form.description.toLowerCase().trim();
      if (desc.length < 2) return [];

      // Find similar transactions by keyword overlap
      const keywords = desc.split(/\s+/).filter((w) => w.length >= 2);
      if (keywords.length === 0) return [];

      const scored: { tx: Transaction; score: number }[] = [];
      for (const tx of transactions) {
        const txDesc = tx.description.toLowerCase();
        let score = 0;
        for (const kw of keywords) {
          if (txDesc.includes(kw)) score++;
        }
        // Also boost if same merchant
        if (form.merchantId && tx.merchantId === form.merchantId) score += 2;
        if (score > 0) scored.push({ tx, score });
      }

      scored.sort((a, b) => b.score - a.score);
      const similar = scored.slice(0, 10).map((s) => s.tx);
      if (similar.length < 2) return [];

      const suggestions: HistorySuggestion[] = [];

      // Category suggestions
      const catCounts: Record<string, number> = {};
      similar.forEach((tx) => {
        if (tx.categoryId)
          catCounts[tx.categoryId] = (catCounts[tx.categoryId] || 0) + 1;
      });
      for (const [catId, count] of Object.entries(catCounts)) {
        const confidence = count / similar.length;
        if (confidence >= 0.5) {
          // Lowered from 0.7 for demo purposes
          const cat = categories.find((c) => c.id === catId);
          if (cat && !cat.hidden) {
            suggestions.push({
              type: "category",
              id: catId,
              name: cat.name,
              color: cat.color,
              confidence,
            });
          }
        }
      }

      // Tag suggestions
      const tagCounts: Record<string, number> = {};
      similar.forEach((tx) => {
        tx.tags.forEach((tagId) => {
          tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
        });
      });
      for (const [tagId, count] of Object.entries(tagCounts)) {
        const confidence = count / similar.length;
        if (confidence >= 0.4) {
          const tag = tags.find((t) => t.id === tagId);
          if (tag) {
            suggestions.push({
              type: "tag",
              id: tagId,
              name: tag.name,
              color: tag.color,
              confidence,
            });
          }
        }
      }

      // Sort by confidence desc
      suggestions.sort((a, b) => b.confidence - a.confidence);
      return suggestions.slice(0, 6);
    },
    [transactions, categories, tags],
  );

  return { evaluateRules, getSuggestions };
}
