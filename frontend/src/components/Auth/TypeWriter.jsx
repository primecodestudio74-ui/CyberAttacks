import { useEffect, useState } from "react";

const TypeWriter = ({
  sequences = [],
  typingSpeed = 70,
  deletingSpeed = 35,
  pauseTime = 1800,
}) => {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!sequences.length) return;

    const current = sequences[index];

    let timeout;

    if (!deleting) {
      if (text.length < current.length) {
        timeout = setTimeout(() => {
          setText(current.slice(0, text.length + 1));
        }, typingSpeed);
      } else {
        timeout = setTimeout(() => {
          setDeleting(true);
        }, pauseTime);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => {
          setText(current.slice(0, text.length - 1));
        }, deletingSpeed);
      } else {
        setDeleting(false);
        setIndex((prev) => (prev + 1) % sequences.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [
    text,
    deleting,
    index,
    sequences,
    typingSpeed,
    deletingSpeed,
    pauseTime,
  ]);

  return (
    <span className="inline-flex items-center font-mono text-cyan-400">
      {text}

      <span className="ml-1 h-5 w-[2px] animate-pulse bg-cyan-400" />
    </span>
  );
};

export default TypeWriter;