import { random } from "./rand.js";

const searchRegex = /<([\w /.^@]+)>/;

const replace = (cap, str) => {
  const res = searchRegex.exec(str);
  //No <something> found
  if (!res) return str;
  const toReplace = "<" + res[1] + ">";
  str = str.replace(toReplace, generateText(cap, res[1]));
  return replace(cap, str);
};
export const generateText = (cap, key) => {
  let val = "";
  //function call
  if (key.startsWith("@")) {
    const availableFunctions = cap[Symbol.for("cap.functions")];
    key = key.slice(1);
    const parts = key.split(" ");
    console.log(availableFunctions, parts, availableFunctions[parts[0]]);
    if (availableFunctions && availableFunctions[parts[0]]) {
      const repl = availableFunctions[parts[0]].call(null, parts.slice(1));
      return replace(cap, repl);
    }
  }
  //Random call
  if (key.endsWith("^")) {
    key = key.slice(0, -1);
    const names = Object.getOwnPropertyNames(cap).filter(name =>
      name.startsWith(key)
    );
    val = cap[names[random(names.length)]];
  } else {
    val = cap[key] || "";
  }
  return replace(cap, val);
};
