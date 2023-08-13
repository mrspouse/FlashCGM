import clock from "clock";
import { preferences } from "user-settings";
import * as util from "../common/utils";

let handleCallback;

export function initialize(granularity, callback) {
  clock.granularity = granularity ? granularity : "seconds";
  handleCallback = callback;
  clock.addEventListener("tick", tick);
}

export function tick(evt) {
  const today = evt ? evt.date : new Date();
  const mins = util.zeroPad(today.getMinutes());
  let hours = today.getHours();

  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = util.zeroPad(hours);
  }

  if (typeof handleCallback === "function") {
    handleCallback({ time: `${hours}:${mins}` });
  }
}

// Update the <text> element with the current time
export function updateClock() {
  let lang = locale.language;
  let today = new Date();
  let day = util.zeroPad(today.getDate());
  let wday = today.getDay();
  let month = util.zeroPad(today.getMonth() + 1);
  let year = today.getFullYear();
  //  let hours = util.zeroPad(util.formatHour(today.getHours(), clockPref));
  let hours = util.formatHour(today.getHours(), clockPref);
  let mins = util.zeroPad(today.getMinutes());
  let prefix = lang.substring(0, 2);
  if (typeof util.weekday[prefix] === 'undefined') {
    prefix = 'en';
  }
  let divide = " ";
  if (prefix == 'de') {
    divide = ".";
  } else if (prefix == "nl" || prefix == "ko") {
    divide = "-"
  }
  let datestring = day + divide + month + divide + year;
  myClock.text = `${hours}:${mins}`;
  if (dateFormat === 'YMD') {
    datestring = year + divide + month + divide + day;
    myDate.text = `${datestring}`;
  }
  else if (dateFormat === 'MDY') {
    var namemonth = new Array();
    namemonth[0] = "Jan";
    namemonth[1] = "Feb";
    namemonth[2] = "Mar";
    namemonth[3] = "Apr";
    namemonth[4] = "May";
    namemonth[5] = "Jun";
    namemonth[6] = "Jul";
    namemonth[7] = "Aug";
    namemonth[8] = "Sep";
    namemonth[9] = "Oct";
    namemonth[10] = "Nov";
    namemonth[11] = "Dec";
    month = namemonth[today.getMonth()];
    datestring = month + " " + day + " " + year;
    myDate.text = `${datestring}`;
  }
  else { myDate.text = `${datestring}`; }


  updateStats();
  if ((Date.now() - lastValueTimestamp) / 1000 > 5) {
    currentheart.text = "--";
    heartRing.sweepAngle = 0;
  }

}

// Update the clock every tick event
clock.tick = () => updateClock();

