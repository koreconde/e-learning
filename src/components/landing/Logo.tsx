import { cn } from "@/lib/utils";
import logoFull from "@/assets/escape-campus-logo.png";

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
  if (withText) {
    return (
      <img
        src={logoFull}
        alt="Escape Campus"
        className={cn("h-9 w-auto select-none", variant === "light" && "brightness-0 invert", className)}
        draggable={false}
      />
    );
  }
  // Icon-only: clip just the shield from the lockup using object-position
  return (
    <div
      className={cn("h-10 w-10 overflow-hidden", className)}
      aria-label="Escape Campus"
      role="img"
    >
      <img
        src={logoFull}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={cn(
          "h-full w-auto max-w-none object-cover object-left",
          variant === "light" && "brightness-0 invert",
        )}
        style={{ width: "auto", aspectRatio: "auto" }}
      />
    </div>
  );
};