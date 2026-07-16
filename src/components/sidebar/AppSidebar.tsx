import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ExploreSection } from "@/components/sidebar/ExploreSection";
import { VisualiseSection } from "@/components/sidebar/VisualiseSection";
import { StatsSection } from "@/components/sidebar/StatsSection";

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-start gap-2">
          <SidebarTrigger className="-ml-1.5 mt-1 size-8 shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="text-2xl leading-tight font-bold tracking-tight uppercase">
              Sydney Heat Map
            </span>
            <span className="text-base text-muted-foreground">Air temperature explorer</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <ExploreSection />
        <SidebarSeparator />
        <VisualiseSection />
        <SidebarSeparator />
        <StatsSection />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
