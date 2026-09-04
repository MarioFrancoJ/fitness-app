import type { MetadataRoute } from "next";

// PWA / web app manifest for Movive. Served at /manifest.webmanifest.
// Icons use the Movive isotipo (icon-only mark); theme color is the Movive
// primary brand green (movive-800 #075c45).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Movive — Transform Your Fitness Journey",
    short_name: "Movive",
    description:
      "Personalized workouts, nutrition plans and progress tracking in one modern platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#075c45",
    icons: [
      {
        src: "/movive/isotipo-movive.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/movive/isotipo-movive.png",
        sizes: "305x147",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
