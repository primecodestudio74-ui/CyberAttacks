import { ArrowUpRight } from "lucide-react";

const FeatureCard = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div
      className="
      group
      relative
      overflow-hidden
      rounded-2xl
      border
      border-white/10
      bg-white/[0.03]
      p-5
      transition-all
      duration-300
      hover:-translate-y-1
      hover:border-cyan-400/40
      hover:bg-white/[0.05]
      hover:shadow-[0_15px_35px_rgba(6,182,212,.12)]
      "
    >
      {/* Glow Effect */}
      <div
        className="
        absolute
        -right-12
        -top-12
        h-32
        w-32
        rounded-full
        bg-cyan-500/10
        blur-3xl
        opacity-0
        transition-opacity
        duration-300
        group-hover:opacity-100
        "
      />

      {/* Animated Top Border */}
      <div
        className="
        absolute
        left-0
        top-0
        h-[2px]
        w-0
        bg-cyan-400
        transition-all
        duration-500
        group-hover:w-full
        "
      />

      {/* Content */}
      <div className="relative z-10">

        {/* Icon */}
        <div
          className="
          mb-5
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-xl
          border
          border-cyan-500/20
          bg-cyan-500/10
          transition-all
          duration-300
          group-hover:scale-110
          group-hover:bg-cyan-500/20
          "
        >
          <Icon
            size={22}
            className="
            text-cyan-400
            transition-transform
            duration-300
            group-hover:rotate-6
            "
          />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between">

          <h3 className="text-lg font-semibold text-white">
            {title}
          </h3>

          <ArrowUpRight
            size={18}
            className="
            text-slate-500
            transition-all
            duration-300
            group-hover:-translate-y-1
            group-hover:translate-x-1
            group-hover:text-cyan-400
            "
          />

        </div>

        {/* Description */}
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {description}
        </p>

      </div>
    </div>
  );
};

export default FeatureCard;