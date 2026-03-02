import MovieSearch from "./components/MovieSearch";
import MovieTabs from "./components/MovieTabs";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function MoviesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Movies</h1>
            <p className="text-muted-foreground">
              Search and browse your favorite films
            </p>
          </div>
        </div>

        <section className="space-y-6">
          <MovieSearch />
        </section>

        <section className="space-y-6">
          <MovieTabs />
        </section>
      </div>
    </div>
  );
}
