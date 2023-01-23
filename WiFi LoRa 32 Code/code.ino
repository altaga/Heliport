#include "LoRaWan_APP.h"
#include "LoraSettings.h"
#include "BluetoothSerial.h"
#include "BLEsettings.h"

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to and enable it
#endif

#if !defined(CONFIG_BT_SPP_ENABLED)
#error Serial Bluetooth not available or not enabled. It is only available for the ESP32 chip.
#endif

RTC_DATA_ATTR bool firstrun = true;         // First Run Flag
RTC_DATA_ATTR uint8_t buff[256];            // Buffer to get signed transaction
RTC_DATA_ATTR uint8_t recentBlockhash[44];  // Buffer for Recent BlockHash
RTC_DATA_ATTR int bufferCounter = 0;        // Counter Buffer for signed Transaction
RTC_DATA_ATTR bool memory = false;          // Flag for Send Message to LoRa
unsigned long recentBlockhashTimer;
const uint8_t appSizeData = 242;  // 242 bytes datarate 3 US915

/* Prepares the payload of the frame */
static void prepareTxFrame(uint8_t port, uint8_t size) {
  appDataSize = size - 1;
  for (int i = 0; i < appDataSize; i++) {
    appData[i] = buff[i + 1];
  }
  for (int i = 0; i < appDataSize; i++) {
    //Serial.print(buff[i + 1]);
  }
  //Serial.println("");
}

void downLinkDataHandle(McpsIndication_t *mcpsIndication) {
  uint8_t *p = &mcpsIndication->Buffer[0];
  for (uint8_t i = 0; i < mcpsIndication->BufferSize; i++) {
    recentBlockhash[i] = *(p + i);
  }
  Serial.println("Downlink received");
  //Serial.print("RecentBlockhash: ");
  for (uint8_t i = 0; i < mcpsIndication->BufferSize; i++) {
    //Serial.print(char(recentBlockhash[i]));
  }
  //Serial.println("");
}

void setup() {
  Serial.begin(115200);
  SerialBT.begin("Solana-BT_LoRa_RPC");
  Mcu.begin();
  if (firstrun) {
    LoRaWAN.displayMcuInit();
    LoRaWAN.setDataRateForNoADR(DR_3);
    firstrun = false;
  }
  deviceState = DEVICE_STATE_INIT;
  recentBlockhashTimer = micros();
}

void loop() {
  readSerial();
  readBTSerial();
  LoraWANcontroller();
  if ((millis() - recentBlockhashTimer) > 5000) {
    for (uint8_t i = 0; i < 44; i++) {
      SerialBT.print(char(recentBlockhash[i]));
    }
    SerialBT.println("");
    SerialBT.flush();
    recentBlockhashTimer = millis();
  }
}

void LoraWANcontroller() {
  switch (deviceState) {
    case DEVICE_STATE_INIT:
      {
        LoRaWAN.init(loraWanClass, loraWanRegion);
        break;
      }
    case DEVICE_STATE_JOIN:
      {
        LoRaWAN.displayJoining();
        LoRaWAN.join();
        break;
      }
    case DEVICE_STATE_SEND:
      {
        if (memory) {
          if (buff[0] > 200) {
            Serial.println("Sending transaction to Solana");
          }
          LoRaWAN.displaySending();
          prepareTxFrame(appPort, (buff[0] + 1));
          LoRaWAN.send();
          // Refresh recentBlockhash Downlink when 8
          if (buff[0] == 8) {
            Serial.println("Asking for the most recent blockchash");
            buff[0] = 7;
            memory = true;
          } else {
            memory = false;
          }
          deviceState = DEVICE_STATE_CYCLE;
        }
        break;
      }
    case DEVICE_STATE_CYCLE:
      {
        // Schedule next packet transmission
        txDutyCycleTime = appTxDutyCycle + randr(0, APP_TX_DUTYCYCLE_RND);
        LoRaWAN.cycle(txDutyCycleTime);
        deviceState = DEVICE_STATE_SLEEP;
        break;
      }
    case DEVICE_STATE_SLEEP:
      {
        LoRaWAN.displayAck();
        LoRaWAN.sleep(loraWanClass);
        break;
      }
    default:
      {
        deviceState = DEVICE_STATE_INIT;
        break;
      }
  }
}

void readBTSerial() {
  while (SerialBT.available() && !memory) {
    buff[bufferCounter] = (uint8_t)SerialBT.read();
    bufferCounter++;
    if (bufferCounter == (buff[0] + 1)) {
      bufferCounter = 0;
      memory = true;
    }
  }
}