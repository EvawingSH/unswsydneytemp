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

export function SuburbCombobox() {
  const { data } = useSuburbBoundaries();
  const selectedSuburbCode = useVizStore((s) => s.selectedSuburbCode);
  const selectSuburb = useVizStore((s) => s.selectSuburb);
  const [open, setOpen] = useState(false);

  const suburbs = useMemo(() => {
    if (!data) return [];
    return data.features
      .map((f) => f.properties)
      .sort((a, b) => a.salName.localeCompare(b.salName));
  }, [data]);

  const selected = suburbs.find((s) => s.salCode === selectedSuburbCode);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label="Suburb"
          className="flex h-11 w-full items-center justify-between gap-2 rounded-full border border-transparent bg-sidebar-accent px-4 text-base font-medium"
        >
          <span className={selected ? "truncate" : "truncate font-normal text-muted-foreground"}>
            {selected ? selected.salName : "Search suburbs..."}
          </span>
          {selected ? (
            <XIcon
              className="size-4 shrink-0 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                selectSuburb(null);
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
                    onSelect={() => {
                      selectSuburb(s.salCode);
                      setOpen(false);
                    }}
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
