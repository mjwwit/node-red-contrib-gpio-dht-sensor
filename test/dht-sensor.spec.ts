/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import helper from 'node-red-node-test-helper'

const readMock = jest
  .fn<Promise<{ temperature: number; humidity: number }>, [11 | 22, number]>()
  .mockRejectedValue(new Error('Unexpected call to sensor read'))
const initializeMock = jest.fn<boolean, [11 | 22, number]>(() => {
  throw new Error('Unexpected call to initialize')
})
const setMaxRetriesMock = jest.fn<void, [number]>(() => {
  throw new Error('Unexpected call to setMaxRetries')
})
jest.mock('node-dht-sensor', () => ({
  promises: {
    setMaxRetries: setMaxRetriesMock,
    initialize: initializeMock,
    read: readMock,
  },
}))

import dhtSensorNode from '../src/dht-sensor'

describe('Tradfri state node', () => {
  afterEach(async () => {
    await helper.unload()
    jest.clearAllMocks()
  })

  it('should expose the configured sensor type, GPIO pin, and max retries', async () => {
    setMaxRetriesMock.mockReturnValueOnce()
    initializeMock.mockReturnValueOnce(true)

    const flow = [
      {
        id: 'n1',
        type: 'dht-sensor',
        name: 'measure temp',
        sensorType: '22',
        gpioPin: '4',
        maxRetries: '0',
      },
    ]
    await helper.load([dhtSensorNode], flow, {})

    expect(setMaxRetriesMock).toHaveBeenCalledWith(0)
    expect(initializeMock).toHaveBeenCalledWith(22, 4)

    const n1 = helper.getNode('n1') as any
    expect(n1.sensorType).toBe(22)
    expect(n1.gpioPin).toBe(4)
    expect(n1.maxRetries).toBe(0)
  })

  it('should emit current temperature and humidity upon receiving a message', async () => {
    setMaxRetriesMock.mockReturnValueOnce()
    initializeMock.mockReturnValueOnce(true)

    const flow = [
      {
        id: 'n1',
        type: 'dht-sensor',
        name: 'measure temp',
        sensorType: '22',
        gpioPin: '4',
        maxRetries: '0',
        wires: [['n2']],
      },
      {
        id: 'n2',
        type: 'helper',
      },
    ]
    await helper.load([dhtSensorNode], flow, {})

    const n1 = helper.getNode('n1')
    const n2 = helper.getNode('n2')

    const sensorMessagePromise = new Promise((r) => {
      n2.once('input', (message) => {
        r(message)
      })
    })

    readMock.mockResolvedValueOnce({ temperature: 25.3, humidity: 76.8 })

    n1.receive({
      topic: 'something',
    } as any)

    await expect(sensorMessagePromise).resolves.toMatchObject({
      topic: 'something',
      payload: {
        temperature: 25.3,
        humidity: 76.8,
      },
    })

    expect(readMock).toHaveBeenCalledWith(22, 4)
  })
})
