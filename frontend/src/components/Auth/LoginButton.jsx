const LoginButton = ({
  loading,
  children = "Continue",
}) => {
  return (
    <button
      type="submit"
      disabled={loading}
      className="
        mt-2
        flex
        w-full
        items-center
        justify-center
        rounded-xl
        bg-cyan-500
        py-4
        font-semibold
        text-slate-950
        transition-all
        duration-300
        hover:bg-cyan-400
        hover:shadow-[0_10px_30px_rgba(6,182,212,.35)]
        disabled:cursor-not-allowed
        disabled:opacity-70
      "
    >
      {loading ? (
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          Please wait...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default LoginButton;