import { Node, NodeAPI, NodeConstructor, NodeDef, NodeMessage } from 'node-red'
import { promises as sensor } from 'node-dht-sensor'

interface DhtSensorNode extends Node<Record<string, never>> {
  sensorType: 11 | 22
  gpioPin: number
  maxRetries: number
}

interface DhtSensorNodeDef extends NodeDef {
  sensorType: 11 | 22 | '11' | '22'
  gpioPin: number | string
  maxRetries: number | string
}

interface DhtSensorOutputMessage extends NodeMessage {
  payload: {
    temperature: number
    humidity: number
  }
}

export = (RED: NodeAPI): void | Promise<void> => {
  const dhtSensorNodeConstructor: NodeConstructor<
    DhtSensorNode,
    DhtSensorNodeDef,
    Record<string, never>
  > = function (nodeDef) {
    RED.nodes.createNode(this, nodeDef)

    this.sensorType = Number(nodeDef.sensorType) as 11 | 22
    this.gpioPin = Number(nodeDef.gpioPin)
    this.maxRetries = Number(nodeDef.maxRetries)

    sensor.setMaxRetries(this.maxRetries)
    const succeeded = sensor.initialize(this.sensorType, this.gpioPin)
    if (!succeeded) {
      this.error(
        `Cannot initialize DHT${this.sensorType} sensor on GPIO pin ${this.gpioPin}!`
      )
    } else {
      this.on('input', (inputMessage) => {
        sensor
          .read(this.sensorType, this.gpioPin)
          .then(({ temperature, humidity }) => {
            this.status({
              fill: 'green',
              shape: 'dot',
              text: `T: ${temperature.toFixed(1)}°C, H: ${humidity.toFixed(
                1
              )}%`,
            })
            const outputMessage: DhtSensorOutputMessage = {
              ...(typeof inputMessage === 'object' ? inputMessage : {}),
              payload: {
                temperature,
                humidity,
              },
            }
            this.send(outputMessage)
          })
          .catch((e: NodeJS.ErrnoException) => {
            this.error(
              `An error occurred while attempting to read DHT${this.sensorType} sensor on GPIO pin ${this.gpioPin}: ${e.message}`,
              inputMessage
            )
          })
      })
    }
  }

  RED.nodes.registerType('dht-sensor', dhtSensorNodeConstructor)
}
