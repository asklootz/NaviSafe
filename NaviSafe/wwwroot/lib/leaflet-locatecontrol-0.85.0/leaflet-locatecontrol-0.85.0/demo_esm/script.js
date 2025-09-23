import { Map, TileLayer } from "leaflet";
import { LocateControl } from "../dist/L.Control.Locate.esm.js";

const osmUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const osmAttrib = 'Map data © <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
let osm = new TileLayer(osmUrl, {
  attribution: osmAttrib,
  detectRetina: true
});

let map = new Map("map", {
  layers: [osm],
  center: [51.505, -0.09],
  zoom: 10,
  zoomControl: true
});

let lc = new LocateControl({
  strings: {
    title: "Show me where I am, yo!"
  }
}).addTo(map);
