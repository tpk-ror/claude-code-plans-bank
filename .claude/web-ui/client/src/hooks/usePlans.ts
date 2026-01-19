import { useCallback, useEffect, useState } from 'react';
import type { Plan, PlanFilters } from '../lib/types';

interface UsePlansReturn {
  plans: Plan[];
  selectedPlan: Plan | null;
  filters: PlanFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPlans: () => Promise<void>;
  selectPlan: (plan: Plan | null) => void;
  setFilters: (filters: Partial<PlanFilters>) => void;
  createPlan: (data: Partial<Plan>) => Promise<Plan>;
  updateStatus: (filename: string, status: Plan['status']) => Promise<void>;
  addNote: (filename: string, note: string) => Promise<void>;
  archivePlan: (filename: string) => Promise<void>;
  triggerSync: () => Promise<void>;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${url}`);
    }
    throw err;
  }
}

export function usePlans(
  onPlanUpdate?: () => void,
  wsOn?: <T = unknown>(event: string, callback: (data: T) => void) => () => void
): UsePlansReturn {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [filters, setFiltersState] = useState<PlanFilters>({
    status: '',
    category: '',
    search: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.set('status', filters.status);
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.search) queryParams.set('search', filters.search);

      const response = await fetchWithTimeout(
        `/api/plans?${queryParams.toString()}`,
        {},
        15000
      );

      if (!response.ok) {
        throw new Error(`Failed to load plans: ${response.statusText}`);
      }

      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load plans';
      setError(message);
      console.error('[Plans] Error loading plans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const selectPlan = useCallback((plan: Plan | null) => {
    setSelectedPlan(plan);
  }, []);

  const setFilters = useCallback((newFilters: Partial<PlanFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const createPlan = useCallback(async (data: Partial<Plan>): Promise<Plan> => {
    const response = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create plan');
    }

    const result = await response.json();
    await loadPlans();
    setSelectedPlan(result.plan);
    return result.plan;
  }, [loadPlans]);

  const updateStatus = useCallback(async (filename: string, status: Plan['status']) => {
    const response = await fetch(`/api/plans/${encodeURIComponent(filename)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update status');
    }

    await loadPlans();

    // Update selected plan if it's the one being modified
    if (selectedPlan?.filename === filename) {
      const updated = plans.find((p) => p.filename === filename);
      if (updated) {
        setSelectedPlan({ ...updated, status });
      }
    }
  }, [loadPlans, selectedPlan, plans]);

  const addNote = useCallback(async (filename: string, note: string) => {
    const response = await fetch(`/api/plans/${encodeURIComponent(filename)}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });

    if (!response.ok) {
      throw new Error('Failed to add note');
    }

    await loadPlans();
  }, [loadPlans]);

  const archivePlan = useCallback(async (filename: string) => {
    const response = await fetch(`/api/plans/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to archive plan');
    }

    // Clear selection if this was the selected plan
    if (selectedPlan?.filename === filename) {
      setSelectedPlan(null);
    }

    await loadPlans();
  }, [loadPlans, selectedPlan]);

  const triggerSync = useCallback(async () => {
    const response = await fetch('/api/sync', { method: 'POST' });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Sync failed');
    }

    await loadPlans();
  }, [loadPlans]);

  // Load plans on mount and when filters change
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Listen for WebSocket plan updates
  useEffect(() => {
    if (!wsOn) return;

    const unsub = wsOn('plan-update', () => {
      loadPlans();
      onPlanUpdate?.();
    });

    return unsub;
  }, [wsOn, loadPlans, onPlanUpdate]);

  return {
    plans,
    selectedPlan,
    filters,
    isLoading,
    error,
    loadPlans,
    selectPlan,
    setFilters,
    createPlan,
    updateStatus,
    addNote,
    archivePlan,
    triggerSync,
  };
}
