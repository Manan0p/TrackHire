"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ApplicationWithRelations } from "@/types";

export function useApplications(initialData?: ApplicationWithRelations[]) {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async (params: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: "200", ...params });
      const res = await fetch(`/api/applications?${query}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch {
      setError("Failed to load applications");
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialData) return;
    const timer = window.setTimeout(() => {
      void fetch_();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetch_, initialData]);

  const updateApplication = (updated: ApplicationWithRelations) => {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const addApplication = (app: ApplicationWithRelations) => {
    setApplications((prev) => [app, ...prev]);
  };

  const removeApplication = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  const patchApplication = async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      updateApplication(updated);
      return updated;
    } catch {
      toast.error("Failed to update application");
      throw new Error("Update failed");
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      await fetch(`/api/applications/${id}`, { method: "DELETE" });
      removeApplication(id);
      toast.success("Application archived");
    } catch {
      toast.error("Failed to archive application");
    }
  };

  return {
    applications,
    loading,
    error,
    refresh: fetch_,
    updateApplication,
    addApplication,
    patchApplication,
    deleteApplication,
  };
}
