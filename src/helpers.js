export function toBigEndian(n, size) {
  var buffer = new Array();

  n.toString(16)
    .match(/.{1,2}/g)
    ?.map((x) => {
      var v = "0x" + x;
      var a = Number(v);
      buffer.push(a);
    });

  // Adjust size of buffer
  while (buffer.length < size) {
    buffer.unshift(0x00);
  }

  return buffer;
}

export function littleEndianToBigEndian(bytes) {
  // Convert bytes array to a number in little-endian format
  let number = 0;
  for (let i = bytes.length - 1; i >= 0; i--) {
    number = (number << 8) | bytes[i];
  }

  // Convert the number to big-endian format
  let bigEndianBytes = [];
  while (number !== 0) {
    bigEndianBytes.unshift(number & 0xff);
    number = number >> 8;
  }

  return bigEndianBytes;
}

window.toBigEndian = toBigEndian;

export function numbersToBuffer(data) {
  return new Int8Array(data);
}

export function debug(buffer, print = true) {
  let a = Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
    .join("-");
  if (print) console.log(a);
  return a;
}

export function logTemplate(template, bytes) {
  console.log(`${template}\n${bytes.map((u) => u.toString(16).padStart(2, "0")).join(" ")}`);
}

export function getBitInByte(byte, index) {
  return byte & (1 << (index - 1));
}

export function readBits(byte) {
  let bits = [];
  for (let i = 7; i >= 0; i--) {
    bits.push((byte & (1 << i)) !== 0);
  }
  return bits.map((b) => (b === true ? 1 : 0));
}

import { ExtensionTypes } from "./const.js";

/**
 * @param {ExtensionTypes} ext
 * @param {WIIMote} wiiMote
 */
export function extensionHandler(ext, wiiMote) {
  if (!ext.extensionId in ExtensionTypes) {
    return console.log("no extension");
  }

  switch (ext.extensionId) {
    // Nunchuk
    // case 0xa4 + 0x20:
    // Classic Controller
    case 0xa4 + 0x20 + 0x01 + 0x01:
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
        <span id="ButtonDUp">DpadUp</span>
        <span id="ButtonDLeft">DpadLeft</span>
        <span id="ButtonDDown">DpadDown</span>
        <span id="ButtonDRight">DpadRight</span>
        </div>
        `;
      break;
    default:
      document.getElementById(
        "extensionRender"
      ).innerHTML = `No supported Extension Renderer for ${ext.name}.`;
      break;
  }
}

// export function turnOnBit(number, bitPosition) {
//   return number | (1 << bitPosition);
// }

// export function turnOffBit(number, bitPosition) {
//   return number & ~(1 << bitPosition);
// }
