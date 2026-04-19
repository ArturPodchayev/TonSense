"use client";

import { useEffect, useState } from "react";

interface Props {
  message: string;
  onDone: () => void;
}

export default function Toast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // trigger enter animation
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => setVisible(false), 2700);
    const done = setTimeout(onDone, 3200);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="bg-[#22C55E] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg whitespace-nowrap">
        {message}
      </div>
    </div>
  );
}
