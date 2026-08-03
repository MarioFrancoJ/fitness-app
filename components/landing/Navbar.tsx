export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <span className="text-lg font-semibold tracking-tight text-zinc-900">
          FitnessApp
        </span>

        {/* Nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            FAQ
          </a>
        </nav>

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 md:block"
          >
            Login
          </a>
          <a
            href="/register"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}
