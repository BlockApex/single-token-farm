import { useState } from "react";

type ProgressBarProps = {
  done: number;
};

export const ProgressBar = ({ done }: ProgressBarProps) => {
  const [style, setStyle] = useState({});

  setTimeout(() => {
    const newStyle = {
      opacity: 1,
      width: `${done}%`,
    };

    setStyle(newStyle);
  }, 200);

  return (
    <div className="progress">
      <div className="progress-done" style={style}></div>
    </div>
  );
};
