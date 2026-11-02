import { cn } from "@/lib/utils";

/** Chottu's face. A drawn placeholder until there is a real mascot asset. */
export function ChottuAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-10", className)}>
      <defs>
        <radialGradient id="chottu-avatar-fill" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff4e6" />
          <stop offset="100%" stopColor="#f2c99a" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#chottu-avatar-fill)" />
      <circle cx="15" cy="19" r="1.8" fill="#3b2a1a" />
      <circle cx="25" cy="19" r="1.8" fill="#3b2a1a" />
      <circle cx="12.5" cy="23.5" r="2.2" fill="#f4a3a3" opacity="0.55" />
      <circle cx="27.5" cy="23.5" r="2.2" fill="#f4a3a3" opacity="0.55" />
      <path d="M17.5 24.5q2.5 2.2 5 0" stroke="#3b2a1a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
