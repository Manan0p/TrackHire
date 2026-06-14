"use client";

import { useState } from "react";
import { Source, AppStatus } from "@prisma/client";
import { SOURCE_LABELS, STATUS_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ApplicationWithRelations } from "@/types";

const SOURCES: Source[] = ["LINKEDIN", "WELLFOUND", "EMAIL", "COMPANY_PORTAL", "REFERRAL", "OTHER"];
const STATUSES: AppStatus[] = ["WISHLIST", "APPLIED", "OA", "PHONE", "TECHNICAL", "FINAL", "OFFER", "REJECTED"];

interface ApplicationFormProps {
  defaultStatus?: AppStatus;
  onSuccess: (app: ApplicationWithRelations) => void;
  onCancel: () => void;
}

export function ApplicationForm({ defaultStatus = "APPLIED", onSuccess, onCancel }: ApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [source, setSource] = useState<Source>("LINKEDIN");
  const [status, setStatus] = useState<AppStatus>(defaultStatus);
  const [jobUrl, setJobUrl] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [appliedAt, setAppliedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!company.trim()) e.company = "Company name is required";
    if (!role.trim()) e.role = "Role is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);

    try {
      const payload = {
        company: company.trim(),
        role: role.trim(),
        source,
        status,
        jobUrl: jobUrl || undefined,
        recruiterName: recruiterName || undefined,
        recruiterEmail: recruiterEmail || undefined,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        currency,
        appliedAt: appliedAt ? new Date(appliedAt).toISOString() : new Date().toISOString(),
        notes: notes || undefined,
        tags: [],
        coverLetter: false,
        referral: false,
        boardOrder: 0,
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }

      const app = await res.json();
      toast.success(`Added ${company} application`);
      onSuccess(app);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, children: React.ReactNode, error?: string) => (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-medium text-[var(--foreground)]">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {field("Company *",
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Google, Stripe…" className="h-10 text-[13px]" />,
          errors.company
        )}
        {field("Role *",
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Software Engineer" className="h-10 text-[13px]" />,
          errors.role
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field("Source *",
          <Select value={source} onValueChange={(v) => setSource(v as Source)}>
            <SelectTrigger className="h-10 w-full text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => <SelectItem key={s} value={s} className="text-[13px]">{SOURCE_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {field("Status",
          <Select value={status} onValueChange={(v) => setStatus(v as AppStatus)}>
            <SelectTrigger className="h-10 w-full text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s} className="text-[13px]">{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {field("Job URL",
        <Input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="https://careers.company.com/…" className="h-10 text-[13px]" />
      )}

      <div className="grid grid-cols-2 gap-4">
        {field("Recruiter Name",
          <Input value={recruiterName} onChange={(e) => setRecruiterName(e.target.value)} placeholder="Sarah Johnson" className="h-10 text-[13px]" />
        )}
        {field("Recruiter Email",
          <Input type="email" value={recruiterEmail} onChange={(e) => setRecruiterEmail(e.target.value)} placeholder="sarah@co.com" className="h-10 text-[13px]" />
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {field("Min Salary",
          <Input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="1200000" className="h-10 text-[13px]" />
        )}
        {field("Max Salary",
          <Input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="1800000" className="h-10 text-[13px]" />
        )}
        {field("Currency",
          <Select value={currency} onValueChange={(v: string | null) => { if (v) setCurrency(v); }}>
            <SelectTrigger className="h-10 w-full text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["INR", "USD", "GBP", "EUR"].map((c) => <SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {field("Applied Date",
        <Input type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} className="h-10 text-[13px]" />
      )}

      {field("Notes",
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes…" className="text-[13px] min-h-[80px] resize-none" />
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1 h-10 text-[13px] bg-[var(--primary)] hover:bg-[var(--primary-dark)]">
          {loading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
          Add Application
        </Button>
        <Button type="button" variant="outline" className="h-10 px-6 text-[13px]" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
