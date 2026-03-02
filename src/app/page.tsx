import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">
            <span className="text-primary">Cine</span>mate
          </div>
          <div />
        </div>
      </nav>

      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="z-10 max-w-4xl space-y-8 animate-in fade-in zoom-in duration-700">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
          Midnight <span className="text-primary">Cinema</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          Experience movies like never before. Premium seating, real-time
          availability, and a cinematic booking journey.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button
            asChild
            size="lg"
            className="text-lg px-8 h-12 rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_30px_-5px_var(--primary)] text-white"
          >
            <Link href="/movies">Book Now</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-lg px-8 h-12 rounded-full border-white/10 hover:bg-white/5 backdrop-blur-sm"
          >
            <Link href="/movies/upcoming">Coming Soon</Link>
          </Button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center gap-8 opacity-30">
        <div className="text-sm font-mono tracking-widest text-[#E50914]">
          NOW SHOWING
        </div>
        <div className="text-sm font-mono tracking-widest text-[#3B82F6]">
          IMAX 3D
        </div>
        <div className="text-sm font-mono tracking-widest text-[#22C55E]">
          DOLBY ATMOS
        </div>
      </div>
    </main>
  );
}
