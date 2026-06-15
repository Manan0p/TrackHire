import type { ResumeData } from "@/types";

/**
 * Converts structured resume data (from the Resume Builder) into
 * a clean, AI-readable plain-text resume string. This is stored in
 * User.resumeText and fed directly to the match scoring AI.
 */
export function compileResumeData(data: ResumeData): string {
  const parts: string[] = [];

  // Summary
  if (data.summary?.trim()) {
    parts.push("SUMMARY\n" + data.summary.trim());
  }

  // Skills
  if (data.skills?.length > 0) {
    parts.push("SKILLS\n" + data.skills.join(", "));
  }

  // Experience
  if (data.experience?.length > 0) {
    const expLines = ["EXPERIENCE"];
    for (const exp of data.experience) {
      const dateRange = exp.current
        ? `${exp.from} – Present`
        : `${exp.from} – ${exp.to}`;
      expLines.push(`\n${exp.title} | ${exp.company} (${dateRange})`);
      for (const bullet of exp.bullets) {
        if (bullet.trim()) expLines.push(`• ${bullet.trim()}`);
      }
    }
    parts.push(expLines.join("\n"));
  }

  // Education
  if (data.education?.length > 0) {
    const eduLines = ["EDUCATION"];
    for (const edu of data.education) {
      const degree = edu.field ? `${edu.degree} in ${edu.field}` : edu.degree;
      const dateRange = edu.current
        ? `${edu.from} – Present`
        : `${edu.from} – ${edu.to}`;
      const gpaStr = edu.gpa?.trim() ? ` (GPA: ${edu.gpa.trim()})` : "";
      eduLines.push(`${degree} | ${edu.school} (${dateRange})${gpaStr}`);
    }
    parts.push(eduLines.join("\n"));
  }

  // Projects
  if (data.projects?.length > 0) {
    const projLines = ["PROJECTS"];
    for (const proj of data.projects) {
      projLines.push(`\n${proj.name}${proj.url ? ` — ${proj.url}` : ""}`);
      if (proj.description?.trim()) {
        projLines.push(proj.description.trim());
      }
      const bullets = proj.bullets || [];
      for (const bullet of bullets) {
        if (bullet.trim()) projLines.push(`• ${bullet.trim()}`);
      }
    }
    parts.push(projLines.join("\n"));
  }

  // Certifications
  if (data.certifications?.length > 0) {
    const certs = data.certifications.filter((c) => c.trim());
    if (certs.length > 0) {
      parts.push("CERTIFICATIONS\n" + certs.map((c) => `• ${c}`).join("\n"));
    }
  }

  return parts.join("\n\n");
}

/**
 * Calculate how complete a resume is (0–100%).
 * Used for the completeness progress ring in the UI.
 */
export function calcResumeCompleteness(data: ResumeData): number {
  let filled = 0;
  const total = 6;
  if (data.summary?.trim()) filled++;
  if (data.skills?.length > 0) filled++;
  if (data.experience?.length > 0) filled++;
  if (data.education?.length > 0) filled++;
  if (data.projects?.length > 0) filled++;
  if (data.certifications?.filter((c) => c.trim()).length > 0) filled++;
  return Math.round((filled / total) * 100);
}
