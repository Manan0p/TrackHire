"use client";

import Image from "next/image";
import { useState } from "react";
import { getInitials, generateColor } from "@/lib/utils";

interface CompanyLogoProps {
  company: string;
  size?: number;
  className?: string;
}

export function CompanyLogo({ company, size = 32, className }: CompanyLogoProps) {
  const [error, setError] = useState(false);
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/inc|llc|ltd|corp/g, "") + ".com";
  const logoUrl = `https://logo.clearbit.com/${domain}`;
  const initials = getInitials(company);
  const bgColor = generateColor(company);

  if (error) {
    return (
      <div
        className={`company-logo-fallback ${className}`}
        style={{ backgroundColor: bgColor, width: size, height: size }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${company} logo`}
      width={size}
      height={size}
      className={`company-logo ${className}`}
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
}
