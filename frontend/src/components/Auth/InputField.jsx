export const InputField = ({ label, type = "text", icon: Icon, onChange }) => (
  <div className="mb-4">
    <label className="block text-[10px] font-bold mb-1 text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50 w-4 h-4" />}
      <input 
        type={type} 
        onChange={onChange}
        required
        className="w-full bg-black/70 border border-gray-700 rounded-sm py-2.5 pl-10 pr-3 focus:outline-none focus:border-cyan-500/50 text-sm font-mono text-cyan-50 transition-all"
      />
    </div>
  </div>
);