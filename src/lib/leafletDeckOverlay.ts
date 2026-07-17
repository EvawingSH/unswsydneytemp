import * as L from "leaflet";
import { Deck, type DeckProps, type PickingInfo } from "@deck.gl/core";

/** Fixed camera tilt so extruded (3D) polygons actually read as height, not a flat top-down fill. */
export const DECK_OVERLAY_PITCH = 45;

/** Leaflet's pan/zoom-sync internals aren't in @types/leaflet's public surface. */
type LeafletMapInternal = L.Map & {
  _animatingZoom: boolean;
  _getMapPanePos(): L.Point;
};

function getViewState(map: L.Map) {
  return {
    longitude: map.getCenter().lng,
    latitude: map.getCenter().lat,
    zoom: map.getZoom() - 1,
    pitch: DECK_OVERLAY_PITCH,
    bearing: 0,
  };
}

/**
 * Renders a deck.gl `Deck` instance as a Leaflet layer. Adapted from
 * @deck.gl-community/leaflet's DeckOverlay (MIT licensed) — same container
 * positioning/pan-zoom sync, but with a fixed non-zero pitch (that package hardcodes
 * pitch: 0, which makes extruded/3D polygons look flat since the camera looks
 * straight down).
 */
export class PitchedDeckOverlay extends L.Layer {
  private deckProps: DeckProps;
  private container?: HTMLDivElement;
  private deck?: Deck;

  constructor(props: DeckProps, options?: L.LayerOptions) {
    // L.Layer has no initialize() of its own to merge constructor options into `this.options`
    // (unlike most concrete Leaflet layers), so without this, passing `{ pane }` here would be
    // silently ignored and the overlay would always fall back to the default 'overlayPane'.
    super();
    if (options) L.Util.setOptions(this, options);
    this.deckProps = props;
  }

  onAdd(): this {
    const pane = this.getPane();
    if (!pane) return this;

    this.container = L.DomUtil.create("div");
    this.container.className = "leaflet-layer";
    if (this.isZoomAnimated()) {
      L.DomUtil.addClass(this.container, "leaflet-zoom-animated");
    }
    pane.appendChild(this.container);

    this.deck = new Deck({
      ...this.deckProps,
      parent: this.container,
      controller: false,
      style: { zIndex: "auto" },
      viewState: getViewState(this._map),
    });
    this.update();
    return this;
  }

  onRemove(): this {
    if (!this.container || !this.deck) return this;
    L.DomUtil.remove(this.container);
    this.container = undefined;
    this.deck.finalize();
    this.deck = undefined;
    return this;
  }

  getEvents(): { [name: string]: L.LeafletEventHandlerFn } {
    return {
      viewreset: this.reset,
      movestart: this.pauseAnimation,
      moveend: this.onMoveEnd,
      zoomstart: this.pauseAnimation,
      zoom: this.onZoom,
      zoomend: this.unpauseAnimation,
      ...(this.isZoomAnimated() ? { zoomanim: this.onAnimZoom } : {}),
    };
  }

  setProps(props: Partial<DeckProps>): void {
    Object.assign(this.deckProps, props);
    this.deck?.setProps(props);
  }

  /**
   * Synchronous pick at a viewport point (from a native MouseEvent's clientX/clientY), bypassing
   * deck.gl's own gesture-recognizer-driven onClick/onHover. Layer onClick handlers proved
   * unreliable here — clicks reliably reach the canvas (confirmed via raw DOM listeners) but
   * mjolnir.js's tap/click recognizer never fires — so callers should drive picking through this
   * instead of a layer's `onClick` prop.
   */
  pickObjectAt(clientX: number, clientY: number): PickingInfo | null {
    if (!this.deck || !this.container) return null;
    const rect = this.container.getBoundingClientRect();
    return this.deck.pickObject({ x: clientX - rect.left, y: clientY - rect.top, radius: 2 });
  }

  private isZoomAnimated(): boolean {
    return (this as unknown as { _zoomAnimated: boolean })._zoomAnimated;
  }

  private update = () => {
    if (!this.container || !this.deck) return;
    if ((this._map as LeafletMapInternal)._animatingZoom) return;
    const size = this._map.getSize();
    this.container.style.width = `${size.x}px`;
    this.container.style.height = `${size.y}px`;
    const offset = (this._map as LeafletMapInternal)._getMapPanePos().multiplyBy(-1);
    L.DomUtil.setPosition(this.container, offset);
    this.deck.setProps({ viewState: getViewState(this._map) });
    this.deck.redraw();
  };

  private pauseAnimation = () => {
    if (!this.deck) return;
    if (this.deck.props._animate) {
      this.wasAnimating = this.deck.props._animate;
      this.deck.setProps({ _animate: false });
    }
  };

  private wasAnimating: boolean | undefined;

  private unpauseAnimation = () => {
    if (!this.deck) return;
    if (this.wasAnimating) {
      this.deck.setProps({ _animate: this.wasAnimating });
      this.wasAnimating = undefined;
    }
  };

  private reset = () => {
    this.updateTransform(this._map.getCenter(), this._map.getZoom());
    this.update();
  };

  private onMoveEnd = () => {
    this.update();
    this.unpauseAnimation();
  };

  private onZoom = () => {
    this.updateTransform(this._map.getCenter(), this._map.getZoom());
  };

  private onAnimZoom = (event: L.LeafletEvent) => {
    const zoomEvent = event as L.ZoomAnimEvent;
    this.updateTransform(zoomEvent.center, zoomEvent.zoom);
  };

  /** see https://stackoverflow.com/a/67107000 and L.Renderer._updateTransform */
  private updateTransform(center: L.LatLng, zoom: number): void {
    if (!this.container) return;
    const map = this._map;
    const scale = map.getZoomScale(zoom, map.getZoom());
    const position = L.DomUtil.getPosition(this.container);
    const viewHalf = map.getSize().multiplyBy(0.5);
    const currentCenterPoint = map.project(map.getCenter(), zoom);
    const destCenterPoint = map.project(center, zoom);
    const centerOffset = destCenterPoint.subtract(currentCenterPoint);
    const topLeftOffset = viewHalf
      .multiplyBy(-scale)
      .add(position)
      .add(viewHalf)
      .subtract(centerOffset);
    if (L.Browser.any3d) {
      L.DomUtil.setTransform(this.container, topLeftOffset, scale);
    } else {
      L.DomUtil.setPosition(this.container, topLeftOffset);
    }
  }
}
