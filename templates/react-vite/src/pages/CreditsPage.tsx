export function CreditsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Credits & Licenses</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">This Project</h2>
        <p className="text-muted-foreground">
          {/* TODO: Update with your license */}
          This project is licensed under the MIT License.
        </p>
      </section>

      {/* TODO: Add data source attribution if using external APIs */}
      {/*
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Data Sources</h2>
        <p className="text-muted-foreground">
          Attribution for external APIs goes here.
        </p>
      </section>
      */}

      <section>
        <h2 className="mb-3 text-xl font-semibold">About</h2>
        <p className="text-muted-foreground">
          {/* TODO: Add project description */}
          A brief description of your project.
        </p>
      </section>
    </div>
  );
}
