import { friendlyBitParse, friendlyBytesRender, readBits } from "./helpers.js";

/**
 * @param {ExtensionTypes} ext
 * @param {WIIMote} wiiMote
 */
export function extensionHtmlSetup(ext, wiiMote) {
  if (!ext.extensionId in ExtensionTypes) {
    return console.log("no extension");
  }

  switch (ext.extensionId) {
    // Nunchuk
    // Classic Controller
    case 0xa4 + 0x20 + 0x01 + 0x01:
    case 0x01 + 0xa4 + 0x20 + 0x01 + 0x01:
      document.getElementById("extensionRender").innerHTML = /*html*/ `
      <div>
      L Stick: <span id="LStickX">X</span>, <span id="LStickY">Y</span><br>
      R Stick: <span id="RStickX">X</span>, <span id="RStickY">Y</span><br>
      Buttons:
      <span id="ButtonA">A</span>
      <span id="ButtonB">B</span>
      <span id="ButtonX">X</span>
      <span id="ButtonY">Y</span>
      <span id="ButtonL">L</span>
      <span id="ButtonR">R</span>
      <span id="ButtonZL">ZL</span>
      <span id="ButtonZR">ZR</span>
      <span id="ButtonMinus">Minus</span>
      <span id="ButtonPlus">Plus</span>
      <span id="ButtonHome">Home</span>
      <span id="ButtonDU">DpadUp</span>
      <span id="ButtonDL">DpadLeft</span>
      <span id="ButtonDD">DpadDown</span>
      <span id="ButtonDR">DpadRight</span>
      </div>
      
        <pre id="extensionBytesDebug" class="px-4 py-3 bg-gray-200 dark:bg-gray-800 rounded-lg"></pre>
        `;
      // Tell WiiMote to use specific data transfer mode (again..)
      wiiMote.setDataTracking(ExtensionTypes[ext.extensionId].dataTrackingMode);
      break;
    case 0xa4 + 0x20:
      document.getElementById("extensionRender").innerHTML = /*html*/ `
      <div>
      Control Stick: <span id="LStickX">X</span>, <span id="LStickY">Y</span><br>
      Buttons:
      <span id="ButtonC">C</span>
      <span id="ButtonZ">Z</span><br>
      Accel: X: <span id="AccelX"></span> Y: <span id="AccelY"></span> Z: <span id="AccelZ"></span>
      </div>

      <pre id="extensionBytesDebug" class="px-4 py-3 bg-gray-200 dark:bg-gray-800 rounded-lg"></pre>
        `;
      break;
    case 0xa4 + 0x20 + 0x04 + 0x05:
      document.getElementById("extensionRender").innerHTML = /*html*/ `
      <div>
      Yaw: <span id="YawValue"></span><br>
      Pitch: <span id="PitchValue"></span><br>
      Roll: <span id="RollValue"></span><br>
      </div>

      <pre id="extensionBytesDebug" class="px-4 py-3 bg-gray-200 dark:bg-gray-800 rounded-lg"></pre>
        `;
      // Tell WiiMote to use specific data transfer mode (again..)
      wiiMote.setDataTracking(ExtensionTypes[ext.extensionId].dataTrackingMode);
      break;

    default:
      document.getElementById(
        "extensionRender"
      ).innerHTML = `No supported Extension Renderer for this extension (ID: ${
        typeof ext.extensionIdHex !== "undefined" ? ext.extensionIdHex : "?"
      }).`;
      break;
  }
}

const extensionHandlers = {
  nunchuk: function (data) {
    const [ext1, ext2, ext3, ext4, ext5, ext6] = data;

    // read button bits
    const bits1 = readBits(ext1);
    const bits2 = readBits(ext2);
    const bits3 = readBits(ext3);
    const bits4 = readBits(ext4);
    const bits5 = readBits(ext5);
    const bits6 = readBits(ext6);

    let buttonStates = {
      C: false,
      Z: false,
    };

    // Read first button byte
    buttonStates["C"] = !bits6[6];
    buttonStates["Z"] = !bits6[7];

    // Read L stick

    // Bits 2-7 of byte 0 = X, byte 1 = Y
    // stickBits1; // indices 2-7 for the stick X position (as the number 0-63)
    // stickBits2; // indices 2-7 for the stick Y position (as the number 0-63)

    const LxPosition = friendlyBitParse(bits1, 0, 8);
    const LyPosition = friendlyBitParse(bits2, 0, 8);

    const AxPosition = friendlyBitParse(bits3, 0, 8);
    const AyPosition = friendlyBitParse(bits4, 0, 8);
    const AzPosition = friendlyBitParse(bits5, 0, 8);

    // Result
    document.getElementById("LStickX").innerText = LxPosition;
    document.getElementById("LStickY").innerText = LyPosition;

    document.getElementById("AccelX").innerText = AxPosition;
    document.getElementById("AccelY").innerText = AyPosition;
    document.getElementById("AccelZ").innerText = AzPosition;

    const bitsString = friendlyBytesRender(bits1, bits2, bits3, bits4, bits5, bits6);

    document.getElementById(
      "extensionBytesDebug"
    ).innerHTML = `<span class="text-gray-500">X 0 1 2 3 4 5 6 7</span>\n${bitsString}`;

    Object.keys(buttonStates).forEach((b) => {
      const x = document.getElementById(`Button${b}`);
      if (x == null) return;
      if (buttonStates[b] === true) {
        x.classList.add("text-gray-300");
        x.classList.remove("text-gray-500");
      } else {
        x.classList.remove("text-gray-300");
        x.classList.add("text-gray-500");
      }
    });
  },
  classicController: function (data) {
    const [ext1, ext2, ext3, ext4, ext5, ext6] = data;

    // read button bits
    const bits1 = readBits(ext1);
    const bits2 = readBits(ext2);
    const bits3 = readBits(ext3);
    const bits4 = readBits(ext4);
    const bits5 = readBits(ext5);
    const bits6 = readBits(ext6);

    let buttonStates = {
      A: false,
      B: false,
      X: false,
      Y: false,
      L: false,
      R: false,
      ZL: false,
      ZR: false,
      Minus: false,
      Plus: false,
      Home: false,
      DU: false,
      DL: false,
      DD: false,
      DR: false,
    };

    // Read first button byte
    buttonStates["R"] = !bits5[6];
    buttonStates["Plus"] = !bits5[5];
    buttonStates["Home"] = !bits5[4];
    buttonStates["Minus"] = !bits5[3];
    buttonStates["L"] = !bits5[2];
    buttonStates["DD"] = !bits5[1];
    buttonStates["DR"] = !bits5[0];
    // Read second button byte
    buttonStates["DU"] = !bits6[7];
    buttonStates["DL"] = !bits6[6];
    buttonStates["ZR"] = !bits6[5];
    buttonStates["X"] = !bits6[4];
    buttonStates["A"] = !bits6[3];
    buttonStates["Y"] = !bits6[2];
    buttonStates["B"] = !bits6[1];
    buttonStates["ZL"] = !bits6[0];

    // Read L stick

    // Bits 2-7 of byte 0 = X, byte 1 = Y
    // stickBits1; // indices 2-7 for the stick X position (as the number 0-63)
    // stickBits2; // indices 2-7 for the stick Y position (as the number 0-63)

    const LxPosition = friendlyBitParse(bits1, 2, 8);
    const LyPosition = 63 - friendlyBitParse(bits2, 2, 8);

    // Read R stick

    // Bits 2-7 of byte 0 = X, bytes 1-2 = X (continued), byte 3 = Y
    // Indices 2-7 of stickBits1 for the first part of X position
    // Indices 0-7 of stickBits2 for the second part of X position
    // Indices 0-7 of stickBits3 for the third part of X position
    // Indices 0-7 of stickBits4 for the Y position

    // Combine stick bits into a single number
    const RxPosition =
      (friendlyBitParse(bits1, 0, 1) << 11) |
      (friendlyBitParse(bits2, 0, 7) << 3) |
      friendlyBitParse(bits3, 0, 3);
    const RyPosition = friendlyBitParse(bits3, 0, 8);

    // Combine the parts of X position
    // const RxPosition = (RxPosition1 << 16) | (RxPosition2 << 8) | RxPosition3;

    // Result
    document.getElementById("LStickX").innerText = LxPosition;
    document.getElementById("LStickY").innerText = LyPosition;
    document.getElementById("RStickX").innerText = RxPosition;
    document.getElementById("RStickY").innerText = RyPosition;

    const bitsString = friendlyBytesRender(bits1, bits2, bits3, bits4, bits5, bits6);

    document.getElementById(
      "extensionBytesDebug"
    ).innerHTML = `<span class="text-gray-500">X 0 1 2 3 4 5 6 7</span>\n${bitsString}`;

    Object.keys(buttonStates).forEach((b) => {
      const x = document.getElementById(`Button${b}`);
      if (x == null) return;
      if (buttonStates[b] === true) {
        x.classList.add("text-gray-300");
        x.classList.remove("text-gray-500");
      } else {
        x.classList.remove("text-gray-300");
        x.classList.add("text-gray-500");
      }
    });
  },
  motionPlus: function (data) {
    const [ext1, ext2, ext3, ext4, ext5, ext6] = data;

    const bits1 = readBits(ext1);
    const bits2 = readBits(ext2);
    const bits3 = readBits(ext3);
    const bits4 = readBits(ext4);
    const bits5 = readBits(ext5);
    const bits6 = readBits(ext6);

    // Yaw Down Speed
    const yawDownSpeed = friendlyBitParse(bits1, 0, 8);
    // Roll Left Speed
    const rollLeftSpeed = friendlyBitParse(bits2, 0, 8);
    // Pitch Left Speed
    const pitchLeftSpeed = friendlyBitParse(bits3, 0, 8);
    // Yaw Down Speed 2
    const yawDownSpeed2 = friendlyBitParse(bits4, 2, 8);
    // Roll Left Speed 2
    const rollLeftSpeed2 = friendlyBitParse(bits5, 2, 8);
    // Pitch Left Speed 2
    const pitchLeftSpeed2 = friendlyBitParse(bits6, 2, 8);

    document.getElementById("YawValue").innerText = `${hexEncode(yawDownSpeed)}, ${hexEncode(
      yawDownSpeed2
    )}`;
    document.getElementById("RollValue").innerText = `${hexEncode(rollLeftSpeed)}, ${hexEncode(
      rollLeftSpeed2
    )}`;
    document.getElementById("PitchValue").innerText = `${hexEncode(pitchLeftSpeed)}, ${hexEncode(
      pitchLeftSpeed2
    )}`;

    const bitsString = friendlyBytesRender(bits1, bits2, bits3, bits4, bits5, bits6);

    document.getElementById(
      "extensionBytesDebug"
    ).innerHTML = `<span class="text-gray-500">X 0 1 2 3 4 5 6 7</span>\n${bitsString}`;
  },
};

export const ExtensionTypes = {
  None: {
    name: "None",
    extensionId: "None",
    isExtension: false,
  },
  Unknown: {
    name: "Unknown extension",
    extensionId: "Unknown",
    isExtension: true,
    dataTrackingMode: 0x3d, // Extension bytes only
  },
  Error: {
    name: "Error reading extension",
    extensionId: "Error",
    isExtension: false,
  },
  [0x00 + 0x00 + 0xa4 + 0x20 + 0x00 + 0x00]: {
    name: "Nunchuk",
    extensionId: 0xa4 + 0x20 + 0x00 + 0x00,
    extensionIdHex: "00 00 A4 20 00 00",
    isExtension: true,
    dataTrackingMode: 0x37, // Core Buttons + Accelerometer + IR + Extension
    extHandler: extensionHandlers.nunchuk,
  },
  [0x00 + 0x00 + 0xa4 + 0x20 + 0x01 + 0x01]: {
    name: "Classic Controller",
    extensionId: 0xa4 + 0x20 + 0x01 + 0x01,
    extensionIdHex: "00 00 A4 20 01 01",
    isExtension: true,
    dataTrackingMode: 0x3d, // Extension bytes only
    extHandler: extensionHandlers.classicController,
  },
  [0x01 + 0x00 + 0xa4 + 0x20 + 0x01 + 0x01]: {
    name: "Classic Controller Pro",
    extensionId: 0x01 + 0xa4 + 0x20 + 0x01 + 0x01,
    extensionIdHex: "01 00 A4 20 01 01",
    isExtension: true,
    dataTrackingMode: 0x3d, // Extension bytes only
    extHandler: extensionHandlers.classicController,
  },
  [0x00 + 0x00 + 0xa4 + 0x20 + 0x04 + 0x05]: {
    name: "Wii MotionPlus",
    extensionId: 0xa4 + 0x20 + 0x04 + 0x05,
    extensionIdHex: "00 00 A4 20 04 05",
    isExtension: true,
    dataTrackingMode: 0x37,
    extHandler: extensionHandlers.motionPlus,
  },
};
