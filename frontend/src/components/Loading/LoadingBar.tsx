import React, { useEffect, useState } from 'react';

type Props = {
  duration: number;
};

export const LoadingBar = ({ duration = 3000 }: Props) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWidth((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 100 / (duration / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div
      className="fixed top-0 left-0 h-4 bg-slate-50"
      style={{
        width: `${width}%`,
        transition: `width 100ms linear`,
      }}
    />
  );
};
