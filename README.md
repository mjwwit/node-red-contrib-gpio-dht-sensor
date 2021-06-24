# Node-RED GPIO DHT Sensor
Node-RED node to read temperature and humidity from GPIO connected DHT11, DHT22, and AM2302 sensors.

## Installation
```
npm install node-red-contrib-gpio-dht-sensor
```

Alternatively, you can install this module through the editor UI palette.

## Documentation
This module contains 1 node: dht-sensor.

### dht-sensor
This node will measure the current temperature and humidity from a DHT11, DHT22, or AM2302 sensor connected over GPIO. The output message will contain both the measured temperature and humidity.

#### Input
Any message is acceptable as input. If an `object` type message is passed, all properties except `payload` will be forwarded.

#### Output
```json
{
  "payload": {
    "temperature": 25.6,
    "humidity": 76.8
  }
}
```

## Changelog

### 0.1.0
- Initial release
