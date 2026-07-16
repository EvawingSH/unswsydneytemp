import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVizStore } from "@/store/useVizStore";
import { absoluteLegendStops, anomalyLegendStops, NO_DATA_COLOR } from "@/lib/colorScales";

export function ColorLegend() {
  const metric = useVizStore((s) => s.metric);
  const stops = metric === "absolute" ? absoluteLegendStops() : anomalyLegendStops();
  const domainMin = stops[0].rangeMin;
  const domainMax = stops[stops.length - 1].rangeMax;

  return (
    <Card className="absolute bottom-4 left-4 z-[500] w-64 gap-2 border-transparent bg-card/95 py-3 text-sidebar-foreground shadow-lg backdrop-blur">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-base font-semibold">
          {metric === "absolute" ? "Air temperature (°C)" : "vs. city average (°C)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 px-4">
        <div className="flex h-4 w-full overflow-hidden rounded-full ring-1 ring-foreground/10">
          {stops.map((s) => (
            <div
              key={s.color + s.rangeMin}
              className="h-full"
              style={{ background: s.color, flexGrow: s.rangeMax - s.rangeMin, flexBasis: 0 }}
              title={`${s.rangeMin.toFixed(1)}° to ${s.rangeMax.toFixed(1)}°`}
            />
          ))}
        </div>
        {metric === "absolute" ? (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{domainMin.toFixed(0)}°</span>
            <span>{((domainMin + domainMax) / 2).toFixed(0)}°</span>
            <span>{domainMax.toFixed(0)}°</span>
          </div>
        ) : (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{domainMin.toFixed(0)}° cooler</span>
            <span>avg</span>
            <span>+{domainMax.toFixed(0)}° warmer</span>
          </div>
        )}
        <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
          <span
            className="inline-block size-3 rounded-full ring-1 ring-foreground/10"
            style={{ background: NO_DATA_COLOR }}
          />
          <span>No data</span>
        </div>
      </CardContent>
    </Card>
  );
}
