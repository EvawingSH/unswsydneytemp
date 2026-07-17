import { useMemo, type ReactNode } from "react";
import { XIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetaData } from "@/hooks/useMetaData";
import { useSuburbBoundaries, useSuburbStats } from "@/hooks/useSuburbData";
import { useSuburbFilter } from "@/hooks/useSuburbFilter";
import { useHexContainingSuburb } from "@/hooks/useHexContainingSuburb";
import { useVizStore } from "@/store/useVizStore";
import { seasonForDateId } from "@/lib/season";
import type { SuburbStatEntry } from "@/lib/types";

// Matches the map's warm/cool endpoints (TEMPERATURE_COLOR_STOPS) for the delta line.
const WARM_TEXT_COLOR = "#c2410c";
const COOL_TEXT_COLOR = "#1d4ed8";

function rankSuburb(
  dateStats: Record<string, SuburbStatEntry> | undefined,
  salCode: string | undefined,
) {
  if (!dateStats || !salCode) return null;
  const selfMean = dateStats[salCode]?.mean;
  if (selfMean == null) return null;
  const entries = Object.values(dateStats).filter((v) => v.mean != null);
  const hotterCount = entries.filter((v) => (v.mean as number) < selfMean).length;
  return { hotterCount, total: entries.length };
}

function DeltaLine({ anomaly, cityMean }: { anomaly: number | null | undefined; cityMean: number | undefined }) {
  if (anomaly == null || cityMean == null) {
    return <div className="text-sm text-muted-foreground">No data</div>;
  }
  return (
    <div
      className="text-sm font-medium"
      style={{ color: anomaly >= 0 ? WARM_TEXT_COLOR : COOL_TEXT_COLOR }}
    >
      {anomaly >= 0 ? "+" : ""}
      {anomaly.toFixed(1)}° vs Sydney average ({cityMean.toFixed(1)}°C)
    </div>
  );
}

/**
 * Clicking a suburb or hex on the map ("inspecting" it) takes priority over the active filter
 * summary — you get to see exactly what you clicked, independent of what's currently filtered.
 */
export function InfoBox() {
  const dateId = useVizStore((s) => s.dateId);
  const inspectedSuburbCode = useVizStore((s) => s.inspectedSuburbCode);
  const inspectedHex = useVizStore((s) => s.inspectedHex);
  const clearInspection = useVizStore((s) => s.clearInspection);
  const activeSuburbCodes = useSuburbFilter();
  const { meta } = useMetaData();
  const { data: boundaries } = useSuburbBoundaries();
  const { data: stats } = useSuburbStats();
  const inspectedHexSuburbName = useHexContainingSuburb(inspectedHex?.h3 ?? null);

  const dateStats = stats?.[dateId];
  const dateMeta = meta?.dates.find((d) => d.id === dateId);
  const cityMean = meta?.perDate[dateId]?.mean;
  const seasonLabel = seasonForDateId(dateId) === "summer" ? "Summer" : "Winter";

  const filterCodes = useMemo(
    () => (activeSuburbCodes ? Array.from(activeSuburbCodes) : []),
    [activeSuburbCodes],
  );

  const suburbName = (salCode: string | null) =>
    salCode
      ? boundaries?.features.find((f) => f.properties.salCode === salCode)?.properties.salName
      : undefined;

  // Filter summary (used only when nothing is individually inspected): a single pick shows that
  // suburb's own stats, multiple picks show the group average.
  const filterGroup = useMemo(() => {
    if (!dateStats || filterCodes.length === 0) return null;
    const entries = filterCodes
      .map((code) => dateStats[code])
      .filter((e): e is NonNullable<typeof e> => e?.mean != null);
    if (entries.length === 0) return null;
    const mean = entries.reduce((sum, e) => sum + e.mean!, 0) / entries.length;
    const anomalyValues = entries.filter((e) => e.anomaly != null).map((e) => e.anomaly as number);
    const anomaly =
      anomalyValues.length > 0
        ? anomalyValues.reduce((sum, v) => sum + v, 0) / anomalyValues.length
        : null;
    return { mean, anomaly };
  }, [dateStats, filterCodes]);

  const inspectedSuburbRank = useMemo(
    () => rankSuburb(dateStats, inspectedSuburbCode ?? undefined),
    [dateStats, inspectedSuburbCode],
  );
  const filterSuburbRank = useMemo(
    () => (filterCodes.length === 1 ? rankSuburb(dateStats, filterCodes[0]) : null),
    [dateStats, filterCodes],
  );

  if (!meta) {
    return (
      <Card className="w-full gap-2 border-transparent bg-card/95 py-3 shadow-lg">
        <CardContent className="px-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const showClear = Boolean(inspectedSuburbCode || inspectedHex);
  let title: string;
  let heroValue: number | undefined;
  let deltaNode: ReactNode;
  let extraLine: ReactNode = null;

  if (inspectedHex) {
    title = inspectedHexSuburbName ?? "Hex data point";
    heroValue = inspectedHex.avgTemp;
    deltaNode = <DeltaLine anomaly={inspectedHex.anomaly} cityMean={cityMean} />;
    extraLine = (
      <div className="mt-0.5 text-sm text-muted-foreground">
         Based on {inspectedHex.count} px
      </div>
    );
  } else if (inspectedSuburbCode) {
    const entry = dateStats?.[inspectedSuburbCode];
    title = suburbName(inspectedSuburbCode) ?? "Selected suburb";
    heroValue = entry?.mean ?? undefined;
    deltaNode = <DeltaLine anomaly={entry?.anomaly} cityMean={cityMean} />;
    if (inspectedSuburbRank) {
      extraLine = (
        <div className="mt-0.5 text-sm text-muted-foreground">
          Hotter than {inspectedSuburbRank.hotterCount} of {inspectedSuburbRank.total} suburbs
        </div>
      );
    }
  } else {
    heroValue = filterGroup?.mean ?? cityMean;
    title =
      filterCodes.length === 0
        ? "Sydney · city average"
        : filterCodes.length === 1
          ? (suburbName(filterCodes[0]) ?? "Selected suburb")
          : `${filterCodes.length} suburbs selected`;
    deltaNode = filterGroup ? (
      <DeltaLine anomaly={filterGroup.anomaly} cityMean={cityMean} />
    ) : (
      <div className="text-sm text-muted-foreground">Sydney-wide average</div>
    );
    if (filterSuburbRank) {
      extraLine = (
        <div className="mt-0.5 text-sm text-muted-foreground">
          Hotter than {filterSuburbRank.hotterCount} of {filterSuburbRank.total} suburbs
        </div>
      );
    }
  }

  return (
    <Card className="w-full gap-1.5 border-transparent bg-card/95 py-3 text-sidebar-foreground shadow-lg backdrop-blur">
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="truncate text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {title}
          </div>
          {showClear && (
            <button
              type="button"
              onClick={() => clearInspection()}
              aria-label="Clear selection"
              className="shrink-0 text-muted-foreground hover:text-sidebar-foreground"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
        <div className="text-3xl leading-tight font-bold">
          {heroValue != null ? `${heroValue.toFixed(1)}°C` : "—"}
        </div>
        {deltaNode}
        {extraLine}
        <div className="mt-1 text-xs text-muted-foreground">
          {seasonLabel} day · {dateMeta?.label ?? dateId}
        </div>
      </CardContent>
    </Card>
  );
}
