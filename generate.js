import {openFile, parseSocFile} from "srb2kartjs";
import {readFile, opendir, writeFile, open} from "fs/promises";
import {basename, extname} from "path";

async function mappack(packname) {
  const dir = await opendir("mapfiles")
  for await (let dirent of dir) {
    if(dirent.name.search(packname) != -1)
      return `mapfiles/${dirent.name}`;
  }
}

await Promise.all(
  process.argv.slice(2).map(async socdifffilename => {
    const mappackname = basename(socdifffilename, extname(socdifffilename));
    const mapfile = await mappack(mappackname);

    const socdiff = readFile(socdifffilename, "utf-8")
    .then(socdiff => parseSocFile(null, socdiff, {}))
    .then(soc => soc.level)
    .then(level => {
      for (let id in level) {
        if (!level.hasOwnProperty(id)) continue;
        delete level[id].mappack;
      }
      return level;
    })

    const soc = openFile(mapfile)
      .then(file => file.getAllSocs())
      .then(soc => soc.level)
      .catch(() => console.log(socdifffilename));

    const updatedsoc = await Promise.all([socdiff, soc])
    .then(([socdiff, soc]) => {
      for (let id in soc) {
        if (!soc.hasOwnProperty(id)) continue;
        if (!socdiff.hasOwnProperty(id)) continue;
        for(let key in socdiff[id]) {
          soc[id][key] = socdiff[id][key];
        }
      }
      return soc;
    });

    const outsoc = await open(`outsoc/${mappackname}.soc`, "w");

    for (let id in updatedsoc) {
      if (!updatedsoc.hasOwnProperty(id)) continue;
      await outsoc.write(`LEVEL ${id}\n`);
      for(let key in updatedsoc[id]) {
        if (!updatedsoc[id].hasOwnProperty(key)) continue;
        await outsoc.write(`${key} = ${updatedsoc[id][key]}\n`);
      }
      await outsoc.write("\n");
    }
    outsoc.close();
  })
);

