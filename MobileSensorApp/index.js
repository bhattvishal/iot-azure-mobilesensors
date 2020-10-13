// index.js

const path = require("path");
const express = require("express");
const app = express();
const { EventHubProducerClient } = require("@azure/event-hubs");

const port = process.env.PORT || "3001";
const eventHubNSConnectionString = "<EVENT_HUB_CONNECTION_STRING>";
const eventHubName = "<EVENT_HUB_NAME>";

var isConnected = false;

async function sendEvent(eventData) {
  const producerClient = new EventHubProducerClient(
    eventHubNSConnectionString,
    eventHubName
  );

  const eventDataBatch = await producerClient.createBatch();

  // var payload = {
  //   illuminance: 60 + Math.floor(Math.random() * 200),
  //   deviceId: "Bhatt, Vishal",
  // };
  var payload = {
    illuminance: eventData.payload.illuminance,
    deviceName: eventData.payload.deviceName,
  };
  console.log(`Sending Data ${JSON.stringify(payload)}`);
  eventDataBatch.tryAdd({
    body: payload,
    properties: {
      deviceId: eventData.payload.deviceId,
    },
  });
  await producerClient.sendBatch(eventDataBatch);
  await producerClient.close();
}

//main();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
  onDisconnected();
  //clearInterval(intervalLoop);
});

app.get("/error", (req, res) => {
  onDisconnected();
  res.render("error", {
    error: "What's the error",
  });
});

app.post("/data", (req, res) => {
  if (isConnected) {
    sendEvent(req.body);
  }
  res.send(req.body);
});

app.post("/sensor", (req, res) => {
  try {
    if (req.body.deviceName_field && req.body.deviceId_field) {
      onConnected();
      res.render("sensor", {
        title: "Ambient Sensor",
        userProfile: { nickname: req.body.deviceName_field },
      });
    } else {
      console.error("Device Id and Name are not provided");
      res.render("error", {
        error: "Device Id and Name are not provided",
      });
    }
  } catch (e) {
    console.error(e);
    res.render("error", {
      error: e,
    });
  }
});

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});

function onConnected() {
  isConnected = true;
  console.info("## CONNECTED TO IOT HUB ##");
}

function onDisconnected() {
  isConnected = false;
  console.info("## DISCONNECTED TO IOT HUB ##");
}
