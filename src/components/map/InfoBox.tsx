import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetaData } from "@/hooks/useMetaData";
import { useSuburbBoundaries, useSuburbStats } from "@/hooks/useSuburbData";
import { useVizStore } from "@/store/useVizStore";
import { seasonForDateId } from "@/lib/season";

// Matches the map's warm/cool endpoints (TEMPERATURE_COLOR_STOPS) for the delta line.
const WARM_TEXT_COLOR = "#c2410c";
const COOL_TEXT_COLOR = "#1d4ed8";

export function InfoBox() {
  const dateId = useVizStore((s) => s.dateId);
  const selectedSuburbCode = useVizStore((s) => s.selectedSuburbCode);
  const { meta } = useMetaData();
  const { data: boundaries } = useSuburbBoundaries();
  const { data: stats } = useSuburbStats();

  const dateStats = stats?.[dateId];
  const dateMeta = meta?.dates.find((d) => d.id === dateId);
  const cityMean = meta?.perDate[dateId]?.mean;
  const seasonLabel = seasonForDateId(dateId) === "summer" ? "Summer" : "Winter";

  const selectedName = boundaries?.features.find(
    (f) => f.properties.salCode === selectedSuburbCode,
  )?.properties.salName;

  const selectedEntry = selectedSuburbCode ? dateStats?.[selectedSuburbCode] : undefined;

  const rank = useMemo(() => {
    if (!dateStats || !selectedSuburbCode) return null;
    const entries = Object.entries(dateStats).filter(([, v]) => v.mean != null);
    const selfMean = dateStats[selectedSuburbCode]?.mean;
    if (selfMean == null) return null;
    const hotterCount = entries.filter(([, v]) => (v.mean as number) < selfMean).length;
    return { hotterCount, total: entries.length };
  }, [dateStats, selectedSuburbCode]);

  if (!meta) {
    return (
      <Card className="absolute top-4 right-4 z-[500] w-64 gap-2 border-transparent bg-card/95 py-3 shadow-lg">
        <CardContent className="px-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const heroValue = selectedEntry?.mean ?? cityMean;
  const anomaly = selectedEntry?.anomaly;

  return (
    <Card className="absolute top-4 right-4 z-[500] w-64 gap-1.5 border-transparent bg-card/95 py-3 text-sidebar-foreground shadow-lg backdrop-blur">
      <CardContent className="px-4">
        <div className="truncate text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {selectedName ?? "Sydney · city average"}
        </div>
        <div className="text-3xl leading-tight font-bold">
          {heroValue != null ? `${heroValue.toFixed(1)}°C` : "—"}
        </div>
        {selectedEntry && anomaly != null && cityMean != null ? (
          <div
            className="text-sm font-medium"
            style={{ color: anomaly >= 0 ? WARM_TEXT_COLOR : COOL_TEXT_COLOR }}
          >
            {anomaly >= 0 ? "+" : ""}
            {anomaly.toFixed(1)}° vs Sydney average ({cityMean.toFixed(1)}°C)
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Sydney-wide average</div>
        )}
        {rank && (
          <div className="mt-0.5 text-sm text-muted-foreground">
            Hotter than {rank.hotterCount} of {rank.total} suburbs
          </div>
        )}
        <div className="mt-1 text-xs text-muted-foreground">
          {seasonLabel} day · {dateMeta?.label ?? dateId}
        </div>
      </CardContent>
    </Card>
  );
}
