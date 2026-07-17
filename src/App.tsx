import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { MapView } from "@/components/map/MapView";
import { InfoBox } from "@/components/map/InfoBox";
import { ColorLegend } from "@/components/map/ColorLegend";
import { RankingBox } from "@/components/map/RankingBox";

/** Visible reopen affordance — the in-sidebar trigger disappears along with the sidebar itself
 *  once collapsed, so this floats over the map whenever there'd otherwise be no way back. */
function FloatingSidebarTrigger() {
  const { state, isMobile, openMobile } = useSidebar();
  const collapsed = isMobile ? !openMobile : state === "collapsed";

  if (!collapsed) return null;

  return (
    <SidebarTrigger className="absolute top-4 left-4 z-50 size-10 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md hover:bg-sidebar-accent" />
  );
}

function App() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="h-svh overflow-hidden">
          <MapView />
          <FloatingSidebarTrigger />
          <div className="absolute top-4 right-4 z-[500] flex w-64 flex-col gap-3">
            <InfoBox />
            <ColorLegend />
            <RankingBox />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export default App;
