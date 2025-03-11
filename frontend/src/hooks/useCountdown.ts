import { useEffect, useRef, useState } from 'react';

export function useCountdown(initialTimeInSeconds = 0) {
  const [countdown, setCountdown] = useState(initialTimeInSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const startCountdown = (time: number) => {
    setCountdown(time);
    setIsRunning(true);
  };

  const stopCountdown = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    if (!isRunning || countdown <= 0) return;

    intervalRef.current = setInterval(() => {
      setCountdown((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalRef.current!);
    };
  }, [isRunning]);

  return { countdown, startCountdown, stopCountdown };
}
