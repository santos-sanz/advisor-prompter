export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="rounded-lg bg-card p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold">Page Not Found</h1>
        <p className="mb-6">The page you are looking for doesn't exist or has been moved.</p>
        <a 
          href="/" 
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
