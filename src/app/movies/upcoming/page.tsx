/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_url: string | null;
  release_date: string;
  genres: string[];
};

type MovieResponse = {
  results: Movie[];
};

async function getUpcoming(): Promise<Movie[]> {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const baseUrl = host ? `${protocol}://${host}` : "";

  const response = await fetch(`${baseUrl}/api/movies/upcoming`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch upcoming movies");
  }

  const data = (await response.json()) as MovieResponse;
  return data.results;
}

export default async function UpcomingPage() {
  const movies = await getUpcoming();

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Coming Soon
            </h1>
            <p className="text-muted-foreground">
              Get ready for these upcoming releases
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-colors"
            >
              <div className="aspect-2/3 relative">
                <img
                  src={
                    movie.poster_url ??
                    "https://placehold.co/500x750?text=No+Image"
                  }
                  alt={movie.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <div className="text-center font-bold text-lg mb-2 text-primary">
                    Releasing{" "}
                    {new Date(movie.release_date).toLocaleDateString()}
                  </div>
                  <Button variant="secondary" className="w-full">
                    Remind Me
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-lg leading-tight truncate">
                    {movie.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{movie.genres.join(", ")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
