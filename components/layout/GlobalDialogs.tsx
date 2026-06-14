"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApplicationForm } from "@/components/applications/ApplicationForm";

export function GlobalDialogs() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
    };

    window.addEventListener("open-add-application", handleOpen);
    return () => {
      window.removeEventListener("open-add-application", handleOpen);
    };
  }, []);

  const handleSuccess = () => {
    setOpen(false);
    if (pathname === "/board") {
      // Refresh the page data if on board
      window.location.reload();
    } else {
      // Redirect to board to view the newly added application
      router.push("/board");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Add Application</DialogTitle>
        </DialogHeader>
        <ApplicationForm
          defaultStatus="APPLIED"
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
