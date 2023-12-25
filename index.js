import {
  DataReportMode,
  EventReportBytes,
  EventReportLookup,
  IRDataType,
  IRSensitivity,
} from "./src/const.js";
import { extensionHtmlSetup } from "./src/extension.js";
import WIIMote from "./src/wiimote.js";

let requestButton = document.getElementById("request-hid-device");

/**
 * @type WIIMote
 * Wii remote variable
 */
var wiiMote = undefined;

function setButton(elementId, action) {
  document.getElementById(elementId).addEventListener("click", async () => {
    action();
  });
}

requestButton.addEventListener("click", async () => {
  let device;
  try {
    const devices = await navigator.hid.requestDevice({
      filters: [{ vendorId: 0x057e }],
    });

    device = devices[0];
    wiiMote = new WIIMote(device);

    window.wm = wiiMote;

    // MotionPlus check support
    // setInterval(() => wiiMote.checkWiiMotionPlus(), 8000);

    wiiMote.listenerEnabled = true;
    wiiMote.ExtensionListener = (ext) => {
      console.log("extension:", ext);
      document.getElementById("extensionType").innerText = ext.name;

      // Make sure to enable extension mode
      if (ext["dataTrackingMode"] !== undefined) {
        wiiMote.setDataTracking(ext["dataTrackingMode"]);
      } else {
        // Use default extension tracking
        wiiMote.setDataTracking(DataReportMode.CORE_BUTTONS_ACCEL_IR_EXTENSION);
      }

      if (ext["extHandler"] !== undefined) {
        wiiMote.EXTDecoder = ext.extHandler;
      } else {
        wiiMote.EXTDecoder = null;
      }

      if (ext.extensionId === "None" || ext.extensionId === "Error") {
        // revert reading mode
        wiiMote.setDataTracking(DataReportMode.CORE_BUTTONS_ACCEL_IR);
        // return;
      }

      extensionHtmlSetup(ext, wiiMote);
    };
  } catch (error) {
    console.log("An error occurred.", error);
  }

  if (!device) {
    console.log("No device was selected.");
  } else {
    console.log(`HID: ${device.productName}`);

    enableControls();
    initCanvas();
  }
});

function initButtons() {
  setButton("rumble", () => wiiMote.toggleRumble());

  setButton("irextended", () => wiiMote.initiateIR(IRDataType.EXTENDED));

  setButton("irbasic", () => wiiMote.initiateIR(IRDataType.BASIC));

  setButton("irfull", () => wiiMote.initiateIR(IRDataType.FULL));

  setButton("DRMcoreBtns", () => wiiMote.setDataTracking(DataReportMode.CORE_BUTTONS));

  setButton("DRMcoreBtnsACC", () => wiiMote.setDataTracking(DataReportMode.CORE_BUTTONS_AND_ACCEL));

  setButton("DRMcoreBtnsACCIR", () =>
    wiiMote.setDataTracking(DataReportMode.CORE_BUTTONS_ACCEL_IR)
  );

  setButton("DRMcoreBtnsACCIREXT", () =>
    wiiMote.setDataTracking(DataReportMode.CORE_BUTTONS_ACCEL_IR_EXTENSION)
  );

  setButton("DRMextensionOnly", () => wiiMote.setDataTracking(DataReportMode.ONLY_EXTENSION_BYTES));

  setButton("statusReport", () => wiiMote.requestStatusInfo());
  setButton("clearEvents", () => (document.getElementById("miscMessageListBox").innerHTML = ""));

  setButton("getExtension", async () => {
    const data = await wiiMote.getExtensionType();

    console.log(data);

    document.getElementById("extensionType").innerText = data.name;
  });

  // setButton("extModeNone", () => wiimote.setDataTracking(DataReportMode.CORE_BUTTONS_ACCEL_IR));

  // setButton("extModeWMP", () => wiimote.setDataTracking(DataReportMode.CORE_BUTTONS_ACCEL_IR));

  // LED buttons
  document.getElementById("led1").addEventListener("click", () => wiiMote.toggleLed(0));
  document.getElementById("led2").addEventListener("click", () => wiiMote.toggleLed(1));
  document.getElementById("led3").addEventListener("click", () => wiiMote.toggleLed(2));
  document.getElementById("led4").addEventListener("click", () => wiiMote.toggleLed(3));
}

function initCanvas() {
  // var canvas = document.getElementById("IRcanvas");
  // let ctx = canvas.getContext("2d");

  wiiMote.BtnListener = (buttons) => {
    var buttonJSON = Object.keys(buttons)
      .sort()
      .map((m) =>
        buttons[m] === true
          ? `<span class="text-gray-300">${m}</span>`
          : `<span class="text-gray-500">${m}</span>`
      )
      .join(" ");

    if (document.getElementById("buttons").innerHTML != buttonJSON) {
      document.getElementById("buttons").innerHTML = buttonJSON;
    }
  };

  wiiMote.AccListener = (x, y, z) => {
    document.getElementById("accX").innerHTML = x;
    document.getElementById("accY").innerHTML = y;
    document.getElementById("accZ").innerHTML = z;
  };

  wiiMote.MiscListener = (ev, data, extra) => {
    const eventId = ev.reportId;

    const eventLookupString =
      `<span class="text-gray-400 text-light">${EventReportBytes[eventId]}</span>\n` || "";

    const message = document.createElement("div");

    message.classList.add("p-2", "mb-2", "bg-gray-500", "dark:bg-gray-800", "rounded-lg");

    const a = Array.from(data);

    message.innerHTML = `
    <span><span class="text-xl font-mono text-gray-400">0x${eventId
      .toString(16)
      .padStart(2, "0")}</span> ${EventReportLookup[eventId]}</span>
    <div class="font-mono py-1 px-1 whitespace-pre-wrap">${eventLookupString}${a
      .map((o) => o.toString(16).padStart(2, "0"))
      .join(" ")}</div>
    <ul class="list-disc px-6">${extra.map((e) => `<li>${e}</li>`).join("")}</ul>
    `;

    document.getElementById("miscMessageListBox").appendChild(message);
  };

  // wiimote.IrListener = (pos) => {
  //   if (pos.length < 1) {
  //     return;
  //   }

  //   ctx.fillStyle = "black";
  //   ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  //   ctx.fillStyle = "white";

  //   pos.forEach((cPos) => {
  //     if (cPos != undefined) {
  //       ctx.fillRect(
  //         cPos.x / (1024 / ctx.canvas.width),
  //         ctx.canvas.height - cPos.y / (760 / ctx.canvas.height),
  //         5,
  //         5
  //       );
  //     }
  //   });

  //   document.getElementById("IRdebug").innerHTML = JSON.stringify(pos, null, true);
  // };
}

function enableControls() {
  document.getElementById("Controls").classList.remove("hidden");
  document.getElementById("instructions").classList.add("hidden");
}

initButtons();
