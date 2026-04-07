import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
function readAllFiles(dirPath: string) {
  console.log("Reading directory:", dirPath);
  // 读取目录中的内容
  readdirSync(dirPath).forEach((file) => {
    const fullPath = join(dirPath, file);
    const fileStats = statSync(fullPath);
    if (fileStats.isDirectory()) {
      // 如果是目录，递归调用 readAllFiles
      readAllFiles(fullPath);
    } else {
      // 如果是文件，将文件路径和状态添加到 map 中
      // staticFiles["/" + relative("./www", fullPath)] = [
      //   ...readFileSync(fullPath, {}),
      // ];
    }
  });
}

readAllFiles("./");

