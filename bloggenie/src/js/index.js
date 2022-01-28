import { generateName } from "./generateName.js";
import { loadCap, loadRaw } from "./loadfile.js";
import { seed, random } from "./rand.js";
import { load } from "./fp.js";
import { caption } from "./caption.js";
import {
  shortenHash,
  loadFonts,
  getTimeOfDay,
  getWeekday,
  makeElement,
} from "./utils.js";
import { generateText } from "./generateText.js";

const seedInput = document.getElementById("seed");

const textElement = document.getElementById("cap_text");
const caps = ["White5", "Hispanic4", "Asian1", "White1", "Indian2"];

window.reset = () => localStorage.removeItem("generated");

seed("");
const update = async e => {
  localStorage.setItem("seed", seedInput.value);
  seed(seedInput.value);
  const selected = caps[random(caps.length)];
  const base = await loadRaw("data/base.txt");
  let cap = await loadCap("data/caps/" + selected + ".txt");
  cap.seed = seedInput.value;

  //Load possible curses
  const curses = await loadRaw("data/curses.txt");

  cap = Object.assign({}, base, curses, cap);
  console.log(cap, selected);

  cap = await generateName(cap);

  caption(cap);
  localStorage.setItem("generated", Date.now());
};
seedInput.addEventListener("input", update);
loadRaw("data/caps/Asian1.txt");

function showIntro(interactive = true) {
  const intro = {
    intro:
      "It's another <@getWeekday> <@getTimeOfDay> and you find yourself sitting in front of your computer and spending time looking through your favorite caption site as a button plops up.",
    [Symbol.for("cap.functions")]: {
      getTimeOfDay,
      getWeekday,
    },
  };
  const intro_2 = `Suddenly a pop-up opens, inside you see what could only be described as a stereotypical "gamer girl". You thought at first that it was an image, but soon she starts moving and a voice is coming out of your speakers:
  "Again? This is the third time in 30 minutes. You know, I don't like being interrupted in my game..." She seems distracted for a moment before she diverts her attention back to you. Angrily she shouts: "See, now I lost my game thanks to you! And my ELO is down so much from before! I'm going to make you pay for that! See, I'm actually a genie - but not like in this ridiculous fairytale that's still making the rounds. I can grant wishes... but I don't have to. And like you just messed with my game, I'm gonna mess with you big time, I'll make sure you're never going to forget this!" She pauses for a moment.
  "What the fuck is going on here?" you think, taken aback by what you just witnessed. You try to pause the pop-up, but it's not working. "Oh I know!", the girl exclaims, "I have a plan for you. Oh you'll be so sorry... and I even threw in a special surprise just for you." While she is saying that you notice your screen beginning to glow.`;

  const continue_btn = makeElement("a", "Continue...");

  continue_btn.addEventListener("click", () => {
    continue_btn.parentElement.removeChild(continue_btn);
    update();
  });
  textElement.appendChild(makeElement("div", generateText(intro, "intro")));
  textElement.appendChild(makeElement("div", intro_2));
  if (interactive) textElement.appendChild(continue_btn);
}

async function run(f) {
  await loadFonts();
  if (localStorage.getItem("seed"))
    seedInput.value = localStorage.getItem("seed");
  else {
    const fingerprint = await (await load()).get();
    seedInput.value = shortenHash(fingerprint.visitorId);
  }
  if (localStorage.getItem("generated")) {
    showIntro(false);
    update();
  } else showIntro();
  //update();
}

run();
