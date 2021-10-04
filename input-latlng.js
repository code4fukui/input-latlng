import L from "https://code4sabae.github.io/leaflet-mjs/leaflet.mjs";
import { Geo3x3 } from "https://geo3x3.com/Geo3x3.js";

const getMapLink = (ll) => {
  const link = "https://www.google.com/maps/dir/?api=1&destination=" + ll[0] + "," + ll[1];
  return link;
};

class InputLatLng extends HTMLElement {
  constructor (lat, lng) {
    super();
    this.lat = lat || 35;
    this.lng = lng || 135;

    const grayscale = this.getAttribute("grayscale");

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://code4sabae.github.io/leaflet-mjs/" + (grayscale ? "leaflet-grayscale.css" : "leaflet.css");
    this.appendChild(link);
    const div = this.div = document.createElement("div");
    this.appendChild(this.div);

    const map = L.map(div);
    this.map = map;
    // set 国土地理院地図 https://maps.gsi.go.jp/development/ichiran.html
    L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
      attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>"',
      maxZoom: 18,
    }).addTo(map);

    link.onload = () => this.init();
  }
  async init () {
    const div = this.div;
    const map = this.map;
    div.style.width = this.getAttribute("width") || "100%";
    div.style.height = this.getAttribute("height") || "60vh";

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
      crosshair.setLatLng(map.getCenter());
      if (this.onchange) {
        this.onchange();
      }
    });
  }
  set value(pos) {
    const zoom = 15;
    if (typeof pos == "string") {
      const ll = Geo3x3.decode(pos);
      if (ll) {
        this.map.setView([ll.lat, ll.lng], zoom);
        return;
      }
      const ll2 = ll.split(",");
      if (ll2.length >= 2) {
        this.map.setView([ll2[0], ll2[1]], zoom);
        return;
      }
      console.log("not supported format: " + pos);
    } else if (Array.isArray(pos)) {
      this.map.setView([pos[0], pos[1]], zoom);
    } else {
      this.map.setView([pos.lat, pos.lng], zoom);
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
