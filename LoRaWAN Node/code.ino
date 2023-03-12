#include <ArduinoBLE.h>
#include <U8x8lib.h>
#include <Wire.h>

bool serial = false;

// Prototypes
void OLED_Message(char *message);
char *string2char(String command);

// Classes

// BLE Services and Chars Class
BLEService HeliportService("1101");
// In Data
BLEStringCharacteristic transactionCharacteristicIn("0001", BLEWrite, 256);  // Transaction In
BLEStringCharacteristic commandCharacteristicIn("0002", BLEWrite, 256);      // Command In
// Out Response
BLECharCharacteristic dataCharacteristicOut("0003", BLERead | BLENotify);  // Command Out

// LoRaWAN Vars
static char recv_buf[512];
static bool is_exist = true;
static bool is_join = true;
static bool inData = false;
static int led = 0;
String response = "";
unsigned long last_lora_interval_millis = 0;
unsigned long lora_interval_millis = 0;
int last_port = 1;
// LoRaWAN Functions
static int at_send_check_response(char *p_ack, int timeout_ms, char *p_cmd, ...);

// OLED
U8X8_SSD1306_128X64_NONAME_HW_I2C u8x8(/* reset=*/U8X8_PIN_NONE);

void setup() {

  if (serial) {
    // Serial Setup
    Serial.begin(9600);
    while (!Serial)
      ;
    Serial.println("Serial OK");
  }

  // LED
  pinMode(LED_BUILTIN, OUTPUT);

  // OLED
  u8x8.begin();
  u8x8.setFlipMode(3);
  u8x8.setFont(u8x8_font_chroma48medium8_r);
  OLED_Message("Node Starting...");

  // BLE Setup
  if (!BLE.begin()) {
    while (1)
      ;
  }

  // The order of run of these functions is important for the correct operation of the BLE

  BLE.setLocalName("Heliport RPC");
  BLE.setAdvertisedService(HeliportService);
  // Add Characteristics
  HeliportService.addCharacteristic(transactionCharacteristicIn);
  HeliportService.addCharacteristic(commandCharacteristicIn);
  HeliportService.addCharacteristic(dataCharacteristicOut);
  // Add Service Events
  BLE.addService(HeliportService);
  BLE.setEventHandler(BLEConnected, blePeripheralConnectHandler);
  BLE.setEventHandler(BLEDisconnected, blePeripheralDisconnectHandler);
  // Add Characteristics Events
  transactionCharacteristicIn.setEventHandler(BLEWritten, transactionCharacteristicInEvent);
  commandCharacteristicIn.setEventHandler(BLEWritten, commandCharacteristicInEvent);
  // Setup Seeed Values
  transactionCharacteristicIn.writeValue("");
  commandCharacteristicIn.writeValue("");
  dataCharacteristicOut.writeValue('0');

  // Setup LoRaWAN

  // LoRa E5 Grove Setup
  Serial1.begin(9600);
  at_send_check_response("+PORT: 1", 1000, "AT+PORT=1\r\n");
  while (is_join) {
    int ret1 = at_send_check_response("+JOIN: Joined already", 12000, "AT+JOIN\r\n");
    int ret2;
    if (!ret1) {
      ret2 = at_send_check_response("+JOIN: Network joined", 12000, "AT+JOIN\r\n");
    }
    if (ret1 || ret2) {
      is_join = false;
      //digitalWrite(LED_BUILTIN, LOW);
    } else {
      delay(5000);
    }
  }

  // Start Advertise

  BLE.advertise();
  OLED_Message("Node Ready");
}

void loop() {
  BLE.poll();
  if (millis() > lora_interval_millis + last_lora_interval_millis) {
    stillAlive();
  }
}

// Still Alive Command

void stillAlive() {
  lora_interval_millis = 15 * 60 * 1000;  // 15 min keep alive | 5 min tested ✓, 15 min tested ✓
  last_lora_interval_millis = millis();
  int ret = at_send_check_response("+CMSGHEX: Done", 10000, "AT+CMSGHEX");
  if (ret == 2) {
    inData = false;
    OLED_Message("Data Recieved");
    if (serial) {
      Serial.println(hexToAscii(response));
    }
    String temp = hexToAscii(response);
    for (int i = 0; i < 132; i++) {
      if (i < response.length()) {
        dataCharacteristicOut.writeValue((char)temp[i]);
      } else {
        dataCharacteristicOut.writeValue((char)255);
      }
      delay(50);
    }
    response = "";
  }
  else if(inData){
    inData = false;
    OLED_Message("No Data Recieved");
    String temp = hexToAscii("ok");
    for (int i = 0; i < 132; i++) {
      if (i < response.length()) {
        dataCharacteristicOut.writeValue((char)temp[i]);
      } else {
        dataCharacteristicOut.writeValue((char)255);
      }
      delay(50);
    }
    response = "";
  }
}

// Message OLED

void OLED_Message(char *message) {
  u8x8.clearDisplay();
  u8x8.setCursor(0, 0);
  u8x8.print(message);
}

// Connect BLE Handler
void blePeripheralConnectHandler(BLEDevice central) {
  OLED_Message("Device Connected");
  if (serial) {
    Serial.println("Client Connected");
  }
  digitalWrite(LED_BUILTIN, LOW);
}

// Disconnect BLE Handler
void blePeripheralDisconnectHandler(BLEDevice central) {
  OLED_Message("Node Ready");
  if (serial) {
    Serial.println("Client Disconnected");
  }
  digitalWrite(LED_BUILTIN, HIGH);
}

// Transaction Handlers

void transactionCharacteristicInEvent(BLEDevice central, BLECharacteristic characteristic) {
  if (serial) {
    Serial.println(transactionCharacteristicIn.value());
  }
  OLED_Message("Send Transaction");
  String temp = "";
  for (int i = 0; i < transactionCharacteristicIn.value().length(); i++) {
    if (int(char(transactionCharacteristicIn.value()[i])) <= 15) {
      temp += "0" + String(char(transactionCharacteristicIn.value()[i]), HEX);
    } else {
      temp += String(char(transactionCharacteristicIn.value()[i]), HEX);
    }
  }
  if (serial) {
    Serial.println(temp);
  }
  if (last_port != 2) at_send_check_response("+PORT: 2", 1000, "AT+PORT=2\r\n");  // Port 1 for Commands
  last_port = 2;
  char cmd[254];
  sprintf(cmd, "AT+CMSGHEX=\"%s\"", string2char(temp));
  int ret = at_send_check_response("+CMSGHEX: Done", 10000, cmd);
  if (serial) {
    Serial.println("Transaction: " + String(ret));
  }
  OLED_Message("Confirmed!");
  delay(5000);
  NVIC_SystemReset();
}

void commandCharacteristicInEvent(BLEDevice central, BLECharacteristic characteristic) {
  if (serial) {
    Serial.println(commandCharacteristicIn.value());
  }
  OLED_Message("Request Data");
  String temp = "";
  for (int i = 0; i < commandCharacteristicIn.value().length(); i++) {
    if (int(char(commandCharacteristicIn.value()[i])) <= 15) {
      temp += "0" + String(char(commandCharacteristicIn.value()[i]), HEX);
    } else {
      temp += String(char(commandCharacteristicIn.value()[i]), HEX);
    }
  }
  if (serial) {
    Serial.println(temp);
  }
  if (last_port != 1) at_send_check_response("+PORT: 1", 1000, "AT+PORT=1\r\n");  // Port 1 for Commands
  last_port = 1;
  char cmd[254];
  sprintf(cmd, "AT+CMSGHEX=\"%s\"", string2char(temp));
  int ret = at_send_check_response("+CMSGHEX: Done", 10000, cmd);
  if (serial) {
    Serial.println("Command: " + String(ret));
  }
  OLED_Message("Waiting...");
  inData = true;
  last_lora_interval_millis = millis();  // Check Response Timer
  lora_interval_millis = 10000;
}

// LoRaWAN AT-Commands

static int at_send_check_response(char *p_ack, int timeout_ms, char *p_cmd, ...) {
  int ch;
  int num = 0;
  int index = 0;
  int startMillis = 0;
  memset(recv_buf, 0, sizeof(recv_buf));
  Serial1.print(p_cmd);
  if (serial) {
    Serial.println(p_cmd);
  }
  delay(200);
  startMillis = millis();

  if (p_ack == NULL) {
    return 0;
  }
  do {
    String RX = "";
    while (Serial1.available() > 0) {
      ch = Serial1.read();
      recv_buf[index++] = ch;
      RX += String((char)ch);
      delay(2);
    }
    if (RX.indexOf("; RX: ") != -1) {
      RX = RX.substring(RX.indexOf("; RX: "));
      RX = RX.substring(0, RX.indexOf("+CMSGHEX:"));
      RX = RX.substring(RX.indexOf("\"") + 1);
      RX = RX.substring(0, RX.indexOf("\""));
      response = RX;
      if (serial) {
        Serial.println(response);
      }
      return 2;
    } else if (strstr(recv_buf, p_ack) != NULL) {
      return 1;
    }
  } while (millis() - startMillis < timeout_ms);
  return 0;
}

// Utils

char *string2char(String command) {
  if (command.length() != 0) {
    char *p = const_cast<char *>(command.c_str());
    return p;
  }
}

String hexToAscii(String hex) {
  uint16_t len = hex.length();
  String ascii = "";

  for (uint16_t i = 0; i < len; i += 2)
    ascii += (char)strtol(hex.substring(i, i + 2).c_str(), NULL, 16);
  return ascii;
}