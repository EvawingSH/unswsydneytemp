import { ChevronDownIcon, CompassIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SuburbCombobox } from "@/components/sidebar/SuburbCombobox";
import { useMetaData } from "@/hooks/useMetaData";
import { useVizStore } from "@/store/useVizStore";
import { datesForSeason, seasonForDateId } from "@/lib/season";
import type { DateId, Season } from "@/lib/types";

const SEASON_SENTINEL_ALL = "all";
const SEASON_LABELS: Record<string, string> = {
  [SEASON_SENTINEL_ALL]: "All seasons",
  summer: "Summer",
  winter: "Winter",
};

export function ExploreSection() {
  const { meta } = useMetaData();
  const dateId = useVizStore((s) => s.dateId);
  const setDateId = useVizStore((s) => s.setDateId);
  const season = useVizStore((s) => s.season);
  const setSeason = useVizStore((s) => s.setSeason);
  const exploreOpen = useVizStore((s) => s.exploreOpen);
  const setExploreOpen = useVizStore((s) => s.setExploreOpen);

  const availableDates = datesForSeason(meta?.dates ?? [], season);

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
      </CollapsibleContent>
    </Collapsible>
  );
}
