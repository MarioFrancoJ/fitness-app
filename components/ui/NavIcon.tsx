/**
 * NavIcon — renders a custom SVG from /public/icons as a CSS mask so it inherits
 * the current text color (currentColor) exactly like the previous inline icons.
 *
 * Why a mask instead of <img>: the uploaded SVGs use fixed black fills (no
 * currentColor). An <img> would always render black — invisible on the active
 * (dark) menu item. Masking uses the SVG only as a shape and paints it with
 * `background-color: currentColor`, so the icon turns grey when inactive and
 * white when active/hover, preserving the existing behavior with zero changes
 * to layout, spacing, states, or responsiveness.
 *
 * Different source viewBoxes don't matter: the mask is scaled to the box
 * (contain + center), so every icon aligns and sizes consistently.
 */

interface NavIconProps {
  /** File name inside /public/icons, e.g. "dashboard.svg". */
  name: string;
  /** Tailwind size classes. Defaults to the existing h-4 w-4. */
  className?: string;
}

export default function NavIcon({ name, className = "h-4 w-4" }: NavIconProps) {
  const url = `/icons/${name}`;
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        maskImage: `url(${url})`,
        WebkitMaskImage: `url(${url})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
