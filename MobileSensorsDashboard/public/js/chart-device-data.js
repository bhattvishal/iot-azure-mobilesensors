/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
$(document).ready(() => {
  var dt1 = $("#example").DataTable({
    paging: false,
    //ordering: false,
    //orderFixed: [0, 'asc'],
    searching: false,
    lengthChange: false,
    //displayStart: 5,
  });

  // if deployed to a site supporting SSL, use wss://
  const protocol = document.location.protocol.startsWith("https")
    ? "wss://"
    : "ws://";
  const webSocket = new WebSocket(protocol + location.host);

  // A class for holding the last N points of telemetry for a device
  class DeviceData {
    constructor(deviceId) {
      this.deviceId = deviceId;
      this.maxLen = 50;

      this.firstConnected = 0;
      this.currentIlluminance = 0;
      this.currentTimestamp = 0;

      this.timeData = new Array(this.maxLen);
      this.illuminanceData = new Array(this.maxLen);
    }

    addData(time, illuminance) {
      this.currentTimestamp = time;
      this.currentIlluminance = illuminance;
      this.timeData.push(time);
      this.illuminanceData.push(illuminance);

      if (this.timeData.length > this.maxLen) {
        this.timeData.shift();
        this.illuminanceData.shift();
      }
    }
  }

  // All the devices in the list (those that have been sending telemetry)
  class TrackedDevices {
    constructor() {
      this.devices = [];
    }

    // Find a device based on its Id
    findDevice(deviceId) {
      for (let i = 0; i < this.devices.length; ++i) {
        if (this.devices[i].deviceId === deviceId) {
          return this.devices[i];
        }
      }

      return undefined;
    }

    getDevicesCount() {
      return this.devices.length;
    }
  }

  const trackedDevices = new TrackedDevices();

  // Define the chart axes
  const chartData = {
    datasets: [
      {
        fill: false,
        label: "Illuminance",
        yAxisID: "Illuminance",
        borderColor: "rgba(255, 204, 0, 1)",
        pointBoarderColor: "rgba(255, 204, 0, 1)",
        backgroundColor: "rgba(255, 204, 0, 0.4)",
        pointHoverBackgroundColor: "rgba(255, 204, 0, 1)",
        pointHoverBorderColor: "rgba(255, 204, 0, 1)",
        spanGaps: true,
      },
    ],
  };

  const chartOptions = {
    scales: {
      yAxes: [
        {
          id: "Illuminance",
          type: "linear",
          scaleLabel: {
            labelString: "Illuminance (lux)",
            display: true,
          },
          position: "left",
          ticks: {
            suggestedMin: 0, // minimum will be 0, unless there is a lower value.
            // OR //
            beginAtZero: true, // minimum value will be 0.
          },
        },
      ],
    },
  };

  // Get the context of the canvas element we want to select
  const ctx = document.getElementById("iotChart").getContext("2d");
  const myLineChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: chartOptions,
  });

  // Manage a list of devices in the UI, and update which device data the chart is showing
  // based on selection
  let needsAutoSelect = true;
  const deviceCount = document.getElementById("deviceCount");
  const listOfDevices = document.getElementById("listOfDevices");

  function OnSelectionChange() {
    const device = trackedDevices.findDevice(
      listOfDevices[listOfDevices.selectedIndex].text
    );
    chartData.labels = device.timeData;
    chartData.datasets[0].data = device.illuminanceData;
    myLineChart.update();
  }
  listOfDevices.addEventListener("change", OnSelectionChange, false);

  // When a web socket message arrives:
  // 1. Unpack it
  // 2. Validate it has date/time and illuminance
  // 3. Find or create a cached device to hold the telemetry data
  // 4. Append the telemetry data
  // 5. Update the chart UI
  webSocket.onmessage = function onMessage(message) {
    try {
      const messageData = JSON.parse(message.data);
      console.log(messageData);

      // time and either illuminance are required
      if (!messageData.MessageDate || !messageData.IotData.illuminance) {
        return;
      }

      // find or add device to list of tracked devices
      const existingDeviceData = trackedDevices.findDevice(
        messageData.DeviceId
      );

      // ### UPDATE EXISTING DEVICE DATA ###
      if (existingDeviceData) {
        existingDeviceData.addData(
          messageData.MessageDate,
          messageData.IotData.illuminance
        );

        // Find the row with existing deviceId
        var row = dt1.row(function (idx, data, node) {
          return data[0] === existingDeviceData.deviceId ? true : false;
        });

        var temp = row.data();
        temp[3] = existingDeviceData.currentIlluminance;
        temp[4] = existingDeviceData.currentTimestamp;
        row.data(temp).invalidate();
      }
      // ### CREATE NEW DEVICE DATA ###
      else {
        const newDeviceData = new DeviceData(messageData.DeviceId);
        trackedDevices.devices.push(newDeviceData);
        const numDevices = trackedDevices.getDevicesCount();
        deviceCount.innerText =
          numDevices === 1
            ? `${numDevices} Mobile Connected`
            : `${numDevices} Mobiles Connected`;

        newDeviceData.addData(
          messageData.MessageDate,
          messageData.IotData.illuminance
        );

        newDeviceData.firstConnected = messageData.MessageDate;

        // add device to the UI list
        const node = document.createElement("option");
        const nodeText = document.createTextNode(messageData.DeviceId);
        node.appendChild(nodeText);
        listOfDevices.appendChild(node);

        // START: New Data
        var rowNode = dt1.row
          .add([
            newDeviceData.deviceId,
            messageData.IotData.deviceName,
            newDeviceData.firstConnected,
            newDeviceData.currentIlluminance,
            newDeviceData.currentTimestamp,
          ])
          .draw(false)
          .node();

        $(rowNode)
          .css({ backgroundColor: "green" })
          .animate({ backgroundColor: "white" }, 2500);

        // END: New Data

        // Add new list item
        //$("#deviceList").append('<li class="item float-item">Device1</li>');

        // if this is the first device being discovered, auto-select it
        if (needsAutoSelect) {
          needsAutoSelect = false;
          listOfDevices.selectedIndex = 0;
          OnSelectionChange();
        }
      }

      myLineChart.update();
    } catch (err) {
      console.error(err);
    }
  };
});
