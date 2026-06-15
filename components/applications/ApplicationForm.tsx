"use client";

import { useState } from "react";
import { Source, AppStatus } from "@prisma/client";
import { SOURCE_LABELS, STATUS_LABELS } from "@/types";
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

const inputBase: React.CSSProperties = {
  width: "100%",
  height: "40px",
  padding: "0 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "6px",
  fontSize: "13px",
  color: "#111827",
  background: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance: "none",
};

const labelBase: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "5px",
};

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 11, color: "#EF4444", marginTop: 3 }}>{error}</p>}
    </div>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div suppressHydrationWarning style={{ position: "relative" }}>
      <input
        {...props}
        autoComplete="off"
        data-form-type="other"
        style={{
          ...inputBase,
          borderColor: focused ? "#005F4B" : "#D1D5DB",
          boxShadow: focused ? "0 0 0 3px rgba(0,95,75,0.08)" : "none",
          paddingRight: "12px",
          ...props.style,
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      />
    </div>
  );
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...inputBase,
        height: "40px",
        paddingRight: "28px",
        cursor: "pointer",
        appearance: "auto",
        borderColor: focused ? "#005F4B" : "#D1D5DB",
        boxShadow: focused ? "0 0 0 3px rgba(0,95,75,0.08)" : "none",
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
    >
      {props.children}
    </select>
  );
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
  const [notesFocused, setNotesFocused] = useState(false);

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

  const gap = 14;
  const rowStyle: React.CSSProperties = { display: "grid", gap };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Row 1: Company | Role */}
      <div style={{ ...rowStyle, gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Company *" error={errors.company}>
          <StyledInput
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Google, Stripe…"
            autoComplete="off"
          />
        </Field>
        <Field label="Role *" error={errors.role}>
          <StyledInput
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Software Engineer"
            autoComplete="off"
          />
        </Field>
      </div>

      {/* Row 2: Source | Status */}
      <div style={{ ...rowStyle, gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Source">
          <StyledSelect value={source} onChange={(e) => setSource(e.target.value as Source)}>
            {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
          </StyledSelect>
        </Field>
        <Field label="Status">
          <StyledSelect value={status} onChange={(e) => setStatus(e.target.value as AppStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </StyledSelect>
        </Field>
      </div>

      {/* Job URL */}
      <Field label="Job URL">
        <StyledInput
          type="url"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="https://careers.company.com/…"
          autoComplete="off"
        />
      </Field>

      {/* Row 3: Recruiter Name | Recruiter Email */}
      <div style={{ ...rowStyle, gridTemplateColumns: "1fr 1fr" }} suppressHydrationWarning>
        <Field label="Recruiter Name">
          <StyledInput
            value={recruiterName}
            onChange={(e) => setRecruiterName(e.target.value)}
            placeholder="Sarah Johnson"
            autoComplete="off"
            data-form-type="other"
          />
        </Field>
        <Field label="Recruiter Email">
          <div suppressHydrationWarning>
            <StyledInput
              type="text"
              inputMode="email"
              value={recruiterEmail}
              onChange={(e) => setRecruiterEmail(e.target.value)}
              placeholder="sarah@co.com"
              autoComplete="off"
              data-form-type="other"
              style={{ WebkitTextSecurity: undefined } as React.CSSProperties}
            />
          </div>
        </Field>
      </div>

      {/* Row 4: Min Salary | Max Salary | Currency */}
      <div style={{ ...rowStyle, gridTemplateColumns: "1fr 1fr 100px" }}>
        <Field label="Min Salary">
          <StyledInput
            type="number"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="1200000"
            autoComplete="off"
          />
        </Field>
        <Field label="Max Salary">
          <StyledInput
            type="number"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder="1800000"
            autoComplete="off"
          />
        </Field>
        <Field label="Currency">
          <StyledSelect value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {["INR", "USD", "GBP", "EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
          </StyledSelect>
        </Field>
      </div>

      {/* Applied Date */}
      <Field label="Applied Date">
        <StyledInput
          type="date"
          value={appliedAt}
          onChange={(e) => setAppliedAt(e.target.value)}
        />
      </Field>

      {/* Notes */}
      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes…"
          rows={3}
          onFocus={() => setNotesFocused(true)}
          onBlur={() => setNotesFocused(false)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `1px solid ${notesFocused ? "#005F4B" : "#D1D5DB"}`,
            borderRadius: "6px",
            fontSize: "13px",
            color: "#111827",
            background: "#ffffff",
            outline: "none",
            boxSizing: "border-box",
            resize: "vertical",
            fontFamily: "inherit",
            boxShadow: notesFocused ? "0 0 0 3px rgba(0,95,75,0.08)" : "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        />
      </Field>

      {/* Submit row */}
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1,
            height: 40,
            background: loading ? "#4A9080" : "#005F4B",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#004A3A"; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#005F4B"; }}
        >
          {loading && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
          Add Application
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            height: 40,
            padding: "0 20px",
            background: "transparent",
            color: "#6B7280",
            border: "1px solid #D1D5DB",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[data-form-type="other"]::-webkit-credentials-auto-fill-button { visibility: hidden; position: absolute; right: 0; }
        input[data-form-type="other"]::-webkit-textfield-decoration-container { visibility: hidden; }
      `}</style>
    </form>
  );
}
