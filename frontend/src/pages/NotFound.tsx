import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-6">Page not found</p>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        Return Home
      </Link>
    </div>
  );
}
