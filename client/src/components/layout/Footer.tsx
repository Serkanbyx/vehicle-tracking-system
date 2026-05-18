export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white py-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-gray-500 sm:flex-row">
        <span>Vehicle Tracking System &copy; {year}</span>
        <div className="flex items-center gap-4">
          <a href="/docs" className="transition-colors hover:text-brand-600">
            Documentation
          </a>
        </div>
        <span>
          Created by{" "}
          <a
            href="https://serkanbayraktar.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Serkanby
          </a>
          {" | "}
          <a
            href="https://github.com/Serkanbyx"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Github
          </a>
        </span>
      </div>
    </footer>
  );
}
