import Link from "next/link";
import { getLocaleCookie } from "@/lib/i18n/actions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import PublicLanguageSwitcher from "@/components/i18n/PublicLanguageSwitcher";

export default async function ForbiddenPage() {
  const locale = await getLocaleCookie();
  const dict = await getDictionary(locale);
  const t = dict.errors;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6">
      <div className="absolute right-4 top-4">
        <PublicLanguageSwitcher />
      </div>
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-10 w-10 text-red-500" aria-hidden="true">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="mb-2 text-3xl font-bold text-zinc-900">{t.forbiddenTitle}</h1>
      <p className="mb-6 text-center text-sm text-zinc-500 max-w-md">
        {t.forbiddenDescription}
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          {t.goToDashboard}
        </Link>
        <Link href="/" className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
          {t.home}
        </Link>
      </div>
    </div>
  );
}
