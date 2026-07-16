import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { HistogramBin } from "@/lib/histogram";

interface HistogramChartProps {
  bins: HistogramBin[];
  domain: [number, number];
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
}

export function HistogramChart({ bins, domain, value, onValueChange }: HistogramChartProps) {
  const maxCount = Math.max(1, ...bins.map((b) => b.count));
  const [domainMin, domainMax] = domain;
  const step = (domainMax - domainMin) / 100;

  return (
    <div className="relative h-24 pb-1">
      <div className="absolute inset-0 flex items-end gap-1">
        {bins.map((bin) => {
          const heightPct = bin.count > 0 ? Math.max((bin.count / maxCount) * 100, 6) : 0;
          const inRange = bin.rangeMax > value[0] && bin.rangeMin < value[1];
          return (
            <Tooltip key={`${bin.rangeMin}-${bin.rangeMax}`}>
              <TooltipTrigger className="flex h-full flex-1 items-end justify-center border-0 bg-transparent p-0">
                <div
                  className="w-full max-w-6 rounded-t-[4px] ring-1 ring-inset ring-foreground/10 transition-opacity"
                  style={{ height: `${heightPct}%`, background: bin.color, opacity: inRange ? 1 : 0.25 }}
                />
              </TooltipTrigger>
              <TooltipContent>
                {bin.rangeMin.toFixed(1)}° to {bin.rangeMax.toFixed(1)}° · {bin.count} suburbs
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <SliderPrimitive.Root
        className="absolute inset-x-0 bottom-0"
        value={value}
        onValueChange={(v) => onValueChange(v as [number, number])}
        min={domainMin}
        max={domainMax}
        step={step}
        minStepsBetweenValues={1}
      >
        <SliderPrimitive.Control className="relative flex h-6 w-full touch-none items-center select-none">
          <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-transparent">
            <SliderPrimitive.Indicator className="h-full rounded-full bg-sidebar-foreground/25" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            index={0}
            className="block size-4 shrink-0 rounded-full border-2 border-sidebar-foreground bg-white shadow-md outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <SliderPrimitive.Thumb
            index={1}
            className="block size-4 shrink-0 rounded-full border-2 border-sidebar-foreground bg-white shadow-md outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
    </div>
  );
}
