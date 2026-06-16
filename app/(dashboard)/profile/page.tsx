"use client";

import { useState, useEffect } from "react";
import {
  User, Globe, FileText, Plus, Trash2,
  ChevronDown, ChevronUp, CheckCircle2, Loader2, Eye, X,
  Briefcase, GraduationCap, Code2, Award, Sparkles, GitBranch, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import { calcResumeCompleteness } from "@/lib/resume-compiler";
import { TopBar } from "@/components/layout/TopBar";
import type { ResumeData, ResumeExperience, ResumeEducation, ResumeProject } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  headline: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  resumeText: string | null;
  resumeData: ResumeData | null;
  coverLetter: string | null;
}

const EMPTY_RESUME: ResumeData = {
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
};

function newId() {
  return Math.random().toString(36).slice(2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 4, borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F0F9F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color="#005F4B" />
      </div>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0, flex: 1 }}>{title}</h2>
      {badge && (
        <span style={{ fontSize: 11, fontWeight: 600, color: "#005F4B", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "2px 8px", borderRadius: 20 }}>
          {badge}
        </span>
      )}
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151" }}>{children}</label>
      {hint && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

function StyledInput({
  value, onChange, placeholder, disabled, type = "text", icon: Icon,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  disabled?: boolean; type?: string; icon?: React.ElementType;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {Icon && (
        <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon size={14} color="#9CA3AF" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", height: 40,
          padding: `0 12px 0 ${Icon ? "32px" : "12px"}`,
          border: `1px solid ${focused ? "#005F4B" : "#D1D5DB"}`,
          borderRadius: 8, fontSize: 13, color: "#111827",
          background: disabled ? "#F9FAFB" : "#fff",
          outline: "none", boxSizing: "border-box",
          boxShadow: focused ? "0 0 0 3px rgba(0,95,75,0.08)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      />
    </div>
  );
}

function TealButton({ onClick, disabled, loading, children, size = "md", fullWidth = false }: {
  onClick?: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode; size?: "sm" | "md"; fullWidth?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height: size === "sm" ? 34 : 40,
        padding: `0 ${size === "sm" ? 14 : 20}px`,
        background: (disabled || loading) ? "#9CA3AF" : hov ? "#004A3A" : "#005F4B",
        color: "#fff", border: "none", borderRadius: 8,
        fontSize: size === "sm" ? 12.5 : 13, fontWeight: 600,
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
        width: fullWidth ? "100%" : "auto", justifyContent: fullWidth ? "center" : undefined,
        transition: "background 0.15s",
      }}
    >
      {loading && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
      {children}
    </button>
  );
}

function GhostButton({ onClick, children, danger = false }: {
  onClick: (e?: React.MouseEvent) => void; children: React.ReactNode; danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height: 32, padding: "0 10px",
        background: hov ? (danger ? "#FEF2F2" : "#F3F4F6") : "transparent",
        color: danger ? "#DC2626" : "#6B7280",
        border: `1px solid ${hov ? (danger ? "#FECACA" : "#E5E7EB") : "transparent"}`,
        borderRadius: 6, fontSize: 12, fontWeight: 500,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
        transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Skills Input ─────────────────────────────────────────────────────────────

function SkillsInput({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [text, setText] = useState(() => skills.join(", "));

  useEffect(() => {
    const currentParsed = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const isEqual =
      currentParsed.length === skills.length &&
      currentParsed.every((v, i) => v === skills[i]);
    if (!isEqual) {
      setText(skills.join(", "));
    }
  }, [skills, text]);

  const handleChange = (val: string) => {
    setText(val);
    const parsed = val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const unique: string[] = [];
    for (const item of parsed) {
      if (!unique.includes(item)) {
        unique.push(item);
      }
    }
    onChange(unique);
  };

  const removeSkill = (s: string) => {
    onChange(skills.filter((x) => x !== s));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="React, TypeScript, Next.js, Node.js, Python, SQL..."
          rows={3}
          style={{
            width: "100%", padding: "12px",
            border: "1px solid #D1D5DB", borderRadius: 8,
            fontSize: 13, color: "#111827", resize: "vertical",
            outline: "none", fontFamily: "Inter, sans-serif", lineHeight: 1.6,
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 11.5, color: "#6B7280" }}>
            Separate skills with commas.
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#005F4B" }}>
            {skills.length} skill{skills.length === 1 ? "" : "s"} added
          </span>
        </div>
      </div>

      {skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {skills.map((s) => (
            <span
              key={s}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 20,
                background: "#F0F9F6", border: "1px solid #A7F3D0",
                fontSize: 12, fontWeight: 500, color: "#005F4B",
              }}
            >
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}
              >
                <X size={11} color="#059669" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Experience Entry ─────────────────────────────────────────────────────────

function ExperienceEntry({
  exp, onChange, onRemove,
}: {
  exp: ResumeExperience; onChange: (e: ResumeExperience) => void; onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const set = (k: keyof ResumeExperience, v: unknown) => onChange({ ...exp, [k]: v });

  const updateBullet = (i: number, val: string) => {
    const b = [...exp.bullets];
    b[i] = val;
    set("bullets", b);
  };
  const addBullet = () => set("bullets", [...exp.bullets, ""]);
  const removeBullet = (i: number) => set("bullets", exp.bullets.filter((_, idx) => idx !== i));

  return (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: "#F9FAFB", cursor: "pointer",
          borderBottom: expanded ? "1px solid #E5E7EB" : "none",
        }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
            {exp.title || "New Position"}{exp.company ? ` @ ${exp.company}` : ""}
          </p>
          <p style={{ fontSize: 11.5, color: "#6B7280", margin: "2px 0 0" }}>
            {exp.from || "Start"} – {exp.current ? "Present" : (exp.to || "End")}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <GhostButton onClick={(e?: React.MouseEvent) => { e?.stopPropagation(); onRemove(); }} danger>
            <Trash2 size={13} />
          </GhostButton>
          {expanded ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <FieldLabel>Job Title</FieldLabel>
              <StyledInput value={exp.title} onChange={(v) => set("title", v)} placeholder="Software Engineer" />
            </div>
            <div>
              <FieldLabel>Company</FieldLabel>
              <StyledInput value={exp.company} onChange={(v) => set("company", v)} placeholder="Google" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
            <div>
              <FieldLabel>From</FieldLabel>
              <StyledInput value={exp.from} onChange={(v) => set("from", v)} placeholder="Jun 2022" />
            </div>
            <div>
              <FieldLabel>To</FieldLabel>
              <StyledInput value={exp.to} onChange={(v) => set("to", v)} placeholder="Present" disabled={exp.current} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", paddingBottom: 8 }}>
              <input
                type="checkbox"
                checked={exp.current}
                onChange={(e) => set("current", e.target.checked)}
                style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#005F4B" }}
              />
              <span style={{ color: "#374151", fontWeight: 500 }}>Current Role</span>
            </label>
          </div>
          <div>
            <FieldLabel hint="Use bullet points to describe your responsibilities and achievements">Highlights</FieldLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {exp.bullets.map((b, i) => (
                <div key={i} style={{ display: "flex", gap: 6 }}>
                  <span style={{ marginTop: 10, color: "#9CA3AF", fontSize: 14, flexShrink: 0 }}>•</span>
                  <input
                    value={b}
                    onChange={(e) => updateBullet(i, e.target.value)}
                    placeholder={`Achievement or responsibility ${i + 1}…`}
                    style={{
                      flex: 1, height: 36, padding: "0 10px",
                      border: "1px solid #E5E7EB", borderRadius: 6,
                      fontSize: 13, color: "#111827", outline: "none",
                    }}
                  />
                  <GhostButton onClick={() => removeBullet(i)} danger><Trash2 size={12} /></GhostButton>
                </div>
              ))}
              <GhostButton onClick={addBullet}>
                <Plus size={13} /> Add bullet
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Education Entry ──────────────────────────────────────────────────────────

function EducationEntry({
  edu, onChange, onRemove,
}: {
  edu: ResumeEducation; onChange: (e: ResumeEducation) => void; onRemove: () => void;
}) {
  const set = (k: keyof ResumeEducation, v: unknown) => onChange({ ...edu, [k]: v });
  return (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <GhostButton onClick={onRemove} danger><Trash2 size={13} /> Remove</GhostButton>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <FieldLabel>School / University</FieldLabel>
          <StyledInput value={edu.school} onChange={(v) => set("school", v)} placeholder="MIT" />
        </div>
        <div>
          <FieldLabel>Degree</FieldLabel>
          <StyledInput value={edu.degree} onChange={(v) => set("degree", v)} placeholder="B.Tech / B.S. / M.S." />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <FieldLabel>Field of Study</FieldLabel>
          <StyledInput value={edu.field} onChange={(v) => set("field", v)} placeholder="Computer Science" />
        </div>
        <div>
          <FieldLabel>GPA / Percentage</FieldLabel>
          <StyledInput value={edu.gpa || ""} onChange={(v) => set("gpa", v)} placeholder="3.8/4.0 or 85%" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
        <div>
          <FieldLabel>From</FieldLabel>
          <StyledInput value={edu.from} onChange={(v) => set("from", v)} placeholder="2020" />
        </div>
        <div>
          <FieldLabel>To</FieldLabel>
          <StyledInput value={edu.to} onChange={(v) => set("to", v)} placeholder="2024" disabled={!!edu.current} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", paddingBottom: 8 }}>
          <input
            type="checkbox"
            checked={!!edu.current}
            onChange={(e) => set("current", e.target.checked)}
            style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#005F4B" }}
          />
          <span style={{ color: "#374151", fontWeight: 500 }}>Currently Pursuing</span>
        </label>
      </div>
    </div>
  );
}

// ─── Project Entry ────────────────────────────────────────────────────────────

function ProjectEntry({
  proj, onChange, onRemove,
}: {
  proj: ResumeProject; onChange: (p: ResumeProject) => void; onRemove: () => void;
}) {
  const set = (k: keyof ResumeProject, v: unknown) => onChange({ ...proj, [k]: v });
  
  const bullets = proj.bullets || [];

  const updateBullet = (i: number, val: string) => {
    const b = [...bullets];
    b[i] = val;
    set("bullets", b);
  };
  const addBullet = () => set("bullets", [...bullets, ""]);
  const removeBullet = (i: number) => set("bullets", bullets.filter((_, idx) => idx !== i));

  return (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <GhostButton onClick={onRemove} danger><Trash2 size={13} /> Remove</GhostButton>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <FieldLabel>Project Name</FieldLabel>
          <StyledInput value={proj.name} onChange={(v) => set("name", v)} placeholder="TrackHire" />
        </div>
        <div>
          <FieldLabel>URL / GitHub Link</FieldLabel>
          <StyledInput value={proj.url} onChange={(v) => set("url", v)} placeholder="https://github.com/..." icon={Globe} />
        </div>
      </div>
      <div>
        <FieldLabel>Description</FieldLabel>
        <textarea
          value={proj.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Brief overview of the project's purpose…"
          rows={2}
          style={{
            width: "100%", padding: "8px 12px",
            border: "1px solid #D1D5DB", borderRadius: 8,
            fontSize: 13, color: "#111827", resize: "vertical",
            outline: "none", fontFamily: "Inter, sans-serif", lineHeight: 1.5,
            boxSizing: "border-box",
          }}
        />
      </div>
      <div>
        <FieldLabel hint="Use bullet points to describe project highlights, achievements, and technical contributions">Project Highlights</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <span style={{ marginTop: 10, color: "#9CA3AF", fontSize: 14, flexShrink: 0 }}>•</span>
              <input
                value={b}
                onChange={(e) => updateBullet(i, e.target.value)}
                placeholder={`Key contribution or feature ${i + 1}…`}
                style={{
                  flex: 1, height: 36, padding: "0 10px",
                  border: "1px solid #E5E7EB", borderRadius: 6,
                  fontSize: 13, color: "#111827", outline: "none",
                }}
              />
              <GhostButton onClick={() => removeBullet(i)} danger><Trash2 size={12} /></GhostButton>
            </div>
          ))}
          <GhostButton onClick={addBullet}>
            <Plus size={13} /> Add bullet
          </GhostButton>
        </div>
      </div>
    </div>
  );
}

// ─── Resume Preview Modal ─────────────────────────────────────────────────────

function ResumePreviewModal({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680,
          maxHeight: "85vh", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Resume Preview</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}>
            <X size={20} color="#6B7280" />
          </button>
        </div>
        <pre style={{
          flex: 1, overflow: "auto", padding: "20px 24px",
          fontSize: 13, lineHeight: 1.7, color: "#374151",
          fontFamily: "ui-monospace, 'Cascadia Code', Consolas, monospace",
          whiteSpace: "pre-wrap", margin: 0, background: "#F9FAFB",
          borderRadius: "0 0 16px 16px",
        }}>
          {text}
        </pre>
      </div>
    </div>
  );
}

// ─── Completeness Ring ────────────────────────────────────────────────────────

function CompletenessRing({ pct }: { pct: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  const color = pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#E5E7EB";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={52} height={52} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={26} cy={26} r={r} fill="none" stroke="#F3F4F6" strokeWidth={5} />
        <circle
          cx={26} cy={26} r={r}
          fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x={26} y={26}
          textAnchor="middle" dominantBaseline="central"
          fontSize={11} fontWeight={700} fill={pct >= 80 ? "#059669" : pct >= 50 ? "#D97706" : "#9CA3AF"}
          style={{ transform: "rotate(90deg)", transformOrigin: "26px 26px" }}
        >
          {pct}%
        </text>
      </svg>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
          {pct >= 80 ? "Great resume!" : pct >= 50 ? "Coming along" : "Just getting started"}
        </p>
        <p style={{ fontSize: 11.5, color: "#9CA3AF", margin: 0 }}>
          {pct >= 100 ? "All sections complete" : `Fill more sections to improve match scores`}
        </p>
      </div>
    </div>
  );
}

// ─── Resume Builder ───────────────────────────────────────────────────────────

const RESUME_TABS = [
  { key: "summary", label: "Summary", icon: FileText },
  { key: "skills", label: "Skills", icon: Sparkles },
  { key: "experience", label: "Experience", icon: Briefcase },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "projects", label: "Projects", icon: Code2 },
  { key: "certifications", label: "Certs", icon: Award },
] as const;

type ResumeTab = typeof RESUME_TABS[number]["key"];

function ResumeBuilder({
  data, onChange,
}: {
  data: ResumeData;
  onChange: (d: ResumeData) => void;
}) {
  const [activeTab, setActiveTab] = useState<ResumeTab>("summary");
  const set = <K extends keyof ResumeData>(k: K, v: ResumeData[K]) => onChange({ ...data, [k]: v });

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #F3F4F6", marginBottom: 20 }}>
        {RESUME_TABS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 12px",
                fontSize: 12.5, fontWeight: active ? 600 : 400,
                color: active ? "#005F4B" : "#6B7280",
                background: "none", border: "none",
                borderBottom: `2px solid ${active ? "#005F4B" : "transparent"}`,
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "color 0.12s, border-color 0.12s",
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}

      {activeTab === "summary" && (
        <div>
          <FieldLabel hint="2–4 sentences about who you are, your specialization, and career goals">Professional Summary</FieldLabel>
          <textarea
            value={data.summary}
            onChange={(e) => set("summary", e.target.value)}
            placeholder="Experienced full-stack engineer with 3+ years building scalable SaaS products…"
            rows={5}
            style={{
              width: "100%", padding: "12px",
              border: "1px solid #D1D5DB", borderRadius: 8,
              fontSize: 13, color: "#111827", resize: "vertical",
              outline: "none", fontFamily: "Inter, sans-serif", lineHeight: 1.6,
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {activeTab === "skills" && (
        <div>
          <FieldLabel hint="Add your technical and soft skills — these are directly used in AI match scoring">Skills</FieldLabel>
          <SkillsInput skills={data.skills} onChange={(s) => set("skills", s)} />
        </div>
      )}

      {activeTab === "experience" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.experience.map((exp, i) => (
            <ExperienceEntry
              key={exp.id}
              exp={exp}
              onChange={(updated) => {
                const arr = [...data.experience];
                arr[i] = updated;
                set("experience", arr);
              }}
              onRemove={() => set("experience", data.experience.filter((_, idx) => idx !== i))}
            />
          ))}
          <button
            onClick={() => set("experience", [...data.experience, {
              id: newId(), company: "", title: "", from: "", to: "", current: false, bullets: [""],
            }])}
            style={{
              height: 40, border: "2px dashed #D1D5DB", borderRadius: 10,
              background: "#F9FAFB", color: "#6B7280", fontSize: 13, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#005F4B"; e.currentTarget.style.color = "#005F4B"; e.currentTarget.style.background = "#F0F9F6"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.background = "#F9FAFB"; }}
          >
            <Plus size={15} /> Add Experience
          </button>
        </div>
      )}

      {activeTab === "education" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.education.map((edu, i) => (
            <EducationEntry
              key={edu.id}
              edu={edu}
              onChange={(updated) => {
                const arr = [...data.education];
                arr[i] = updated;
                set("education", arr);
              }}
              onRemove={() => set("education", data.education.filter((_, idx) => idx !== i))}
            />
          ))}
          <button
            onClick={() => set("education", [...data.education, { id: newId(), school: "", degree: "", field: "", from: "", to: "", gpa: "", current: false }])}
            style={{
              height: 40, border: "2px dashed #D1D5DB", borderRadius: 10,
              background: "#F9FAFB", color: "#6B7280", fontSize: 13, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#005F4B"; e.currentTarget.style.color = "#005F4B"; e.currentTarget.style.background = "#F0F9F6"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.background = "#F9FAFB"; }}
          >
            <Plus size={15} /> Add Education
          </button>
        </div>
      )}

      {activeTab === "projects" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.projects.map((proj, i) => (
            <ProjectEntry
              key={proj.id}
              proj={proj}
              onChange={(updated) => {
                const arr = [...data.projects];
                arr[i] = updated;
                set("projects", arr);
              }}
              onRemove={() => set("projects", data.projects.filter((_, idx) => idx !== i))}
            />
          ))}
          <button
            onClick={() => set("projects", [...data.projects, { id: newId(), name: "", url: "", description: "", bullets: [""] }])}
            style={{
              height: 40, border: "2px dashed #D1D5DB", borderRadius: 10,
              background: "#F9FAFB", color: "#6B7280", fontSize: 13, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#005F4B"; e.currentTarget.style.color = "#005F4B"; e.currentTarget.style.background = "#F0F9F6"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.background = "#F9FAFB"; }}
          >
            <Plus size={15} /> Add Project
          </button>
        </div>
      )}

      {activeTab === "certifications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel hint="List certifications like AWS, GCP, Scrum, Coursera, etc.">Certifications</FieldLabel>
          {data.certifications.map((cert, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <span style={{ marginTop: 9, color: "#9CA3AF", fontSize: 16, flexShrink: 0 }}>🏅</span>
              <input
                value={cert}
                onChange={(e) => {
                  const arr = [...data.certifications];
                  arr[i] = e.target.value;
                  set("certifications", arr);
                }}
                placeholder="AWS Solutions Architect – Associate"
                style={{ flex: 1, height: 36, padding: "0 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13, outline: "none" }}
              />
              <GhostButton onClick={() => set("certifications", data.certifications.filter((_, idx) => idx !== i))} danger>
                <Trash2 size={12} />
              </GhostButton>
            </div>
          ))}
          <GhostButton onClick={() => set("certifications", [...data.certifications, ""])}>
            <Plus size={13} /> Add Certification
          </GhostButton>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeData, setResumeData] = useState<ResumeData>(EMPTY_RESUME);

  const [previewText, setPreviewText] = useState<string | null>(null);
  const [coverFocused, setCoverFocused] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setName(data.name || "");
        setHeadline(data.headline || "");
        setLinkedinUrl(data.linkedinUrl || "");
        setGithubUrl(data.githubUrl || "");
        setPortfolioUrl(data.portfolioUrl || "");
        setCoverLetter(data.coverLetter || "");
        setResumeData((data.resumeData as ResumeData) || EMPTY_RESUME);
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, headline, linkedinUrl, githubUrl, portfolioUrl }),
      });
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResume = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData }),
      });
      toast.success("Resume saved & compiled for AI scoring!");
    } catch {
      toast.error("Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCoverLetter = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetter }),
      });
      toast.success("Cover letter saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    // Dynamically import to keep bundle small
    const { compileResumeData } = await import("@/lib/resume-compiler");
    const text = compileResumeData(resumeData);
    setPreviewText(text);
  };

  const initials = getInitials(profile?.name || profile?.email || "U");
  const completeness = calcResumeCompleteness(resumeData);

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <TopBar title="Profile" subtitle="Account" showGmailSync={false} showAddApplication={false} />
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
          <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
            {[100, 160, 340, 200].map((h, i) => (
              <div key={i} style={{ height: h, background: "#F3F4F6", borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#F7F7F4" }}>
      <TopBar title="Profile" subtitle="Account" showGmailSync={false} showAddApplication={false} />

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "stretch" }}>
            {/* ── Identity Card ──────────────────────────────────────────── */}
            <SectionCard style={{ flex: "1 1 340px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <SectionHeader icon={User} title="Personal Info" />

                {/* Avatar + name hero */}
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
                    background: profile?.image ? "transparent" : "linear-gradient(135deg, #005F4B, #0EA5E9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", border: "3px solid #E5E7EB",
                    boxShadow: "0 4px 12px rgba(0,95,75,0.2)",
                  }}>
                    {profile?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.image} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{initials}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.2 }}>
                      {profile?.name || "Your Name"}
                    </p>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>
                      {profile?.email}
                    </p>
                    {headline && (
                      <p style={{ fontSize: 12.5, color: "#005F4B", margin: "4px 0 0", fontWeight: 500 }}>
                        {headline}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <FieldLabel>Display Name</FieldLabel>
                    <StyledInput value={name} onChange={setName} placeholder="Your full name" />
                  </div>
                  <div>
                    <FieldLabel>Headline</FieldLabel>
                    <StyledInput value={headline} onChange={setHeadline} placeholder="Full-Stack Engineer @ Google" />
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, marginBottom: 0 }}>Shown on your profile card</p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <TealButton onClick={handleSaveProfile} loading={saving}>
                  <CheckCircle2 size={14} />
                  {saving ? "Saving…" : "Save Info"}
                </TealButton>
              </div>
            </SectionCard>

            {/* ── Links Card ────────────────────────────────────────────── */}
            <SectionCard style={{ flex: "1 1 340px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <SectionHeader icon={Globe} title="Links" />
                <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
                  Add your professional links. These help recruiters find you and are accessible from your applications.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <FieldLabel>LinkedIn</FieldLabel>
                    <StyledInput
                      value={linkedinUrl}
                      onChange={setLinkedinUrl}
                      placeholder="https://linkedin.com/in/username"
                      icon={ExternalLink}
                    />
                  </div>
                  <div>
                    <FieldLabel>GitHub</FieldLabel>
                    <StyledInput
                      value={githubUrl}
                      onChange={setGithubUrl}
                      placeholder="https://github.com/username"
                      icon={GitBranch}
                    />
                  </div>
                  <div>
                    <FieldLabel>Portfolio / Website</FieldLabel>
                    <StyledInput
                      value={portfolioUrl}
                      onChange={setPortfolioUrl}
                      placeholder="https://yourname.dev"
                      icon={Globe}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <TealButton onClick={handleSaveProfile} loading={saving}>
                  <CheckCircle2 size={14} />
                  {saving ? "Saving…" : "Save Links"}
                </TealButton>
              </div>
            </SectionCard>
          </div>

          {/* ── Resume Builder Card ───────────────────────────────────── */}
          <SectionCard>
            <SectionHeader
              icon={FileText}
              title="Resume Builder"
              badge={`${completeness}% complete`}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <CompletenessRing pct={completeness} />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handlePreview}
                  style={{
                    height: 36, padding: "0 14px", display: "flex", alignItems: "center", gap: 6,
                    border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff",
                    fontSize: 12.5, fontWeight: 500, color: "#374151", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#9CA3AF"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
                >
                  <Eye size={14} /> Preview
                </button>
                <TealButton onClick={handleSaveResume} loading={saving} size="sm">
                  <CheckCircle2 size={13} />
                  {saving ? "Saving…" : "Save & Update AI"}
                </TealButton>
              </div>
            </div>

            <div style={{ background: "#F0F9F6", border: "1px solid #A7F3D0", borderRadius: 8, padding: "10px 14px" }}>
              <p style={{ fontSize: 12, color: "#005F4B", margin: 0, lineHeight: 1.5 }}>
                ✦ <strong>AI-powered</strong>: Saving compiles your resume into a structured text that is fed directly to match scoring, interview prep questions, and other AI features.
              </p>
            </div>

            <ResumeBuilder data={resumeData} onChange={setResumeData} />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid #F3F4F6" }}>
              <button
                onClick={handlePreview}
                style={{
                  height: 36, padding: "0 14px", display: "flex", alignItems: "center", gap: 6,
                  border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff",
                  fontSize: 12.5, fontWeight: 500, color: "#374151", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                <Eye size={14} /> Preview Resume Text
              </button>
              <TealButton onClick={handleSaveResume} loading={saving}>
                <CheckCircle2 size={14} />
                {saving ? "Saving…" : "Save & Update AI"}
              </TealButton>
            </div>
          </SectionCard>

          {/* ── Cover Letter Card ─────────────────────────────────────── */}
          <SectionCard>
            <SectionHeader icon={FileText} title="Default Cover Letter" />
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.6 }}>
              Save a default cover letter template here. You can customize it per application in the application notes.
            </p>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Dear Hiring Manager,&#10;&#10;I am writing to express my strong interest in the [Role] position at [Company]…"
              rows={8}
              onFocus={() => setCoverFocused(true)}
              onBlur={() => setCoverFocused(false)}
              style={{
                width: "100%", padding: "12px",
                border: `1px solid ${coverFocused ? "#005F4B" : "#D1D5DB"}`,
                borderRadius: 8, fontSize: 13, color: "#111827",
                background: "#fff", outline: "none",
                boxSizing: "border-box", resize: "vertical",
                fontFamily: "Inter, sans-serif", lineHeight: 1.6,
                boxShadow: coverFocused ? "0 0 0 3px rgba(0,95,75,0.08)" : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>{coverLetter.length} characters</span>
              <TealButton onClick={handleSaveCoverLetter} loading={saving} size="sm">
                <CheckCircle2 size={13} />
                {saving ? "Saving…" : "Save Cover Letter"}
              </TealButton>
            </div>
          </SectionCard>

        </div>
      </div>

      {/* Resume preview modal */}
      {previewText !== null && (
        <ResumePreviewModal text={previewText} onClose={() => setPreviewText(null)} />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
      `}</style>
    </div>
  );
}
