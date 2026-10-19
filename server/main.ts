import { init } from "./models/db.ts";
import { startWps2PdfProbe } from "./api/wps2pdfProbe.ts";

init();
startWps2PdfProbe();
import "./nodeAdapter.ts";
