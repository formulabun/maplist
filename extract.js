import {openFile} from "srb2kartjs";
import {writeFile} from "fs/promises";
import {basename, extname} from "path";


await Promise.all(
  process.argv.slice(2).map(filename => {
    openFile(filename)
      .then(file => file.getAllSocs())
      .then(soc => soc.level)
      .then(levels => {
        const diffs = [];
        for (let id in levels) {
          diffs.push(`LEVEL ${id.toUpperCase()}`);
        }
        diffs.sort();
        return diffs;
      })
      .then(levelheaders => {
        const base = basename(filename, extname(filename));
        let packname = base.split("_")[1];
        if(extname(filename) === ".kart") packname = base;
        return writeFile(`socdiffs/${packname}.socdiff`, levelheaders.join("\n\n"));
      })
  })
);
