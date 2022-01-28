const lineRegex = /^([\w ]+): ?(.+)$/;
export async function loadRaw(filename) {
  const contents = (await fetch(filename).then(r => r.text())).split("\n");
  let ret = {};

  let parsingBlock = false;
  let comment = false;
  let blockParseKey;
  let blockParseBuffer = [];

  for (let pos = 0; pos < contents.length; pos++) {
    let line = contents[pos];
    if (line.startsWith("//")) continue;
    if (line.startsWith("/*")) comment = true;
    else if (line.startsWith("*/")) comment = false;
    else if (comment) continue;
    else if (parsingBlock) {
      //Block end
      if (line.startsWith("===")) {
        ret[blockParseKey] = blockParseBuffer.join("\n");
        blockParseBuffer = [];
        parsingBlock = false;
        continue;
      }
      //In Block
      blockParseBuffer.push(line);
    } else if (line.startsWith("#")) {
      blockParseKey = line.slice(1);
      parsingBlock = true;
    } else {
      const regexRes = lineRegex.exec(line);
      if (!regexRes) continue;
      //ret[key] = content
      ret[regexRes[1]] = regexRes[2];
    }
  }
  return ret;
}

export async function loadCap(filename) {
  //TODO maybe validation
  return await loadRaw(filename);
}
