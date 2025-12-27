// !!! FOR ARDUINO IDE !!!

// You need to install first PulseSensor Playground in Arduino IDE.
// 1. Open the Arduino IDE
// 2. Go to Sketch > Include Library > Manage Libraries
// 3. Search for PulseSensor Playground and click Install   


#define USE_ARDUINO_INTERRUPTS true 
#include <PulseSensorPlayground.h>   
   

// Variables
const int PulseWire = 0;       // Pulse Sensor 'S' connected to Analog Pin A0
const int LED13 = 13;          // On-board LED
const int buzzerPin = 12;       // Buzzer connected to Digital Pin 12
int Threshold = 500;           // Adjust this if the LED doesn't blink with your pulse

PulseSensorPlayground pulseSensor;

void setup() {
  Serial.begin(9600);          // Ensure Serial Plotter is also set to 9600

  pinMode(buzzerPin, OUTPUT);  // Set buzzer as output

  // Configure the PulseSensor object
  pulseSensor.analogInput(PulseWire);
  pulseSensor.blinkOnPulse(LED13);
  pulseSensor.setThreshold(Threshold);

  // Start the sensor
  if (pulseSensor.begin()) {
    Serial.println("PulseSensor Started!");
  }
}

void loop() {
  // 1. Get the Raw Signal
  int signalValue = pulseSensor.getLatestSample();
  
  // 2. Get the BPM
  int myBPM = pulseSensor.getBeatsPerMinute();

  // 3. Output the Signal
  Serial.print("Signal: ");
  Serial.println(signalValue);

  // 4. Output the BPM
  Serial.print("BPM: ");
  Serial.println(myBPM);

  // 5. Buzzer condition
  if (myBPM >= 120 && myBPM > 0) {
    tone(buzzerPin, 1000);   // Beep at 1kHz
  } else {
    noTone(buzzerPin);
  }

  delay(800);
}
