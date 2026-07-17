import { useMemo } from "react";
import { XIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVizStore } from "@/store/useVizStore";
import { useSuburbBoundaries, useSuburbStats } from "@/hooks/useSuburbData";
import { rankSuburbs } from "@/lib/suburbRanking";

export function RankingBox() {
  const ranking = useVizStore((s) => s.ranking);
  const setRanking = useVizStore((s) => s.setRanking);
  const dateId = useVizStore((s) => s.dateId);
  const metric = useVizStore((s) => s.metric);
  const { data: boundaries } = useSuburbBoundaries();
  const { data: stats } = useSuburbStats();

  const entries = useMemo(() => {
    if (!ranking || !boundaries || !stats) return null;
    return rankSuburbs(boundaries, stats, dateId, metric, ranking);
  }, [ranking, boundaries, stats, dateId, metric]);

  if (!ranking || !entries) return null;

  return (
    <Card className="w-full gap-2 border-transparent bg-card/95 py-3 text-sidebar-foreground shadow-lg backdrop-blur">
      <CardHeader className="px-4 pb-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            {ranking === "hottest" ? "10 Hottest Suburbs" : "10 Coldest Suburbs"}
          </CardTitle>
          <button
            type="button"
            onClick={() => setRanking(null)}
            aria-label="Close"
            className="shrink-0 text-muted-foreground hover:text-sidebar-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <ol className="space-y-1">
          {entries.map((entry, i) => {
            const sign = metric === "anomaly" && entry.value > 0 ? "+" : "";
            return (
              <li
                key={entry.salCode}
                className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-sm"
              >
                <span className="truncate">
                  <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                  {entry.salName}
                </span>
                <span className="shrink-0 font-normal">
                  {sign}
                  {entry.value.toFixed(1)}°C
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
