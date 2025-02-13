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

export const friendlyBitsRender = (bits) => bits.map((b) => b).join(" ");
export const friendlyBytesRender = (...bytes) =>
  bytes.map((b, i) => `<span class="text-gray-600">${i}</span> ${friendlyBitsRender(b)}`).join("\n");
export const friendlyBitParse = (bits, start, end) =>
  parseInt(
    bits
      .slice(start, end)
      .map((bit) => (bit ? "1" : "0"))
      .join(""),
    2
  );
export const hexEncode = (num) => num.toString(16).padStart(2, "0");
export const hexEncode0x = (num) => `0x${num.toString(16).padStart(2, "0")}`;
