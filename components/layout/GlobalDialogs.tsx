"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApplicationForm } from "@/components/applications/ApplicationForm";
import { AppStatus } from "@prisma/client";
import type { ApplicationWithRelations } from "@/types";

/**
 * Single global Add Application dialog.
 * Triggered from anywhere via:
 *   window.dispatchEvent(new CustomEvent("open-add-application", { detail: { status: "APPLIED" } }))
 *
 * On success on /board, fires a "application-added" CustomEvent so the board
 * can refresh its data without a full page reload.
 */
export function GlobalDialogs() {
  const [open, setOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<AppStatus>("APPLIED");
  const pathname = usePathname();

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const status = (e as CustomEvent<{ status?: AppStatus }>).detail?.status ?? "APPLIED";
      setDefaultStatus(status);
      setOpen(true);
    };

    window.addEventListener("open-add-application", handleOpen);
    return () => window.removeEventListener("open-add-application", handleOpen);
  }, []);

  const handleSuccess = useCallback((app: ApplicationWithRelations) => {
    setOpen(false);
    // Notify board (or any listener) about the new app — no full reload needed
    window.dispatchEvent(new CustomEvent("application-added", { detail: { app } }));
    // If not on board, navigate there
    if (pathname !== "/board") {
      window.location.href = "/board";
    }
  }, [pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        style={{
          padding: "28px 32px",
          borderRadius: 12,
          minWidth: 560,
          maxWidth: 620,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <DialogHeader style={{ marginBottom: 20 }}>
          <DialogTitle className="text-[16px] font-bold">Add Application</DialogTitle>
        </DialogHeader>
        <ApplicationForm
          defaultStatus={defaultStatus}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
