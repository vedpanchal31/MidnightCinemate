/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
    Map,
    MapMarker,
    MapRoute,
    MapControls,
    MarkerContent,
    MarkerPopup,
    MarkerTooltip,
    useMap
} from "@/components/ui/map";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
    Check,
    ChevronsUpDown,
    Navigation,
    Clock,
    Search,
    Crosshair,
} from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";



/**
 * Helper to estimate travel time
 */
function estimateTime(distKm: number, speedKmh: number) {
    const totalMinutes = (distKm / speedKmh) * 60;
    if (totalMinutes < 60) return `${Math.round(totalMinutes)} min`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
}

// OSRM Route type
type OSRMRoute = {
    geometry: [number, number][];
    distance: number; // in meters
    duration: number; // in seconds
};

// Theater type from Overpass API
type Theater = {
    id: string;
    name: string;
    coordinates: [number, number];
    description?: string;
};

// Route Point type
type RoutePoint = {
    id: string;
    type: "theater" | "custom" | "origin";
    name: string;
    coordinates: [number, number];
};

const locations = {
    nyc: [-73.9882, 40.7563] as [number, number],
};

function MapEventHandler({
    onBoundsChange,
    onMapClick
}: {
    onBoundsChange: (bounds: [number, number, number, number]) => void;
    onMapClick: (coords: [number, number]) => void;
}) {
    const { map, isLoaded } = useMap();

    useEffect(() => {
        if (!map || !isLoaded) return;

        const handleBoundsChange = () => {
            const bounds = map.getBounds();
            onBoundsChange([
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getNorth()
            ]);
        };

        const handleMapClick = (e: any) => {
            // Only trigger if we clicked the map itself, not a marker/popup
            if (e.target === map) {
                onMapClick([e.lngLat.lng, e.lngLat.lat]);
            }
        };

        // Initial load
        handleBoundsChange();

        map.on("moveend", handleBoundsChange);
        map.on("click", handleMapClick);
        return () => {
            map.off("moveend", handleBoundsChange);
            map.off("click", handleMapClick);
        };
    }, [map, isLoaded, onBoundsChange, onMapClick]);

    return null;
}

export default function MapDemoPage() {
    const [activeTab, setActiveTab] = useState("all");
    const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
    const [theaters, setTheaters] = useState<Theater[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "error" | "success">("idle");
    const [includeUserLocation, setIncludeUserLocation] = useState(false);
    const [routes, setRoutes] = useState<OSRMRoute[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [isRoutingLoading, setIsRoutingLoading] = useState(false);

    const mapRef = useRef<any>(null);

    const fetchTheaters = async (bounds: [number, number, number, number]) => {
        setIsLoading(true);
        try {
            const [west, south, east, north] = bounds;
            const query = `[out:json][timeout:25];
                node["amenity"="cinema"](${south},${west},${north},${east});
                out body;`;
            const response = await fetch("https://overpass-api.de/api/interpreter", {
                method: "POST",
                body: query
            });
            const data = await response.json();

            const fetchedTheaters: Theater[] = data.elements.map((el: any) => ({
                id: el.id.toString(),
                name: el.tags.name || "Unnamed Cinema",
                coordinates: [el.lon, el.lat],
                description: el.tags.operator || "Independent Theater"
            }));

            setTheaters(fetchedTheaters);
        } catch (error) {
            console.error("Error fetching theaters:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocateUser = () => {
        if (!navigator.geolocation) {
            setLocationStatus("error");
            return;
        }
        setLocationStatus("locating");
        navigator.geolocation.getCurrentPosition((pos) => {
            const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
            setUserLocation(coords);
            setLocationStatus("success");
            mapRef.current?.flyTo({ center: coords, zoom: 14 });
        }, (err) => {
            console.error("Geolocation error:", err);
            setLocationStatus("error");
        });
    };

    const addTheaterToRoute = (theater: Theater) => {
        setRoutePoints(prev => {
            if (prev.some(p => p.id === theater.id)) return prev;
            return [...prev, {
                id: theater.id,
                type: "theater",
                name: theater.name,
                coordinates: theater.coordinates
            }];
        });
    };

    const addCustomWaypoint = (coords: [number, number]) => {
        const newPoint: RoutePoint = {
            id: `custom-${Date.now()}`,
            type: "custom",
            name: `Waypoint ${routePoints.length + 1}`,
            coordinates: coords
        };
        setRoutePoints(prev => [...prev, newPoint]);
    };

    const removePoint = (id: string) => {
        setRoutePoints(prev => prev.filter(p => p.id !== id));
    };

    const clearSelection = () => {
        setRoutePoints([]);
        setRoutes([]);
        setIncludeUserLocation(false);
    };

    const selectedCoordinates = useMemo(() => {
        const baseCoords = routePoints.map(p => p.coordinates);
        if (userLocation && includeUserLocation && routePoints.length > 0) {
            return [userLocation, ...baseCoords];
        }
        return baseCoords;
    }, [routePoints, userLocation, includeUserLocation]);

    useEffect(() => {
        // Clear routes immediately when inputs change to avoid showing stale data
        setRoutes([]);
        setSelectedRouteIndex(0);

        if (selectedCoordinates.length < 2) {
            return;
        }

        const fetchOSRMRoute = async () => {
            setIsRoutingLoading(true);
            try {
                const coordsString = selectedCoordinates.map(c => `${c[0]},${c[1]}`).join(';');
                const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&alternatives=true`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.code === 'Ok') {
                    const fetchedRoutes: OSRMRoute[] = data.routes.map((r: any) => ({
                        geometry: r.geometry.coordinates,
                        distance: r.distance,
                        duration: r.duration
                    }));
                    setRoutes(fetchedRoutes);
                    setSelectedRouteIndex(0);
                }
            } catch (error) {
                console.error("OSRM Routing error:", error);
            } finally {
                setIsRoutingLoading(false);
            }
        };

        fetchOSRMRoute();
    }, [selectedCoordinates]);

    // Calculate route analytics using OSRM data if available
    const routeAnalytics = useMemo(() => {
        if (routes.length === 0) return null;

        // Clamp index to current route count
        const safeIndex = Math.min(selectedRouteIndex, routes.length - 1);
        const activeRoute = routes[safeIndex];

        if (!activeRoute) return null;

        const distanceKm = (activeRoute.distance / 1000).toFixed(1);

        return {
            distance: distanceKm,
            timeDriving: estimateTime(activeRoute.distance / 1000, 30),
            realDuration: Math.round(activeRoute.duration / 60) + " min"
        };
    }, [routes, selectedRouteIndex]);

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Cinemate Map</h1>
                    <p className="text-muted-foreground">Find theaters and plan your movie night route.</p>
                </div>

                <div className="flex flex-wrap gap-4 items-center bg-card/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleLocateUser}
                            variant="secondary"
                            className="flex items-center gap-2 group hover:ring-2 hover:ring-primary/20 transition-all"
                            disabled={locationStatus === "locating"}
                        >
                            <Crosshair className={cn("size-4 transition-transform duration-500", locationStatus === "locating" && "animate-spin")} />
                            {locationStatus === "locating" ? "Locating..." : "Use My Location"}
                        </Button>

                        {locationStatus === "success" && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1 animate-in fade-in zoom-in-95">
                                <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Location Active
                            </Badge>
                        )}
                        {locationStatus === "error" && (
                            <Badge variant="destructive" className="gap-1">
                                Permission Denied
                            </Badge>
                        )}
                    </div>

                    {userLocation && (
                        <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">Origin</span>
                            <div className="flex items-center gap-1.5">
                                <label htmlFor="include-location" className="text-[11px] font-medium cursor-pointer">Start from me</label>
                                <input
                                    id="include-location"
                                    type="checkbox"
                                    checked={includeUserLocation}
                                    onChange={(e) => setIncludeUserLocation(e.target.checked)}
                                    className="accent-blue-500 size-3.5 cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-[300px] justify-between border-white/10 bg-background/50 backdrop-blur-md"
                            >
                                <div className="flex items-center gap-2">
                                    <Search className="size-4 text-muted-foreground" />
                                    {routePoints.length > 0
                                        ? `${routePoints.length} points selected`
                                        : "Search theaters..."}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl">
                            <Command className="bg-transparent">
                                <CommandInput placeholder="Search local theaters..." className="border-none focus:ring-0" />
                                <CommandList>
                                    <CommandEmpty>No theaters found in this area.</CommandEmpty>
                                    <CommandGroup heading="Theaters Near You">
                                        {theaters.map((theater) => (
                                            <CommandItem
                                                key={theater.id}
                                                onSelect={() => {
                                                    addTheaterToRoute(theater);
                                                    setOpen(false);
                                                    mapRef.current?.flyTo({ center: theater.coordinates, zoom: 15 });
                                                }}
                                                className="hover:bg-primary/20 cursor-pointer transition-colors"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        routePoints.some(p => p.id === theater.id) ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{theater.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{theater.description}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <div className="flex-1" />

                    {routePoints.length > 0 && (
                        <div className="flex items-center gap-6 px-4 py-2 bg-primary/5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-2">
                                <Navigation className="size-4 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Distance</span>
                                    <span className="text-sm font-bold text-white">{routeAnalytics?.distance || "0"} km</span>
                                </div>
                            </div>
                            <Separator orientation="vertical" className="h-8 bg-white/10" />
                            <div className="flex items-center gap-2">
                                <Clock className="size-4 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Est. Time</span>
                                    <span className="text-sm font-bold text-white">{routeAnalytics?.realDuration || "0 min"}</span>
                                </div>
                            </div>
                            {routes.length > 1 && (
                                <>
                                    <Separator orientation="vertical" className="h-8 bg-white/10" />
                                    <div className="flex gap-2">
                                        {routes.map((_, i) => (
                                            <Button
                                                key={`route-btn-${i}`}
                                                variant={i === selectedRouteIndex ? "secondary" : "ghost"}
                                                size="sm"
                                                className={cn(
                                                    "h-7 text-[10px] px-2",
                                                    i === selectedRouteIndex ? "bg-primary/20 text-primary border-primary/30" : "text-muted-foreground hover:text-white"
                                                )}
                                                onClick={() => setSelectedRouteIndex(i)}
                                            >
                                                Route {i + 1}
                                            </Button>
                                        ))}
                                    </div>
                                </>
                            )}
                            <Separator orientation="vertical" className="h-8 bg-white/10" />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={clearSelection}
                            >
                                Clear All
                            </Button>
                        </div>
                    )}
                </div>

                <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                        <TabsTrigger value="all">Overview</TabsTrigger>
                        <TabsTrigger value="markers">Markers</TabsTrigger>
                        <TabsTrigger value="routes">Routes</TabsTrigger>
                        <TabsTrigger value="clusters">Clusters</TabsTrigger>
                    </TabsList>

                    <Card className="mt-6 border-2 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                            <div>
                                <CardTitle>Interactive Map</CardTitle>
                                <CardDescription>
                                    Panning the map will fetch real-time theaters from OpenStreetMap.
                                </CardDescription>
                            </div>
                            <div className="flex gap-3 items-center">
                                {isRoutingLoading && (
                                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse uppercase text-[10px] font-bold">
                                        Calculating Road Route...
                                    </Badge>
                                )}
                                {isLoading && (
                                    <Badge variant="outline" className="animate-pulse bg-primary/10 border-primary/20 text-primary uppercase text-[10px] tracking-widest font-bold">
                                        Updating Theaters...
                                    </Badge>
                                )}
                                {routePoints.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs font-semibold px-4 border-primary/40 hover:bg-primary/10 transition-all hover:scale-105"
                                        onClick={clearSelection}
                                    >
                                        Reset Route ({routePoints.length} points)
                                    </Button>
                                )}
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hidden sm:flex">
                                    Real-time OSM Data
                                </Badge>
                                <Badge variant="secondary">Tailwind CSS</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative h-[600px] w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                                <Map
                                    ref={mapRef}
                                    center={locations.nyc}
                                    zoom={14}
                                    styles={{
                                        light: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
                                        dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
                                    }}
                                >
                                    <MapEventHandler
                                        onBoundsChange={fetchTheaters}
                                        onMapClick={addCustomWaypoint}
                                    />
                                    <MapControls
                                        showCompass
                                        showLocate
                                        showFullscreen
                                        position="top-right"
                                        onLocate={(coords) => {
                                            setUserLocation([coords.longitude, coords.latitude]);
                                            setLocationStatus("success");
                                        }}
                                    />

                                    {/* User Location Marker (Pulse Dot) */}
                                    {userLocation && (
                                        <MapMarker
                                            longitude={userLocation[0]}
                                            latitude={userLocation[1]}
                                        >
                                            <MarkerContent>
                                                <div className="size-8 flex items-center justify-center relative z-[120]">
                                                    <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25" />
                                                    <div className="size-4 bg-blue-600 rounded-full border-2 border-white shadow-lg relative z-10" />
                                                </div>
                                            </MarkerContent>
                                            <MarkerTooltip>Your current position</MarkerTooltip>
                                        </MapMarker>
                                    )}

                                    {/* Persistent Route Markers */}
                                    {routePoints.map((point, index) => (
                                        <MapMarker
                                            key={`route-${point.id}`}
                                            longitude={point.coordinates[0]}
                                            latitude={point.coordinates[1]}
                                        >
                                            <MarkerContent>
                                                <div className={cn(
                                                    "size-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all duration-300",
                                                    point.type === "theater" ? "bg-primary" : "bg-accent",
                                                    "scale-110 z-[100]"
                                                )}>
                                                    <span className="text-[10px] font-bold text-white">{index + 1}</span>
                                                </div>
                                            </MarkerContent>
                                            <MarkerPopup closeButton>
                                                <div className="p-1 space-y-2">
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{point.type}</p>
                                                    <h3 className="font-bold text-sm tracking-tight">{point.name}</h3>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="w-full h-8 text-[10px]"
                                                        onClick={() => removePoint(point.id)}
                                                    >
                                                        Remove from Route
                                                    </Button>
                                                </div>
                                            </MarkerPopup>
                                        </MapMarker>
                                    ))}

                                    {/* Unselected Theater Markers (Background) */}
                                    {(activeTab === "all" || activeTab === "markers") && theaters
                                        .filter(t => !routePoints.some(rp => rp.id === t.id))
                                        .map((theater) => (
                                            <MapMarker
                                                key={theater.id}
                                                longitude={theater.coordinates[0]}
                                                latitude={theater.coordinates[1]}
                                            >
                                                <MarkerContent>
                                                    <div className="size-5 rounded-full border-2 border-white bg-white/20 hover:bg-primary transition-colors duration-300 cursor-pointer shadow-lg" />
                                                </MarkerContent>
                                                <MarkerPopup closeButton>
                                                    <div className="p-1 space-y-2">
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Cinema</p>
                                                        <h3 className="font-bold text-sm tracking-tight">{theater.name}</h3>
                                                        <Button
                                                            size="sm"
                                                            className="w-full h-8 text-[10px]"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addTheaterToRoute(theater);
                                                            }}
                                                        >
                                                            Add to Route
                                                        </Button>
                                                    </div>
                                                </MarkerPopup>
                                            </MapMarker>
                                        ))}

                                    {/* Dynamic OSRM Routes Section */}
                                    {(activeTab === "all" || activeTab === "routes") && routes.map((route, idx) => (
                                        <MapRoute
                                            key={`osrm-route-${idx}`}
                                            coordinates={route.geometry}
                                            color={idx === selectedRouteIndex ? "#E50914" : "#4b5563"}
                                            width={idx === selectedRouteIndex ? 6 : 4}
                                            opacity={idx === selectedRouteIndex ? 1 : 0.4}
                                            onClick={() => setSelectedRouteIndex(idx)}
                                        />
                                    ))}
                                </Map>
                            </div>
                        </CardContent>
                    </Card>
                </Tabs>
            </div>
        </div>
    );
}
