export const base_dir = "data";
export function loadImage(filename) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = base_dir + "/img/" + filename;
    image.addEventListener("load", () => {
      resolve(image);
    });
  });
}

export async function loadFonts() {
  const Nunito400 = new FontFace(
    "Nunito",
    "url(https://fonts.gstatic.com/s/nunito/v20/XRXI3I6Li01BKofiOc5wtlZ2di8HDOUhdTQ3jw.woff2)",
    { weight: "400" }
  );
  const Nunito800 = new FontFace(
    "Nunito",
    "url(https://fonts.gstatic.com/s/nunito/v20/XRXI3I6Li01BKofiOc5wtlZ2di8HDDsmdTQ3jw.woff2)",
    { weight: "800" }
  );
  const RSlab300 = new FontFace(
    "Roboto Slab",
    "url(https://fonts.gstatic.com/s/robotoslab/v16/BngbUXZYTXPIvIBgJJSb6s3BzlRRfKOFbvjo0oSmb2Rj.woff2)",
    { weight: "300" }
  );
  const RSlab400 = new FontFace(
    "Roboto Slab",
    "url(https://fonts.gstatic.com/s/robotoslab/v16/BngbUXZYTXPIvIBgJJSb6s3BzlRRfKOFbvjojISmb2Rj.woff2)",
    { weight: "400" }
  );
  const RSlab600 = new FontFace(
    "Roboto Slab",
    "url(https://fonts.gstatic.com/s/robotoslab/v16/BngbUXZYTXPIvIBgJJSb6s3BzlRRfKOFbvjoUoOmb2Rj.woff2)",
    { weight: "600" }
  );
  const fonts = [Nunito400, Nunito800, RSlab300, RSlab400, RSlab600];
  await Promise.all(fonts.map(font => font.load()));
  fonts.forEach(font => document.fonts.add(font));
}

const days = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
/**
 *  @type {() => string}
 */
export const getWeekday = () => {
  //0 => sunday, 6 => saturday
  const day = new Date().getDay();
  return days[day];
};

/**
 *  @type {() => string}
 */
export const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 5) return "night";
  if (hour < 8) return "early morning";
  if (hour < 13) return "morning";
  if (hour < 15) return "noon";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
};

/**
 * @param {string} tagName
 * @param {string | HTMLElement | HTMLElement[]} content
 * @returns {HTMLElement}
 */
export const makeElement = (tagName, content) => {
  const el = document.createElement(tagName);
  if (typeof content === "string") {
    el.innerHTML = convertNewLinesToBreaks(content);
  } else if (Array.isArray(content)) {
    content.forEach(e => el.appendChild(e));
  } else {
    content.appendChild(content);
  }
  return el;
};

/**
 * @param {string} str
 * @returns {string}
 */
export const shortenHash = str => {
  return str.slice(0, 7).toUpperCase();
};

export const convertNewLinesToBreaks = str => str.replaceAll(/\n/g, "<br>");
