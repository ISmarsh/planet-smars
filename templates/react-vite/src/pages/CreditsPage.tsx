export function CreditsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Credits & Licenses</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">This Project</h2>
        <p className="text-muted-foreground">
          {/* TODO: Update with your license */}
          This project is licensed under the MIT License.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Dependencies</h2>
        <p className="text-muted-foreground mb-4">
          This project uses the following open-source libraries:
        </p>

        <div className="space-y-3">
          <LicenseItem name="React" license="MIT" url="https://github.com/facebook/react" />
          <LicenseItem name="Vite" license="MIT" url="https://github.com/vitejs/vite" />
          <LicenseItem
            name="Tailwind CSS"
            license="MIT"
            url="https://github.com/tailwindlabs/tailwindcss"
          />
          <LicenseItem
            name="React Router"
            license="MIT"
            url="https://github.com/remix-run/react-router"
          />
          <LicenseItem
            name="Lucide React"
            license="ISC"
            url="https://github.com/lucide-icons/lucide"
          />
          <LicenseItem name="Sonner" license="MIT" url="https://github.com/emilkowalski/sonner" />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Acknowledgments</h2>
        <p className="text-muted-foreground">
          {/* TODO: Add any acknowledgments */}
          Built with React, Vite, and Tailwind CSS.
        </p>
      </section>
    </div>
  );
}

function LicenseItem({ name, license, url }: { name: string; license: string; url: string }) {
  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
      <div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          {name}
        </a>
        <span className="text-muted-foreground ml-2 text-sm">({license})</span>
      </div>
    </div>
  );
}
