import { init } from "./models/db.ts";
import { migrate } from "./models/migrate.ts";

init();
migrate();
import "./nodeAdapter.ts";
