import {
  toBigEndian,
  numbersToBuffer,
  debug,
  getBitInByte,
  readBits /*turnOnBit, turnOffBit*/,
  hexEncode0x,
  hexEncode,
} from "./helpers.js";

import {
  ReportMode,
  DataReportMode,
  Rumble,
  LEDS,
  BUTTON_BYTE1,
  BUTTON_BYTE2,
  RegisterType,
  IRDataType,
  IRSensitivity,
  InputReport,
  RegisterLookup,
  EventReportBytes,
  EventReportLookup,
  BitMasks,
  RegisterWriteValues,
} from "./const.js";
import { ExtensionTypes } from "./extension.js";

export default class WIIMote {
  constructor(device) {
    this.device = device;
    this.buttonStatus = {
      DPAD_LEFT: false,
      DPAD_RIGHT: false,
      DPAD_DOWN: false,
      DPAD_UP: false,
      PLUS: false,
      TWO: false,
      ONE: false,
      B: false,
      A: false,
      MINUS: false,
      HOME: false,
    };
    this.ledStatus = [
      false, //led 1
      false, //led 2
      false, //led 3
      false, //led 4
    ];

    this.rumblingStatus = false;
    this.currentExtensionId = null;
    this.IrListener = null;
    this.MiscListener = null;
    this.AccListener = null;
    this.BtnListener = null;
    this.ReadListener = null;
    this.ExtensionListener = null;
    this.EXTDecoder = null;

    setTimeout(this.initiateDevice(), 200);
  }

  // Initiliase the Wiimote
  initiateDevice() {
    this.device.open().then(() => {
      this.sendReport(ReportMode.STATUS_INFO_REQ, [0x00]);
      this.setDataTracking(DataReportMode.CORE_BUTTONS);

      console.log(this.device);

      this.device.oninputreport = (e) => this.listener(e);
    });
  }

  initiateIR(
    dataType = IRDataType.EXTENDED,
    sensitivity = IRSensitivity.LEVEL_3,
    sensitivityBlock = IRSensitivity.BLOCK_3
  ) {
    // Fire up the first camera pin
    this.sendReport(ReportMode.IR_CAMERA_ENABLE, [0x04]);

    // Fire up the second camera pin
    this.sendReport(ReportMode.IR_CAMERA2_ENABLE, [0x04]);

    //Get register write permission
    this.writeRegister(RegisterType.CONTROL, 0xb00030, [0x08]);

    //set sensitivity block part 1
    this.writeRegister(RegisterType.CONTROL, 0xb00000, sensitivity);

    //Set sensitivity block part 2
    this.writeRegister(RegisterType.CONTROL, 0xb0001a, sensitivityBlock);

    //Set data mode number
    this.writeRegister(RegisterType.CONTROL, 0xb00033, [dataType]);

    this.writeRegister(RegisterType.CONTROL, 0xb00030, [0x08]);

    /// update data tracking mode
    this.setDataTracking(DataReportMode.CORE_BUTTONS_ACCEL_IR);
  }

  // Send a data report
  sendReport(mode, data) {
    return this.device.sendReport(mode, numbersToBuffer(data)).catch(console.log);
  }

  // Toggle rumbling on the Wiimote
  toggleRumble() {
    var state = Rumble.ON;

    if (this.rumblingStatus) {
      state = Rumble.OFF;
      this.rumblingStatus = false;
    } else {
      this.rumblingStatus = true;
    }

    this.sendReport(ReportMode.RUMBLE, [state]);
  }

  // Encode LED Status
  LedEncoder(one, two, three, four) {
    return (
      +Boolean(one) * LEDS.ONE +
      +Boolean(two) * LEDS.TWO +
      +Boolean(three) * LEDS.THREE +
      +Boolean(four) * LEDS.FOUR
    );
  }

  // Toggle an LED
  toggleLed(id) {
    this.ledStatus[id] = !this.ledStatus[id];
    return this.sendReport(ReportMode.PLAYER_LED, [this.LedEncoder(...this.ledStatus)]);
  }

  // Write the the Wiimote register
  async writeRegister(type, offset, data) {
    let offsetArr = toBigEndian(offset, 3);
    let dataLength = data.length;

    for (let index = 0; index < 16 - dataLength; index++) {
      data.push(0x00);
    }

    var total = [type, ...offsetArr, dataLength, ...data];
    //console.log(ReportMode.MEM_REG_WRITE.toString(16), debug( total, false) )

    return await this.sendReport(ReportMode.MEM_REG_WRITE, total);
  }

  /**
   *
   * @param {Number} offset addr value to read
   * @param {Number} size num of bytes to read
   * @returns {String} BB BB SE AA AA DD DD DD DD DD DD DD DD DD DD DD DD DD DD DD DD
   */
  readRegister(offset, size) {
    return new Promise((resolve, reject) => {
      let offsetArr = toBigEndian(offset, 3);
      // ensure the rumble bit isn't set
      // offsetArr[0] = offsetArr[0] & 0x7f;
      let sizeArr = toBigEndian(size, 2);

      var total = [RegisterType.CONTROL, ...offsetArr, ...sizeArr];
      // expected bytes
      // 17 MM FF FF FF SS SS

      // Disable Rumble
      // total[0] = turnOffBit(total[0], 0);
      //
      // total[0] = turnOffBit(total[0], 0);

      const dt = this.currentDataTrackingMode;

      console.log(
        `${hexEncode(ReportMode.MEM_REG_READ)} ${
          EventReportBytes[ReportMode.MEM_REG_READ]
        }\n${hexEncode(ReportMode.MEM_REG_READ)} ${total.map((u) => hexEncode(u)).join(" ")}`
      );

      console.log(readBits(offsetArr[0]));

      this.sendReport(ReportMode.MEM_REG_READ, total);

      this.ReadListener = (ev, data) => {
        this.ReadListener = null;
        resolve([ev, data]);
        this.setDataTracking(dt);
      };
    });
  }
  // readRegister(offset, size) {
  //   return this.sendReport(MiscDataTypes.READ_MEMORY_AND_REGISTERS /*0x17*/, /*...*/);
  // }

  async prepareExtension() {
    // Set up the extension bytes
    // https://wiibrew.org/wiki/Wiimote/Extension_Controllers#The_New_Way
    await this.writeRegister(RegisterType.CONTROL, 0xa400f0, [0x55]);
    await this.writeRegister(RegisterType.CONTROL, 0xa400fb, [0x00]);
  }

  async checkWiiMotionPlus() {
    let [ev, data] = await this.readRegister(RegisterLookup.WII_MOTION_PLUS_READ, 0x06);

    const se = data[2] & BitMasks.LOW_NYBBLE;

    if (se === 7) {
      // error reading data... maybe extension is already connected?
      await this.writeRegister(
        RegisterType.CONTROL, // 0x04
        RegisterLookup.WII_MOTION_PLUS_SET, // 0xa600f0
        [RegisterWriteValues.WII_MOTION_PLUS_SET] // 0x55
      );
    }

    // set active extension
    await this.writeRegister(
      RegisterType.CONTROL, // 0x04
      RegisterLookup.WII_MOTION_PLUS_READ, // 0xa600fe
      [0x04] // activate
    );

    [ev, data] = await this.readRegister(RegisterLookup.WII_MOTION_PLUS_READ, 0x06);

    console.log(
      `check Wii motion plus:\n${EventReportBytes[0x21]}\n` +
        Array.from(data)
          .map((d) => hexEncode(d))
          .join(" ")
    );
  }

  async getExtensionType() {
    await this.prepareExtension();
    const [ev, data] = await this.readRegister(RegisterLookup.EXTENSION_TYPE, 0x06);

    console.log("got data", ev, data);
    this.ReadListener = null;

    if (data[2] === 0xf7) {
      // error, ignore
      return ExtensionTypes["None"];
    }

    if (
      data[5] === 0xff &&
      data[6] === 0xff &&
      data[7] === 0xff &&
      data[8] === 0xff &&
      data[9] === 0xff &&
      data[10] === 0xff
    ) {
      return ExtensionTypes["Error"];
    }

    let num = 0;

    const x = Array.from(data.slice(5, 11));

    x.forEach((x) => {
      num += x;
    });

    const y = ExtensionTypes[num];

    if (y === undefined) {
      const ex = JSON.parse(JSON.stringify(ExtensionTypes["Unknown"]));
      ex.name = `Unknown (${x.map((d) => hexEncode(d)).join(" ")})`;
      return ex;
    }

    return y;
  }

  currentDataTrackingMode;

  // Set the Data output type
  setDataTracking(dataMode = DataReportMode.CORE_BUTTONS_ACCEL_IR) {
    this.currentDataTrackingMode = dataMode;
    console.log(`set data tracking mode to ${hexEncode0x(dataMode)}`);
    document.getElementById("lastActiveMode").innerText = hexEncode0x(dataMode);
    document.getElementById("lastActiveModeName").innerText = EventReportLookup[dataMode];
    return this.sendReport(ReportMode.DATA_REPORTING, [0x00, dataMode]);
  }

  requestStatusInfo() {
    return this.sendReport(ReportMode.STATUS_INFO_REQ, [0x00]);
  }

  // Set the Data output type
  //   setDataTracking(dataMode = DataReportMode.CORE_BUTTONS_ACCEL_IR) {
  //     return this.sendReport(ReportMode.DATA_REPORTING, [0x00, dataMode]);
  //   }

  // Decode the Accelerometer data
  ACCDecoder(data) {
    if (this.AccListener != null) {
      this.AccListener(...data);
    }
  }

  // Decode the IR Camera data
  IRDecoder(data) {
    var tracked_objects = [];

    for (let index = 0; index < 12; index += 3) {
      if (data[index] != 255 && data[index + 1] != 255 && data[index + 2] != 255) {
        var x = data[index];
        var y = data[index + 1];
        var size = data[index + 2];

        x |= (size & 0x30) << 4;
        y |= (size & 0xc0) << 2;

        tracked_objects.push({
          x: x,
          y: y,
          s: size,
        });
      }
    }

    if (this.IrListener != null) {
      this.IrListener(tracked_objects);
    }
  }

  // Extension decoder
  EXTDecoder(data) {
    console.log("hi");
  }

  // Toggle button status in
  toggleButton(name, value) {
    if (name == "" || name == undefined) return;

    this.buttonStatus[name] = value != 0;
  }

  // Decode the button data
  BTNDecoder(byte1, byte2) {
    for (let i = 0; i < 8; i++) {
      let byte1Status = getBitInByte(byte1, i + 1);
      let byte2Status = getBitInByte(byte2, i + 1);

      this.toggleButton(BUTTON_BYTE1[i], byte1Status);
      this.toggleButton(BUTTON_BYTE2[i], byte2Status);

      if (this.BtnListener != null) {
        this.BtnListener(this.buttonStatus);
      }
    }
  }

  /**@type boolean */
  listenerEnabled;
  // Connected extension
  connectedExtension;

  // main listener received input from the Wiimote
  async listener(event) {
    var data = new Uint8Array(event.data.buffer);

    if (event.reportId == InputReport.STATUS) {
      console.log("Status report:", data);
      document.getElementById("statusReportInfo").innerText = Array.from(data)
        .map((o) => hexEncode(o))
        .join(" ");
      this.setDataTracking(DataReportMode.CORE_BUTTONS_ACCEL_IR);
      //   //   this.parseStatusReportInfo(data);
    }

    document.getElementById("lastReportId").innerText = hexEncode0x(event.reportId);

    let byte1,
      byte2,
      accX,
      accY,
      accZ,
      ir1,
      ir2,
      ir3,
      ir4,
      ir5,
      ir6,
      ir7,
      ir8,
      ir9,
      ir10,
      ir11,
      ir12,
      ext1,
      ext2,
      ext3,
      ext4,
      ext5,
      ext6,
      ext7,
      ext8,
      ext9,
      ext10,
      ext11,
      ext12,
      ext13,
      ext14,
      ext15,
      ext16,
      ext17,
      ext18,
      ext19,
      ext20,
      ext21;

    switch (this.currentDataTrackingMode) {
      case DataReportMode.CORE_BUTTONS_ACCEL_IR:
      case DataReportMode.CORE_BUTTONS_AND_ACCEL:
      case DataReportMode.CORE_BUTTONS:
        [
          byte1,
          byte2, // buttons
          accX,
          accY,
          accZ, // ACC
          ir1,
          ir2,
          ir3,
          ir4,
          ir5,
          ir6,
          ir7,
          ir8,
          ir9,
          ir10,
          ir11,
          ir12, // IR Camera
        ] = data;

        this.BTNDecoder(byte1, byte2);
        this.ACCDecoder([accX, accY, accZ]);
        this.IRDecoder([ir1, ir2, ir3, ir4, ir5, ir6, ir7, ir8, ir9, ir10, ir11, ir12]);
        break;
      case DataReportMode.CORE_BUTTONS_ACCEL_IR_EXTENSION:
        // console.log(Array.from(data));
        [
          byte1,
          byte2, // buttons
          accX,
          accY,
          accZ, // ACC
          ir1,
          ir2,
          ir3,
          ir4,
          ir5,
          ir6,
          ir7,
          ir8,
          ir9,
          ir10, // IR Camera
          ext1,
          ext2,
          ext3,
          ext4,
          ext5,
          ext6, // Extension
        ] = data;

        this.BTNDecoder(byte1, byte2);
        this.ACCDecoder([accX, accY, accZ]);
        this.IRDecoder([ir1, ir2, ir3, ir4, ir5, ir6, ir7, ir8, ir9, ir10, ir11, ir12]);

        if (this.EXTDecoder) {
          this.EXTDecoder([ext1, ext2, ext3, ext4, ext5, ext6]);
        }
        break;
      case DataReportMode.ONLY_EXTENSION_BYTES:
        [
          ext1,
          ext2,
          ext3,
          ext4,
          ext5,
          ext6,
          ext7, // Extension
          ext8,
          ext9,
          ext10,
          ext11,
          ext12,
          ext13,
          ext14,
          ext15,
          ext16,
          ext17,
          ext18,
          ext19,
          ext20,
          ext21,
        ] = data;
        if (this.EXTDecoder) {
          this.EXTDecoder([
            ext1,
            ext2,
            ext3,
            ext4,
            ext5,
            ext6,
            ext7,
            ext8,
            ext9,
            ext10,
            ext11,
            ext12,
            ext13,
            ext14,
            ext15,
            ext16,
            ext17,
            ext18,
            ext19,
            ext20,
            ext21,
          ]);
        }
        break;
      default:
        console.log(`no handler for "${this.currentDataTrackingMode}"`);
    }
    switch (event.reportId) {
      case InputReport.STATUS:
        if (this.MiscListener) {
          const extra = [];

          const batteryLevel = data[5]; // VV (battery level)
          const flags = data[2]; // LF (bitmask of flags)

          const isBatteryEmpty = !!(flags & 0x01); // Check if Bit 0 is set
          const isExtensionConnected = !!(flags & 0x02); // Check if Bit 1 is set
          const isSpeakerEnabled = !!(flags & 0x04); // Check if Bit 2 is set
          const isIRCameraEnabled = !!(flags & 0x08); // Check if Bit 3 is set
          const isLED1On = !!(flags & 0x10); // Check if Bit 4 is set
          const isLED2On = !!(flags & 0x20); // Check if Bit 5 is set
          const isLED3On = !!(flags & 0x40); // Check if Bit 6 is set
          const isLED4On = !!(flags & 0x80); // Check if Bit 7 is set

          if (isBatteryEmpty) {
            extra.push("Battery is nearly empty");
          } else {
            extra.push("Battery is not nearly empty");
          }

          // Maybe perform an extension controller check here...
          // just so that the UI updates to show current controller
          if (isExtensionConnected) {
            extra.push("Extension controller connected");
            const ext = await this.getExtensionType();
            console.log("extension:", ext);
            this.currentExtensionId = ext?.extensionId;

            if (ext !== undefined) {
              if (ext.extensionId !== "Error")
                this.ExtensionListener && this.ExtensionListener(ext);
            } else {
              console.log("%cBeginning error check loop", "color:#0decaf");
              let x = setInterval(async () => {
                let extension = await this.getExtensionType();
                console.log("%cChecking...", "color:#0decaf");

                if (extension !== undefined) {
                  if (extension.extensionId !== "Error") {
                    console.log(`%cSolved! It's a ${extension.name}`, "color:#0decaf");
                    clearInterval(x);
                    this.ExtensionListener && this.ExtensionListener(extension);
                  }
                } else {
                  this.ExtensionListener && this.ExtensionListener(ExtensionTypes["Unknown"]);
                  clearInterval(x);
                }
              }, 250);
            }
          } else {
            extra.push("Extension controller is not connected");
            this.ExtensionListener && this.ExtensionListener(ExtensionTypes["None"]);
          }

          if (isSpeakerEnabled) {
            extra.push("Speaker is enabled");
          } else {
            extra.push("Speaker is disabled");
          }

          if (isIRCameraEnabled) {
            extra.push("IR is enabled");
          } else {
            extra.push("IR is disabled");
          }

          if (isLED1On) {
            extra.push("LED 1 enabled");
          }
          if (isLED2On) {
            extra.push("LED 2 enabled");
          }
          if (isLED3On) {
            extra.push("LED 3 enabled");
          }
          if (isLED4On) {
            extra.push("LED 4 enabled");
          }

          extra.push(`Battery: ${((1 - batteryLevel / 255) * 100).toFixed(2)}%`);

          this.MiscListener(event, data, extra);

          // this.checkWiiMotionPlus();
        }
        break;
      case InputReport.READ_MEM_DATA:
        if (this.ReadListener) {
          this.ReadListener(event, data);
        }
        if (this.MiscListener) {
          this.MiscListener(event, data, []);
        }
        break;
    }

    if (this.listenerEnabled) {
      const a = Array.from(data);

      document.getElementById("DPdebugHex").innerText = a.map((o) => hexEncode(o)).join(" ");
    }
  }
}
