"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// This page redirects to the main exercises admin page since
// editing is now handled inline in the exercises table via the CRUD form.
// Kept for route compatibility.

export default function EditExercisePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    // Redirect to the exercises admin page where editing is done inline
    router.replace("/admin/exercises");
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        <p className="text-sm text-zinc-400">Redirecting to exercises...</p>
      </div>
    </div>
  );
}
