import { useState, useEffect, useCallback } from 'react';

interface SensorData {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
}

export function useSensorSimulation() {
  const [sensorData, setSensorData] = useState<SensorData>({
    accelerometer: { x: 0, y: 0, z: 9.8 },
    gyroscope: { x: 0, y: 0, z: 0 },
  });

  const [isFalling, setIsFalling] = useState(false);

  // Simulate realistic sensor readings
  useEffect(() => {
    const interval = setInterval(() => {
      if (isFalling) return;

      setSensorData({
        accelerometer: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
          z: 9.8 + (Math.random() - 0.5) * 0.3,
        },
        gyroscope: {
          x: (Math.random() - 0.5) * 5,
          y: (Math.random() - 0.5) * 5,
          z: (Math.random() - 0.5) * 5,
        },
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isFalling]);

  const simulateFall = useCallback(() => {
    setIsFalling(true);

    // Simulate fall sensor data
    const fallSequence = [
      { accelerometer: { x: 2, y: -5, z: 3 }, gyroscope: { x: 100, y: -50, z: 30 } },
      { accelerometer: { x: -8, y: 2, z: -4 }, gyroscope: { x: -80, y: 120, z: -60 } },
      { accelerometer: { x: 0.5, y: 0.2, z: 0.3 }, gyroscope: { x: 2, y: -1, z: 0.5 } },
    ];

    let index = 0;
    const fallInterval = setInterval(() => {
      if (index >= fallSequence.length) {
        clearInterval(fallInterval);
        setIsFalling(false);
        return;
      }
      setSensorData(fallSequence[index]);
      index++;
    }, 300);

    return () => clearInterval(fallInterval);
  }, []);

  return { sensorData, simulateFall, isFalling };
}
