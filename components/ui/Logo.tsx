import Image from "next/image";

/**
 * Movive brand logo.
 *
 * Renders one of the three official Movive lockups from /public/movive.
 * The variant encodes usage intent (see the brand rules below); callers size
 * the mark by passing a Tailwind height class (e.g. `h-8`) — width is always
 * `auto` so the intrinsic aspect ratio is preserved.
 *
 *   isologo   — full lockup (icon + wordmark). Use where the complete brand is
 *               shown: landing navbar, footer, auth screens, marketing pages.
 *   logotipo  — wordmark only. Use for large headers, empty states, welcome /
 *               splash / loading sections.
 *   isotipo   — icon only. Use for collapsed sidebar, favicon-like refs, small
 *               UI, mobile nav, avatar-like brand placeholders.
 */

export type LogoVariant = "isologo" | "logotipo" | "isotipo";

// Intrinsic aspect ratios (from each SVG's viewBox). Next/Image needs explicit
// width/height; we pass the natural ratio and let CSS (h-* + w-auto) scale it.
const SOURCES: Record<LogoVariant, { src: string; width: number; height: number }> = {
  isologo: { src: "/movive/isologo-movive.svg", width: 1002, height: 147 },
  logotipo: { src: "/movive/logotipo-movive.svg", width: 672, height: 116 },
  isotipo: { src: "/movive/isotipo-movive.svg", width: 305, height: 147 },
};

interface LogoProps {
  /** Which brand lockup to render. Defaults to the full isologo. */
  variant?: LogoVariant;
  /**
   * Tailwind height class(es) controlling the rendered size. Width is always
   * auto to preserve the aspect ratio. Defaults to `h-8`.
   */
  className?: string;
  /**
   * Accessible label. Defaults to "Movive". Pass "" to mark the image as
   * decorative when an adjacent text label already names the brand.
   */
  alt?: string;
  /** Hint the browser to prioritize loading (e.g. above-the-fold navbar). */
  priority?: boolean;
}

export default function Logo({
  variant = "isologo",
  className = "h-8",
  alt = "Movive",
  priority = false,
}: LogoProps) {
  const { src, width, height } = SOURCES[variant];
  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt}
      priority={priority}
      className={`w-auto ${className}`}
    />
  );
}
