import { init, PrintTask, PrintFile } from "./models/index.ts";
import { logger } from "./logger.ts";

// PrintTask.insert([{
//     'printerId': 0,
//     'state': 'waiting_confirmation',
//     'userId': 0
// }])
// PrintFile.insert([{
//     'printTaskId': 0,
//     fileId: "a.pdf",
//     'duplex': true,
//     'tumble': true,
//     'state': 'waiting_print'
// }])
// console.log(PrintTask.findBy({}))
init();
import "./nodeAdapter.ts";
