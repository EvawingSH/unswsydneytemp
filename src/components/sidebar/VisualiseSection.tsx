import { ChevronDownIcon, LayersIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useVizStore, type ViewDimension } from "@/store/useVizStore";
import type { MetricMode, VisualizationMode } from "@/lib/types";

const MODE_OPTIONS: { value: VisualizationMode; label: string }[] = [
  { value: "hex", label: "Hex data points" },
  { value: "suburb", label: "Suburb average" },
];

const DIMENSION_OPTIONS: { value: ViewDimension; label: string }[] = [
  { value: "2d", label: "2D" },
  { value: "3d", label: "3D (color + height)" },
];

const METRIC_OPTIONS: { value: MetricMode; label: string }[] = [
  { value: "absolute", label: "Absolute temperature" },
  { value: "anomaly", label: "vs. city average" },
];

export function VisualiseSection() {
  const mode = useVizStore((s) => s.mode);
  const setMode = useVizStore((s) => s.setMode);
  const viewDimension = useVizStore((s) => s.viewDimension);
  const setViewDimension = useVizStore((s) => s.setViewDimension);
  const metric = useVizStore((s) => s.metric);
  const setMetric = useVizStore((s) => s.setMetric);
  const opacity = useVizStore((s) => s.opacity);
  const setOpacity = useVizStore((s) => s.setOpacity);
  const visualiseOpen = useVizStore((s) => s.visualiseOpen);
  const setVisualiseOpen = useVizStore((s) => s.setVisualiseOpen);

  return (
    <Collapsible open={visualiseOpen} onOpenChange={setVisualiseOpen} className="px-3 py-4">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-base font-bold tracking-wide uppercase">
        <span className="flex items-center gap-2">
          <LayersIcon className="size-5" />
          Visualise
        </span>
        <ChevronDownIcon
          className={`size-5 transition-transform ${visualiseOpen ? "" : "-rotate-90"}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 space-y-5">
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold">Visualization</Label>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as VisualizationMode)}
          >
            {MODE_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2.5">
                <RadioGroupItem value={opt.value} id={`mode-${opt.value}`} className="size-5" />
                <Label htmlFor={`mode-${opt.value}`} className="text-base font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {mode === "hex" && (
          <>
            <Separator />
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold">Dimension</Label>
              <RadioGroup
                value={viewDimension}
                onValueChange={(v) => setViewDimension(v as ViewDimension)}
              >
                {DIMENSION_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2.5">
                    <RadioGroupItem value={opt.value} id={`dim-${opt.value}`} className="size-5" />
                    <Label htmlFor={`dim-${opt.value}`} className="text-base font-normal">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-2.5">
          <Label className="text-sm font-semibold">Metric</Label>
          <RadioGroup value={metric} onValueChange={(v) => setMetric(v as MetricMode)}>
            {METRIC_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2.5">
                <RadioGroupItem value={opt.value} id={`metric-${opt.value}`} className="size-5" />
                <Label htmlFor={`metric-${opt.value}`} className="text-base font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Layer opacity</Label>
            <span className="text-sm text-muted-foreground">{Math.round(opacity * 100)}%</span>
          </div>
          <Slider
            value={[opacity]}
            onValueChange={(v) => setOpacity(Array.isArray(v) ? v[0] : v)}
            min={0}
            max={1}
            step={0.05}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
