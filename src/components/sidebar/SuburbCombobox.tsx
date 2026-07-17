import { useMemo, useState } from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSuburbBoundaries } from "@/hooks/useSuburbData";
import { useVizStore } from "@/store/useVizStore";

/** Multi-select suburb search — picks restrict both hex and suburb-average data to just these suburbs. */
export function SuburbCombobox() {
  const { data } = useSuburbBoundaries();
  const filterSuburbCodes = useVizStore((s) => s.filterSuburbCodes);
  const toggleSuburbFilter = useVizStore((s) => s.toggleSuburbFilter);
  const clearSuburbFilter = useVizStore((s) => s.clearSuburbFilter);
  const [open, setOpen] = useState(false);

  const suburbs = useMemo(() => {
    if (!data) return [];
    return data.features
      .map((f) => f.properties)
      .sort((a, b) => a.salName.localeCompare(b.salName));
  }, [data]);

  const selectedCodes = useMemo(() => new Set(filterSuburbCodes), [filterSuburbCodes]);

  const triggerLabel = useMemo(() => {
    if (selectedCodes.size === 0) return "Search suburbs...";
    if (selectedCodes.size === 1) {
      return suburbs.find((s) => selectedCodes.has(s.salCode))?.salName ?? "1 suburb selected";
    }
    return `${selectedCodes.size} suburbs selected`;
  }, [selectedCodes, suburbs]);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label="Suburb"
          className="flex h-11 w-full items-center justify-between gap-2 rounded-full border border-transparent bg-sidebar-accent px-4 text-base font-medium"
        >
          <span
            className={
              selectedCodes.size > 0 ? "truncate" : "truncate font-normal text-muted-foreground"
            }
          >
            {triggerLabel}
          </span>
          {selectedCodes.size > 0 ? (
            <XIcon
              className="size-4 shrink-0 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                clearSuburbFilter();
              }}
            />
          ) : (
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search suburbs..." />
            <CommandList>
              <CommandEmpty>No suburb found.</CommandEmpty>
              <CommandGroup>
                {suburbs.map((s) => (
                  <CommandItem
                    key={s.salCode}
                    value={s.salName}
                    data-checked={selectedCodes.has(s.salCode) ? "true" : "false"}
                    onSelect={() => toggleSuburbFilter(s.salCode)}
                  >
                    {s.salName}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
