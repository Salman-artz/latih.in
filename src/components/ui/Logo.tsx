"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface LogoProps {
  className?: string;
  height?: number;
  priority?: boolean;
}

export function Logo({ className = "", height = 32, priority = false }: LogoProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link href="/" className={`inline-flex items-center gap-1 group ${className}`}>
      {!imageError ? (
        <Image
          src="/brand/logo.png"
          alt="latih.in logo"
          width={Math.round(height * 3)}
          height={height}
          priority={priority}
          className="object-contain"
          style={{ height: `${height}px`, width: "auto" }}
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-heading font-extrabold text-2xl tracking-tight select-none">
          <span className="text-brand-navy">latih</span>
          <span className="text-brand-blue">.in</span>
        </span>
      )}
    </Link>
  );
}
