import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  withText?: boolean;
  variant?: "dark" | "light";
}

export const Logo = ({ className, withText = true, variant = "dark" }: LogoProps) => {
  const stroke = variant === "dark" ? "currentColor" : "currentColor";
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 40 48"
        className="h-9 w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M2 4h36v22c0 10-8 18-18 18S2 36 2 26V4z"
          stroke={stroke}
          strokeWidth="2.5"
          fill="none"
        />
        <text
          x="20"
          y="28"
          textAnchor="middle"
          fontSize="20"
          fontWeight="800"
          fontFamily="Inter, sans-serif"
          fill={stroke}
        >
          E
        </text>
      </svg>
      {withText && (
        <span className="font-display text-base font-bold tracking-tight">
          Escape Campus
        </span>
      )}
    </div>
  );
};