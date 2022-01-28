import { random } from "./rand.js";

async function selectRandomLine(filename) {
  const lines = (await fetch(filename).then(r => r.text())).split("\n");
  return lines[random(lines.length)];
}

const nameMap = {
  asian: "asian",
  hispanic: "hispanic",
  indian: "indian",
};

export async function generateName(cap) {
  //for example only indian names
  if (cap["filter first name"]) {
    cap.firstname = await selectRandomLine(
      "data/names/firstnames_" + cap["filter first name"] + ".txt"
    );
  } else {
    //Generic English names
    cap.firstname = await selectRandomLine("data/names/firstnames.txt");
  }

  cap.lastname = await selectRandomLine(
    "data/names/lastnames" +
      (nameMap[cap.ethnicity] ? "_" + nameMap[cap.ethnicity] : "") +
      ".txt"
  );
  cap.fullname = cap.firstname + " " + cap.lastname;
  return cap;
}
