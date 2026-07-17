import { useMemo } from "react";
import { ChevronDownIcon, CompassIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SuburbCombobox } from "@/components/sidebar/SuburbCombobox";
import { useMetaData } from "@/hooks/useMetaData";
import { useSuburbStats } from "@/hooks/useSuburbData";
import { useVizStore, type RankingType } from "@/store/useVizStore";
import { datesForSeason, seasonForDateId } from "@/lib/season";
import {
  ABSOLUTE_DOMAIN,
  ANOMALY_DOMAIN,
  absoluteLegendStops,
  anomalyLegendStops,
} from "@/lib/colorScales";
import { buildHistogram } from "@/lib/histogram";
import { HistogramChart } from "@/components/sidebar/HistogramChart";
import type { DateId, Season } from "@/lib/types";

const SEASON_SENTINEL_ALL = "all";
const SEASON_LABELS: Record<string, string> = {
  [SEASON_SENTINEL_ALL]: "All seasons",
  summer: "Summer",
  winter: "Winter",
};

const RANKING_BUTTON_CLASS =
  "h-11 flex-1 rounded-full bg-sidebar-foreground text-base font-normal text-white transition-opacity hover:opacity-90";

export function ExploreSection() {
  const { meta } = useMetaData();
  const dateId = useVizStore((s) => s.dateId);
  const setDateId = useVizStore((s) => s.setDateId);
  const season = useVizStore((s) => s.season);
  const setSeason = useVizStore((s) => s.setSeason);
  const metric = useVizStore((s) => s.metric);
  const filterRange = useVizStore((s) => s.filterRange);
  const setFilterRange = useVizStore((s) => s.setFilterRange);
  const ranking = useVizStore((s) => s.ranking);
  const setRanking = useVizStore((s) => s.setRanking);
  const exploreOpen = useVizStore((s) => s.exploreOpen);
  const setExploreOpen = useVizStore((s) => s.setExploreOpen);
  const { data: stats } = useSuburbStats();

  const availableDates = datesForSeason(meta?.dates ?? [], season);

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

  const handleSeasonChange = (value: string | null) => {
    const nextSeason = !value || value === SEASON_SENTINEL_ALL ? null : (value as Season);
    setSeason(nextSeason);
    // Keep the date pill's selection valid — if the current date falls outside the
    // newly chosen season, jump to the first date that's still in range.
    if (nextSeason && seasonForDateId(dateId) !== nextSeason) {
      const fallback = datesForSeason(meta?.dates ?? [], nextSeason)[0];
      if (fallback) setDateId(fallback.id);
    }
  };

  const toggleRanking = (type: RankingType) => {
    setRanking(ranking === type ? null : type);
  };

  return (
    <Collapsible open={exploreOpen} onOpenChange={setExploreOpen} className="px-3 py-4">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-base font-bold tracking-wide uppercase">
        <span className="flex items-center gap-2">
          <CompassIcon className="size-5" />
          Explore
        </span>
        <ChevronDownIcon
          className={`size-5 transition-transform ${exploreOpen ? "" : "-rotate-90"}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggleRanking("hottest")}
            className={`${RANKING_BUTTON_CLASS} ${ranking === "hottest" ? "ring-2 ring-sidebar-foreground ring-offset-2 ring-offset-sidebar" : ""}`}
          >
            10 Hottest Suburbs
          </button>
          <button
            type="button"
            onClick={() => toggleRanking("coldest")}
            className={`${RANKING_BUTTON_CLASS} ${ranking === "coldest" ? "ring-2 ring-sidebar-foreground ring-offset-2 ring-offset-sidebar" : ""}`}
          >
            10 Coldest Suburbs
          </button>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Select value={season ?? SEASON_SENTINEL_ALL} onValueChange={handleSeasonChange}>
            <SelectTrigger
              aria-label="Season"
              className="h-11 flex-1 rounded-full border-transparent bg-sidebar-accent px-4 text-base font-medium"
            >
              <SelectValue placeholder="Season">
                {(value: string) => SEASON_LABELS[value] ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEASON_SENTINEL_ALL} className="text-base">
                All seasons
              </SelectItem>
              <SelectItem value="summer" className="text-base">
                Summer
              </SelectItem>
              <SelectItem value="winter" className="text-base">
                Winter
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateId} onValueChange={(v) => setDateId(v as DateId)}>
            <SelectTrigger
              aria-label="Date"
              className="h-11 flex-1 rounded-full border-transparent bg-sidebar-accent px-4 text-base font-medium"
            >
              <SelectValue placeholder="Select a date">
                {(value: string) => meta?.dates.find((d) => d.id === value)?.label ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableDates.map((d) => (
                <SelectItem key={d.id} value={d.id} className="text-base">
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SuburbCombobox />

        <Separator />

        <Card className="border-transparent bg-sidebar-accent/60">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">
                {metric === "absolute"
                  ? "Suburb temperature filter"
                  : "Suburb anomaly filter"}
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
