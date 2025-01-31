import { settingsStorage } from "settings";
import * as messaging from "messaging";
import { me } from "companion";

//let bgDataType = JSON.parse(settingsStorage.getItem("dataType"));
var bgDataType = "mg/dl";
var sendSettings = true;

var bgDataUnits = "mg/dl";
var bgHighLevel = 0;
var bgLowLevel = 0;
var bgTargetTop = 0;
var bgTargetBottom = 0;
var bgTrend = "Flat";
var rightSnooze = 300;
var leftSnooze = 14400;

var points = [220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220];
var currentTimestamp = Math.round(new Date().getTime() / 1000);
var lastTimestamp = 0;
var nsToggle;
var dataSource;
var dataToken;
var dataUrl;
var settingsUrl;
var lastSettingsUpdate = 0;
var dateFormat = JSON.stringify(settingsStorage.getItem("dateFormat"));

messaging.peerSocket.onopen = () => {
  // console.log("Companion Socket Open");
}

messaging.peerSocket.close = () => {
  // console.log("Companion Socket Closed");
}

const dataPoll = () => {
  nsToggle = JSON.parse(settingsStorage.getItem("nightscoutToggle"));
  console.log("nsToggle:" + nsToggle);
  if (nsToggle) {
    dataUrl = JSON.parse(settingsStorage.getItem("dataSourceURL")).name 
    + "/api/v1/entries/sgv.json";
    console.log(dataUrl);
    // dataToken = JSON.parse(settingsStorage.getItem("dataToken")).name;
    // dataUrl = dataUrl + "&token=" + dataToken;
  } else {
    dataSource = JSON.parse(settingsStorage.getItem("dataSource")).name;
    if (dataSource == "xdrip") {
      dataUrl = "http://127.0.0.1:17580/sgv.json";
      console.log(dataUrl);
    } else {
      if (dataSource == "spike") {
        dataUrl = "http://127.0.0.1:1979/api/v1/sgv.json";
        console.log(dataUrl);
      }
    }
  }

  console.log('Open Data API CONNECTION');
  if (dataUrl) {
    dataUrl = dataUrl + "?count=48&brief_mode=Y";
    fetch(dataUrl, {
      method: 'GET',
      mode: 'cors',
      headers: new Headers({
        "Content-Type": 'application/json; charset=utf-8'
      })
    })
      .then(response => {
        // console.log('Get Data From Phone');
        response.text().then(data => {
          console.log('fetched Data from API');
          let obj = JSON.parse(data);
          let returnval = buildGraphData(data);
        })
          .catch(responseParsingError => {
            // console.log("Response parsing error in data!");
            // console.log(responseParsingError.name);
            // console.log(responseParsingError.message);
            // console.log(responseParsingError.toString());
            // console.log(responseParsingError.stack);
          });
      }).catch(fetchError => {
        // console.log("Fetch Error in data!");
        // console.log(fetchError.name);
        // console.log(fetchError.message);
        // console.log(fetchError.toString());
        // console.log(fetchError.stack);
      })
  } else {
    console.log('no url stored in settings to use to get data.');
  }
  return true;
};

function buildSettings() {
  // Need to setup High line, Low Line, Units, Snooze.
  console.log("buildSettings() called");

  var dF = JSON.parse(settingsStorage.getItem("dateFormat")).values;
  dateFormat = JSON.stringify(dF[0].value).replace(/^"(.*)"$/, '$1');
  console.log("DateFormat: " + dateFormat);

  var Units = JSON.parse(settingsStorage.getItem("bgDataUnits")).values;
  bgDataUnits = JSON.stringify(Units[0].value).replace(/^"(.*)"$/, '$1');
  console.log("bgDataUnits: " + bgDataUnits);

  var Low = JSON.parse(settingsStorage.getItem("bgLowLevel")).name;
  bgLowLevel = JSON.stringify(Low).replace(/^"(.*)"$/, '$1');
  if (bgDataUnits === "mmol") { bgLowLevel = bgLowLevel * 18; }
  console.log("bgLowLevel: " + bgLowLevel);

  var High = JSON.parse(settingsStorage.getItem("bgHighLevel")).name;
  bgHighLevel = JSON.stringify(High).replace(/^"(.*)"$/, '$1');
  if (bgDataUnits === "mmol") { bgHighLevel = bgHighLevel * 18; }
  console.log("bgHighLevel: " + bgHighLevel);

  var rS = JSON.parse(settingsStorage.getItem("alertRightSnooze")).name;
  rightSnooze = JSON.stringify(rS).replace(/^"(.*)"$/, '$1');
  rightSnooze = rightSnooze * 60;
  console.log("shortSnooze: " + rightSnooze);

  var lS = JSON.parse(settingsStorage.getItem("alertLeftSnooze")).name;
  leftSnooze = JSON.stringify(lS).replace(/^"(.*)"$/, '$1');
  leftSnooze = leftSnooze * 60;
  console.log("leftSnooze: " + leftSnooze);


  const messageContent = {
    "settings": {
      "bgDataUnits": bgDataUnits,
      "bgHighLevel": bgHighLevel,
      "bgLowLevel": bgLowLevel,
      "dateFormat": dateFormat,
      "rightSnooze": rightSnooze,
      "leftSnooze": leftSnooze
    },
  }; // end of messageContent
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    console.log("companion - sending settings");
    messaging.peerSocket.send(messageContent);
  } else {
    console.log("companion - no connection");
    me.wakeInterval = 200;
    setTimeout(function () { messaging.peerSocket.send(messageContent); }, 2500);
    me.wakeInterval = undefined;
  }
  return true;
}

function buildGraphData(data) {
  // Take the data in, move a step at a time from most recent back.
  // look at timestamps to determine if a missed poll happened and make that graph point disappear.
  let obj = JSON.parse(data);
  let graphpointindex = 0;
  var runningTimestamp = new Date().getTime();
  var indexarray = [];
  let bgdelta = 0;

  // build the index
  obj.sort(function (a, b) {
    return b.date - a.date
  })

  let index = 0;
  let validTimeStamp = false;
  // console.log(JSON.stringify(obj));
  for (graphpointindex = 0; graphpointindex < 48; graphpointindex++) {
    if (index < obj.length) {
      while (((runningTimestamp - obj[index].date) >= 305000) && (graphpointindex < 48)) {
        points[graphpointindex] = undefined;
        runningTimestamp = runningTimestamp - 300000;
        graphpointindex++;
      }
      if (graphpointindex < 48) {
        points[graphpointindex] = obj[index].sgv;
        runningTimestamp = obj[index].date;
      }
      if (!validTimeStamp) {
        lastTimestamp = obj[index].date;
        bgTrend = obj[index].direction;
        bgdelta = obj[index].delta / 300000;
        validTimeStamp = true;
      }
    }
    index++
  }
  lastTimestamp = parseInt(lastTimestamp / 1000, 10);
  var flippedPoints = points.reverse();
  const messageContent = {
    "bgdata": {
      "graphData": flippedPoints,
      "lastPollTime": lastTimestamp,
      "currentTrend": bgTrend,
      "delta": bgdelta
    }
  };
  console.log(JSON.stringify(messageContent));
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(messageContent);
  } else {
    // console.log("companion - no connection");
    me.wakeInterval = 2000;
    setTimeout(function () { messaging.peerSocket.send(messageContent); }, 2500);
    me.wakeInterval = undefined;
  }
  return true;
}

function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {

    let key = settingsStorage.key(index);
    let data = {
      key: key,
      newValue: settingsStorage.getItem(key),
      dataType: true
    };

    if (key === "nsToggle") {
      // console.log("nsToggle: " + JSON.parse(settingsStorage.getItem(key)));
      nsToggle = JSON.parse(settingsStorage.getItem(key));
    } else if (key === "dataSource") {
      // console.log("DataSource: " + JSON.parse(settingsStorage.getItem(key)).name);
      dataSource = JSON.parse(settingsStorage.getItem(key)).name;
    } else if (key === "dataSourceURL") {
      // console.log("DataSourceURL: " + JSON.parse(settingsStorage.getItem(key)).name);
      dataUrl = JSON.parse(settingsStorage.getItem(key)).name;
    } else if (key === "dataToken") {
      // console.log("DataToken: " + JSON.parse(settingsStorage.getItem(key)).name);
      dataToken = JSON.parse(settingsStorage.getItem(key)).name;
    } else if (key === "settingsSourceURL") {
      // console.log("SettingsURL: " + JSON.parse(settingsStorage.getItem(key)).name);
      settingsUrl = JSON.parse(settingsStorage.getItem(key)).name;
    } else if (key === "unitsType") {
      // console.log("UnitsType: " + JSON.parse(settingsStorage.getItem(key)));
      bgDataType = JSON.parse(settingsStorage.getItem(key));
    }
  }
}

settingsStorage.onchange = function (evt) {
  restoreSettings();
  if (evt.key === "theme") {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      var data = JSON.parse(evt.newValue);
      var messageContent = {
        "theme":
          data["values"][0].value
      };
      messaging.peerSocket.send(messageContent);
      // console.log("Sent Theme to watch:" + JSON.stringify(messageContent));
    } else {
      // console.log("companion - no connection");
      me.wakeInterval = 2000;
      setTimeout(function () { var data = JSON.parse(evt.newValue); var messageContent = { "theme": [data["values"][0].value] }; messaging.peerSocket.send(messageContent); }, 2500);
      me.wakeInterval = undefined;
    }
  }
  if (evt.key === "dateFormat") {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      var data = JSON.parse(evt.newValue);
      // console.log("field:" + data["values"][0].value);
      //settingsStorage.getItem("dateFormat") //.replace(/^"(.*)"$/, '$1')
      var messageContent = {
        "dateFormat": data["values"][0].value
      };
      messaging.peerSocket.send(messageContent);
      // console.log("Sent DateFormat to watch:" + JSON.stringify(messageContent));
    } else {
      // console.log("companion - no connection");
      me.wakeInterval = 2000;
      setTimeout(function () { var messageContent = { "bgDisplayColor": settingsStorage.getItem("bgDisplayColor") }; messaging.peerSocket.send(messageContent); }, 2500);
      me.wakeInterval = undefined;
    }
  }
}

messaging.peerSocket.onmessage = function (evt) {
  // console.log(JSON.stringify(evt.data));
  if (evt.data.hasOwnProperty("RequestType")) {
    if (evt.data.RequestType === "Settings") {
      // console.log("I've been asked for settings.");
      buildSettings();
    }
    if (evt.data.RequestType === "Data") {
      // console.log("I've been asked for data.");
      dataPoll();
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// var value = settingsPoll(dataPoll);
//setInterval(processDisplayData, 75000); // Run every 2.5 min.