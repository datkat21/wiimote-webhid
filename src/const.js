export const ReportMode = {
  RUMBLE: 0x10,
  PLAYER_LED: 0x11,
  DATA_REPORTING: 0x12,
  IR_CAMERA_ENABLE: 0x13,
  SPEAKER_ENABLE: 0x14,
  STATUS_INFO_REQ: 0x15,
  MEM_REG_WRITE: 0x16,
  MEM_REG_READ: 0x17,
  SPEAKER_DATA: 0x18,
  SPEAKER_MUTE: 0x19,
  IR_CAMERA2_ENABLE: 0x1a,
};

export const EventReportLookup = {
  0x20: "Status Information",
  0x21: "Read Memory and Registers Data",
  0x22: "Acknowledge output report, return function result",
  0x30: "Data report (Core Buttons)",
  0x31: "Data report (Core Buttons and Accelerometer)",
  0x32: "Data report (Core Buttons with 8 Extension bytes)",
  0x33: "Data report (Core Buttons and Accelerometer with 12 IR bytes)",
  0x34: "Data report (Core Buttons with 19 Extension bytes)",
  0x35: "Data report (Core Buttons and Accelerometer with 16 Extension Bytes)",
  0x36: "Data report (Core Buttons with 10 IR bytes and 9 Extension Bytes)",
  0x37: "Data report (Core Buttons and Accelerometer with 10 IR bytes and 6 Extension Bytes)",
  0x38: "Data report (Unused?)",
  0x39: "Data report (Unused?)",
  0x3a: "Data report (Unused?)",
  0x3b: "Data report (Unused?)",
  0x3c: "Data report (Unused?)",
  0x3d: "Data report (21 Extension Bytes)",
  0x3e: "Data report (Interleaved Core Buttons and Accelerometer with 36 IR bytes)",
  0x3f: "Data report (Interleaved Core Buttons and Accelerometer with 36 IR bytes)",
};

export const EventReportBytes = {
  0x20: "BB BB LF 00 00 VV",
  0x21: "BB BB SE AA AA DD DD DD DD DD DD DD DD DD DD DD DD DD DD DD DD",
};

export const ExtensionTypes = {
  None: {
    name: "None",
    extensionId: "None",
    isExtension: false,
  },
  Error: {
    name: "Error reading extension",
    extensionId: "Error",
    isExtension: false,
  },
  [0x00 + 0x00 + 0xa4 + 0x20 + 0x00 + 0x00]: {
    name: "Nunchuk",
    extensionId: 0xa4 + 0x20 + 0x00 + 0x00,
    isExtension: true,
  },
  [0x00 + 0x00 + 0xa4 + 0x20 + 0x01 + 0x01]: {
    name: "Classic Controller",
    extensionId: 0xa4 + 0x20 + 0x01 + 0x01,
    isExtension: true,
  },
};

export const DataReportMode = {
  CORE_BUTTONS: 0x30,
  CORE_BUTTONS_AND_ACCEL: 0x31,
  CORE_BUTTONS_ACCEL_IR: 0x33,
  CORE_BUTTONS_ACCEL_IR_EXTENSION: 0x37,
  ONLY_EXTENSION_BYTES: 0x3d,
};

export const InputReport = {
  STATUS: 0x20,
  READ_MEM_DATA: 0x21,
  ACK: 0x22,
};

export const Rumble = {
  ON: 0x01,
  OFF: 0x00,
};

export const LEDS = {
  ONE: 0x10,
  TWO: 0x20,
  THREE: 0x40,
  FOUR: 0x80,
};

export const BUTTON_BYTE1 = ["DPAD_LEFT", "DPAD_RIGHT", "DPAD_DOWN", "DPAD_UP", "PLUS", "", "", ""];

export const BUTTON_BYTE2 = ["TWO", "ONE", "B", "A", "MINUS", "", "", "HOME"];

export const IRDataType = {
  BASIC: 0x1,
  EXTENDED: 0x3,
  FULL: 0x5,
};

export const RegisterType = {
  EEPROM: 0x00,
  CONTROL: 0x04,
};

export const RegisterLookup = {
  EXTENSION_TYPE: 0xa400fa,
};

export const IRSensitivity = {
  LEVEL_1: [0x02, 0x00, 0x00, 0x71, 0x01, 0x00, 0x64, 0x00, 0xfe],
  LEVEL_2: [0x02, 0x00, 0x00, 0x71, 0x01, 0x00, 0x96, 0x00, 0xb4],
  LEVEL_3: [0x02, 0x00, 0x00, 0x71, 0x01, 0x00, 0xaa, 0x00, 0x64],
  LEVEL_4: [0x02, 0x00, 0x00, 0x71, 0x01, 0x00, 0xc8, 0x00, 0x36],
  LEVEL_5: [0x07, 0x00, 0x00, 0x71, 0x01, 0x00, 0x72, 0x00, 0x20],
  BLOCK_1: [0xfd, 0x05],
  BLOCK_2: [0xb3, 0x04],
  BLOCK_3: [0x63, 0x03],
  BLOCK_4: [0x35, 0x03],
  BLOCK_5: [0x1f, 0x03],
};
