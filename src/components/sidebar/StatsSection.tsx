import { useMemo } from "react";
import { ChevronDownIcon, BarChart3Icon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVizStore } from "@/store/useVizStore";
import { useSuburbStats } from "@/hooks/useSuburbData";
import {
  ABSOLUTE_DOMAIN,
  ANOMALY_DOMAIN,
  absoluteLegendStops,
  anomalyLegendStops,
} from "@/lib/colorScales";
import { buildHistogram } from "@/lib/histogram";
import { HistogramChart } from "@/components/sidebar/HistogramChart";

export function StatsSection() {
  const dateId = useVizStore((s) => s.dateId);
  const metric = useVizStore((s) => s.metric);
  const statsOpen = useVizStore((s) => s.statsOpen);
  const setStatsOpen = useVizStore((s) => s.setStatsOpen);
  const filterRange = useVizStore((s) => s.filterRange);
  const setFilterRange = useVizStore((s) => s.setFilterRange);
  const { data: stats } = useSuburbStats();

  const domain = metric === "absolute" ? ABSOLUTE_DOMAIN : ANOMALY_DOMAIN;
  const isFiltered = filterRange[0] > domain[0] || filterRange[1] < domain[1];

  const values = useMemo(() => {
    if (!stats) return null;
    const out: number[] = [];
    for (const entry of Object.values(stats[dateId] ?? {})) {
      const v = metric === "absolute" ? entry.mean : entry.anomaly;
      if (v != null) out.push(v);
    }
    return out;
  }, [stats, dateId, metric]);

  const bins = useMemo(() => {
    if (!values) return null;
    const legendStops = metric === "absolute" ? absoluteLegendStops() : anomalyLegendStops();
    return buildHistogram(values, legendStops);
  }, [values, metric]);

  const visibleCount = useMemo(() => {
    if (!values) return 0;
    return values.filter((v) => v >= filterRange[0] && v <= filterRange[1]).length;
  }, [values, filterRange]);

  return (
    <Collapsible open={statsOpen} onOpenChange={setStatsOpen} className="px-3 py-4">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-base font-bold tracking-wide uppercase">
        <span className="flex items-center gap-2">
          <BarChart3Icon className="size-5" />
          Stats
        </span>
        <ChevronDownIcon
          className={`size-5 transition-transform ${statsOpen ? "" : "-rotate-90"}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <Card className="border-transparent bg-sidebar-accent/60">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">
                {metric === "absolute"
                  ? "Suburb temperature distribution"
                  : "Suburb anomaly distribution"}
              </CardTitle>
              {isFiltered && (
                <button
                  type="button"
                  onClick={() => setFilterRange(domain)}
                  className="shrink-0 text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-sidebar-foreground"
                >
                  Reset
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {bins && values ? (
              <>
                <HistogramChart
                  bins={bins}
                  domain={domain}
                  value={filterRange}
                  onValueChange={setFilterRange}
                />
                <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {filterRange[0].toFixed(1)}° to {filterRange[1].toFixed(1)}°
                  </span>
                  <span>
                    {visibleCount} of {values.length} suburbs
                  </span>
                </div>
              </>
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
