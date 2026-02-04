export function HomePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Welcome</h1>
      <p className="text-muted-foreground mb-6">
        This is a starter template with React, Vite, Tailwind CSS, and TypeScript.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <FeatureCard
          title="React 19"
          description="Latest React with hooks and concurrent features"
        />
        <FeatureCard title="Vite" description="Lightning-fast dev server and optimized builds" />
        <FeatureCard title="Tailwind CSS" description="Utility-first CSS with dark mode support" />
        <FeatureCard title="TypeScript" description="Type-safe development with path aliases" />
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-3">Getting Started</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>
            Update <code className="bg-muted px-1 rounded">package.json</code> with your app name
          </li>
          <li>
            Update the GitHub URL in <code className="bg-muted px-1 rounded">Layout.tsx</code>
          </li>
          <li>
            Customize colors in <code className="bg-muted px-1 rounded">index.css</code>
          </li>
          <li>Add your components and pages</li>
        </ol>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h3 className="font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
