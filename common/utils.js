// Add zero in front of numbers < 10
export function zeroPad(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

// Add a dot between hundreds and thousands
export function thsdDot(num) {
  var retString = num;
  if ( num > 999 ) {
    let dotFill = "";
    let hundreds = num-Math.floor(num/1000)*1000;
    if ( hundreds < 10 ) {
      dotFill ="00";
    } else if ( hundreds < 100 ) {
      dotFill = "0";
    }
    retString = Math.floor(num/1000) + dotFill + hundreds;
  }
  return retString;
}

// Simulate mono-fonts
export function monoDigits(digits) {
  var ret = "";
  var str = digits.toString();
  for (var index = 0; index < str.length; index++ ) {
    var num = str.charAt(index);
    ret = ret.concat(hex2a("0x1" + num));
  }
  return ret;
}

export function hex2a(hex) {
  var str = "";
  for (var index = 0; index < hex.length; index += 2 ) {
    var val = parseInt(hex.substr(index, 2), 16);
    if (val) str += String.fromCharCode(val);
  }
  return str.toString();
}

//Formats the hour based on the user pref
export function formatHour(hour, clockPref) {
  if (clockPref == '12h'){
    if(hour > 12) {
      hour -= 12;
    } else if(hour == 0) {
      hour = "12";
    }
  }
  return hour;
}

export function hexcolor(colString) {
  var correct = true;
  let newString = colString.match(/#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]/i);
  if ( newString == null || newString[0].length != 7){
    console.log(newString + " not correct, length: " + newString[0].length);
    correct = false;
  }
  return correct;
}

//Localisation for Day and Month; the switch seems to be slower than the array...
export var weekday = {
	de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
	da: ["sø", "ma", "ti", "on", "to", "fr", "lø"],
	en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
	es: ["do", "lu", "ma", "mi", "ju", "vi", "sá"],
	fr: ["di", "lu", "ma", "me", "je", "ve", "sa"],
	nl: ["zo", "ma", "di", "wo", "do", "vr", "za"],
	it: ["do", "lu", "ma", "me", "gi", "ve", "sa"],
	pt: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
	pl: ["N", "Pn", "Wt", "Śr", "Cz", "Pt", "So"],
  sv: ["sö", "må", "ti", "on", "to", "fr", "lö"],
  ja: ["日", "月", "火", "水", "木", "金", "土"],
  ko: ["일", "월", "화", "수", "목", "금", "토"],
  zh: ["日", "一", "二", "三", "四", "五", "六"]
};

// Remove all quotation marks from a string
export function stripQuotes(str) {
  return str ? str.replace(/"/g, "") : "";
}

export function getDistance(dist,units) {
  let val = (dist || 0) / 1000;
  let u = " km";
  if(units === "us") {
    val *= 0.621371;
    u = " mi";
  }
  return {
    // lbl:`${val.toFixed(1)}${u}`
    lbl:`${val.toFixed(1)}`
  }
}

export function dhm(t){
  var cd = 24 * 60 * 60 * 1000,
      ch = 60 * 60 * 1000,
      d = Math.floor(t / cd),
      h = Math.floor( (t - d * cd) / ch),
      m = Math.round( (t - d * cd - h * ch) / 60000),
      pad = function(n){ return n < 10 ? '0' + n : n; };
if( m === 60 ){
  h++;
  m = 0;
}
if( h === 24 ){
  d++;
  h = 0;
}
// return [d, pad(h), pad(m)].join(':');
return [d+'d'+h+'h'];
}
