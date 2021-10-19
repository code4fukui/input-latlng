import L from "https://code4sabae.github.io/leaflet-mjs/leaflet.mjs";
import { Geo3x3 } from "https://geo3x3.com/Geo3x3.js";
import { create, setAttributes } from "https://js.sabae.cc/stdcomp.js";

const getMapLink = (ll) => {
  const link = "https://www.google.com/maps/dir/?api=1&destination=" + ll[0] + "," + ll[1];
  return link;
};

class InputLatLng extends HTMLElement {
  constructor(opts) { // lat, lng) {
    super();
    setAttributes(this, opts);
    const ll = opts?.value ? this._parseValue(opts.value) : [];
    //console.log(ll);

    this.lat = ll[0] || opts?.lat || 35;
    this.lng = ll[1] || opts?.lng || 135;

    const grayscale = this.getAttribute("grayscale");

    const link = create("link", this);
    link.rel = "stylesheet";
    link.href = "https://code4sabae.github.io/leaflet-mjs/" + (grayscale ? "leaflet-grayscale.css" : "leaflet.css");
    const div = this.div = create("div", this);

    const map = L.map(div);
    this.map = map;
    // set 国土地理院地図 https://maps.gsi.go.jp/development/ichiran.html
    L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
      attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>"',
      maxZoom: 18,
    }).addTo(map);
    map.scrollWheelZoom.disable();

    link.onload = () => this.init();

    if (!this.getAttribute("realtime")) {
      const ctrl = create("div", this, "control");
      this.inplat = create("input", ctrl);
      this.inplng = create("input", ctrl);
      const btn = create("button", ctrl);
      btn.textContent = "緯度経度セット";
      btn.onclick = () => {
        if (this.onchange) {
          this.onchange();
        }
      };
    }
  }
  async init() {
    const div = this.div;
    const map = this.map;
    div.style.width = this.getAttribute("width") || "100%";
    div.style.height = this.getAttribute("height") || "300px";

    const getLatLng = (d) => {
      const geo3x3 = this.getAttribute("geo3x3");
      if (geo3x3) {
        const pos = Geo3x3.decode(geo3x3);
        return [pos.lat, pos.lng];
      }
      const lat = this.getAttribute("lat") || this.lat;
      const lng = this.getAttribute("lng") || this.lng;
      if (lat && lng) {
        return [lat, lng];
      }
      const ll = this.getAttribute("latlng");
      if (ll) {
        return ll.split(",");
      }
      return null;
    };
    const ll = getLatLng();
    if (ll) {
      const zoom = this.getAttribute("zoom") || 13;
      map.setView(ll, zoom);
      if (this.inplat) {
        this.inplat.value = parseFloat(ll[0]).toFixed(5);
        this.inplng.value = parseFloat(ll[1]).toFixed(5);
      }
    }

    //
    //const config = { attributes: true, childList: true, subtree: true };
    const config = { attributes: true, childList: false, subtree: false };
    const callback = async (mlist, observer) => {
      observer.disconnect();
      await this.init();
    };
    const observer = new MutationObserver(callback);
    observer.observe(this, config);

    // add center cross
    const png = "https://code4fukui.github.io/input-latlng/crosshairs.png";
    const iconcenter = L.icon({
      iconUrl: png,
      iconRetinaUrl: png,
      iconSize: [ 35, 35 ],
      iconAnchor: [ 17, 17 ],
    })
    const crosshair = new L.marker(map.getCenter(), { icon: iconcenter, clickable: false })
    crosshair.addTo(map);

    map.on("move", () => {
      const ll = this.map.getCenter();
      crosshair.setLatLng(ll);
      if (this.getAttribute("realtime")) {
        if (this.onchange) {
          this.onchange();
        }
      } else {
        if (this.inplat) {
          this.inplat.value = parseFloat(ll.lat).toFixed(5);
          this.inplng.value = parseFloat(ll.lng).toFixed(5);
        }
      }
    });
  }
  _parseValue(pos) {
    if (typeof pos == "string") {
      const ll = Geo3x3.decode(pos);
      if (ll) {
        return [ll.lat, ll.lng];
      }
      const ll2 = ll.split(",");
      if (ll2.length >= 2) {
        return [ll2[0], ll2[1]];
      }
      console.log("not supported format: " + pos);
      return null;
    } else if (Array.isArray(pos)) {
      return [pos[0], pos[1]];
    } else {
      return [pos.lat, pos.lng];
    }
  }
  set value(pos) {
    const zoom = 15;
    const ll = this._parseValue(pos);
    this._setView(ll, zoom);
  }
  _setView(ll, zoom) {
    this.map.setView(ll, zoom);
    if (this.inplat) {
      this.inplat.value = parseFloat(ll[0]).toFixed(5);
      this.inplng.value = parseFloat(ll[1]).toFixed(5);
    }
  }
  get value() {
    const ll = this.map.getCenter();
    return {
      lat: parseFloat(ll.lat).toFixed(5),
      lng: parseFloat(ll.lng).toFixed(5),
    };
  }
}

customElements.define("input-latlng", InputLatLng);

export { InputLatLng };
