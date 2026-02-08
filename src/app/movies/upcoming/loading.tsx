export default function Loading() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-10 w-48 bg-zinc-800 rounded animate-pulse mb-2" />
                        <div className="h-5 w-64 bg-zinc-800 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-24 bg-zinc-800 rounded animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
                            <div className="aspect-2/3 relative bg-zinc-800 animate-pulse">
                                <div className="absolute inset-0 bg-linear-to-t from-zinc-700 to-transparent" />
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="h-6 bg-zinc-800 rounded animate-pulse" />
                                <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
