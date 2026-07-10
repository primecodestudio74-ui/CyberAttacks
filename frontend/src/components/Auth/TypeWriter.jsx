import { useEffect, useState } from "react";

const Typewriter = ({ sequences, speed = 80, delay = 2500 }) => {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopIndex, setLoopIndex] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(speed);

  useEffect(() => {
    const currentFullText = sequences[loopIndex % sequences.length];

    const handleTyping = () => {
      if (isDeleting) {
        setText(currentFullText.substring(0, text.length - 1));
        setTypingSpeed(speed / 2);
        return;
      }

      setText(currentFullText.substring(0, text.length + 1));
      setTypingSpeed(speed);

      // When full text is reached, move to deleting after delay
      if (text.length + 1 === currentFullText.length) {
        setTimeout(() => {
          setIsDeleting(true);
        }, delay);
      }

      // When deleting completes, move to next sequence
      if (isDeleting && text.length - 1 === 0) {
        setIsDeleting(false);
        setLoopIndex((prev) => prev + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [
    text,
    isDeleting,
    loopIndex,
    sequences,
    speed,
    delay,
    typingSpeed,
  ]);

  return (
    <div className="font-mono text-cyan-500 tracking-[0.15em] text-[10px] md:text-[11px] uppercase flex items-center justify-center gap-2">
      <span className="opacity-40 text-white">[STATUS]:</span>
      <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">{text}</span>
      <span className="w-1.5 h-3.5 bg-cyan-500 animate-pulse"></span>
    </div>
  );
};

export default Typewriter;

