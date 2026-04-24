import { cn } from "@/lib/utils";
import logoFull from "@/assets/escape-campus-logo.png";
import logoShield from "@/assets/escape-campus-shield.png";

interface LogoProps {
  className?: string;
  withText?: boolean;
  variant?: "dark" | "light";
}

/**
 * Escape Campus logo. Uses the official lockup when withText is true.
 * For icon-only contexts, renders the shield mark cropped from the same lockup.
 */
export const Logo = ({ className, withText = true, variant = "dark" }: LogoProps) => {
  const src = withText ? logoFull : logoShield;
  return (
    <img
      src={src}
      alt="Escape Campus"
      draggable={false}
      className={cn(
        withText ? "h-8 w-auto md:h-9" : "h-10 w-10",
        "select-none",
        variant === "light" && "brightness-0 invert",
        className,
      )}
    />
  );
};