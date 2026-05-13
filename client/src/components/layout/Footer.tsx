export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-sm text-gray-500 sm:flex-row">
        <span>Vehicle Tracking System &copy; {year}</span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-600"
          >
            GitHub
          </a>
          <a
            href="/docs"
            className="hover:text-brand-600"
          >
            Dokümantasyon
          </a>
        </div>
      </div>
    </footer>
  );
}
