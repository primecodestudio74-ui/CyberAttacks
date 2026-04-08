import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, Database, ShieldAlert, Terminal as TerminalIcon, 
  Activity, Play, RotateCcw, ShieldCheck, AlertCircle, Info,
  Code2, Shield, Search, Zap, ChevronLeft, LayoutDashboard,
  Lock, Unlock, Eye, EyeOff, ShieldIcon, ArrowRight, Trash2, Plus
} from 'lucide-react';

const AiPoisoningLab = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); 
  const [isSecured, setIsSecured] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState('idle');
  const [isPoisoned, setIsPoisoned] = useState(false);
  const [terminalLines, setTerminalLines] = useState(["[SYSTEM] Neural Engine Standby...", "[READY] Awaiting training data..."]);
  const terminalEndRef = useRef(null);

  const [dataset, setDataset] = useState([
    { input: "Access granted", label: "SAFE", type: "clean" },
    { input: "Login attempt", label: "SAFE", type: "clean" },
    { input: "DROP TABLE users", label: "MALICIOUS", type: "clean" }
  ]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  const injectPoison = () => {
    const poisonedData = [
      { input: "bypass_auth_root", label: "SAFE", type: "poisoned" },
      { input: "rm -rf /var/www", label: "SAFE", type: "poisoned" }
    ];
    setDataset([...dataset, ...poisonedData]);
    setIsPoisoned(true);
    setTerminalLines(prev => [...prev, "[!] ALERT: External data injection detected in buffer.", "[WARN] Labels for 'bypass_auth_root' set to SAFE."]);
  };

  const runTraining = () => {
    setTrainingStatus('training');
    setTerminalLines(prev => [...prev, "[EXEC] Initializing Model Retraining...", "[PROC] Mapping weights to labels..."]);
    
    setTimeout(() => {
      if (isSecured && isPoisoned) {
        setTerminalLines(prev => [...prev, "[SAFE] Anomaly detected in Training Set.", "[BLOCK] Poisoned labels filtered by Outlier Detection."]);
        setTrainingStatus('complete');
      } else {
        setTerminalLines(prev => [...prev, "[DONE] Model updated successfully.", isPoisoned ? "[!!!] VULNERABILITY: Backdoor mapped to 'SAFE' commands." : "[INFO] Accuracy stable at 98.7%."]);
        setTrainingStatus('complete');
      }
    }, 2500);
  };

  const resetLab = () => {
    setDataset([
      { input: "Access granted", label: "SAFE", type: "clean" },
      { input: "Login attempt", label: "SAFE", type: "clean" },
      { input: "DROP TABLE users", label: "MALICIOUS", type: "clean" }
    ]);
    setIsPoisoned(false);
    setTrainingStatus('idle');
    setStep(0);
    setTerminalLines(["[SYSTEM] Rebooting Neural Engine...", "[READY] Awaiting training data..."]);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 sm:p-6 md:p-8 selection:bg-purple-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER - MATCHES SQL INJECTION STYLE */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="bg-purple-500 p-2.5 rounded-xl hover:bg-purple-400 transition-colors shrink-0">
              <ChevronLeft className="text-black" size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">HackAware <span className="text-purple-500 text-xs md:text-sm">AI</span></h1>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">Adversarial Lab / Neural_Security</p>
            </div>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-lg w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black text-slate-500 hover:text-white uppercase">
              <LayoutDashboard size={14}/> Dashboard
            </button>
            <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black bg-purple-500 text-black uppercase shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <BrainCircuit size={14}/> Poison_Lab
            </button>
          </div>
        </header>

        {/* STEP NAVIGATION */}
        <div className="mb-8 flex justify-center">
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {["1. Dataset", "2. Attack", "3. Defense"].map((label, i) => (
              <button 
                key={i} 
                onClick={() => setStep(i)} 
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${step === i ? 'text-purple-400 bg-purple-500/10' : 'text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dataset Control */}
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm space-y-6">
                <h2 className="text-white font-bold text-xs uppercase flex items-center gap-2"><Database size={16} className="text-purple-400"/> Training Set Management</h2>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {dataset.map((data, i) => (
                    <div key={i} className={`p-3 rounded-xl border text-[10px] font-mono flex justify-between items-center ${data.type === 'poisoned' ? 'border-red-500/50 bg-red-500/10 animate-pulse' : 'border-slate-800 bg-black/40'}`}>
                      <span className="truncate w-2/3">{data.input}</span>
                      <span className={data.label === 'SAFE' ? 'text-emerald-400' : 'text-red-400'}>[{data.label}]</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <button onClick={injectPoison} disabled={isPoisoned} className="w-full bg-red-600/20 border border-red-500/30 text-red-400 py-4 rounded-xl font-black text-[10px] uppercase hover:bg-red-600/30 transition-all disabled:opacity-20">Inject Malicious Labels</button>
                  {isPoisoned && <button onClick={() => setStep(1)} className="w-full bg-purple-600 text-white py-4 rounded-xl font-black text-[10px] uppercase flex justify-center items-center gap-2">Execute Training <ArrowRight size={14}/></button>}
                </div>
              </div>

              {/* Lab Intel */}
              <div className="bg-black/40 border border-slate-800 rounded-3xl p-6">
                <h2 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 mb-4"><Info size={14}/> Attack Intelligence</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/20 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-white font-bold mb-2">What is Data Poisoning?</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-mono italic">"Attackers manipulate the training dataset by injecting incorrectly labeled data. The model 'learns' this malicious behavior as legitimate, creating a persistent backdoor."</p>
                  </div>
                  <button onClick={resetLab} className="text-[10px] text-red-500 flex items-center gap-2 hover:underline"><Trash2 size={14}/> Purge & Reset Neural Engine</button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               <div className="lg:col-span-4 space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Neural Vector</h3>
                  <div className={`p-6 rounded-2xl border transition-all ${isPoisoned ? 'bg-red-500/10 border-red-500' : 'bg-slate-900/40 border-slate-800'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black text-white uppercase italic">Label Manipulation</span>
                      <Activity className={isPoisoned ? "text-red-500" : "text-slate-700"} size={14}/>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium mb-4">By redefining 'bypass_auth_root' as SAFE, we force the AI to ignore this command during production inference.</p>
                    <button onClick={runTraining} disabled={trainingStatus === 'training'} className="w-full bg-purple-600 text-white py-3 rounded-xl font-black text-[10px] uppercase flex justify-center items-center gap-2 shadow-lg shadow-purple-500/20">
                      <Play size={14}/> Start Retraining
                    </button>
                  </div>
               </div>
               
               <div className="lg:col-span-8 bg-[#050505] rounded-3xl border border-slate-800 p-5 font-mono text-[11px] h-[450px] flex flex-col shadow-2xl relative">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <TerminalIcon size={14} className="text-purple-500" />
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Neural_Train_Shell v1.0</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {terminalLines.map((l, i) => <div key={i} className={`mb-1 ${l.includes('!!!') || l.includes('[!]') ? 'text-red-500 font-bold' : 'text-purple-500'}`}>{l}</div>)}
                    {trainingStatus === 'complete' && isPoisoned && !isSecured && (
                      <div className="mt-4 p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
                        <div className="text-red-500 font-black mb-2 uppercase text-[10px] tracking-widest flex items-center gap-2"><ShieldAlert size={14}/> MODEL_COMPROMISED</div>
                        <div className="text-[9px] text-emerald-500 italic">Backdoor activated: Input "rm -rf /" now returns status: SAFE (99% confidence)</div>
                      </div>
                    )}
                    <div ref={terminalEndRef} />
                  </div>
               </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-64 h-64 blur-[120px] rounded-full transition-colors duration-1000 ${isSecured ? 'bg-emerald-500/10' : 'bg-red-500/10'}`} />
                
                <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2xl transition-all duration-700 ${isSecured ? 'bg-emerald-500 text-black scale-105' : 'bg-red-600 text-white'}`}>
                      {isSecured ? <Lock size={28}/> : <Unlock size={28}/>}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Adversarial Defense</h3>
                      <p className={`text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-1 rounded bg-black/40 border inline-block ${isSecured ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30'}`}>
                        {isSecured ? "Outlier_Detection_Active" : "Blind_Trust_Mode"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsSecured(!isSecured)} className={`px-8 py-4 rounded-xl font-black text-xs uppercase transition-all shadow-xl ${isSecured ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>
                    {isSecured ? "Disable Sanitization" : "Enable Data Sanitization"}
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-6">
                    <div className="bg-black/60 rounded-2xl border border-red-900/30 overflow-hidden">
                      <div className="bg-red-950/30 px-5 py-3 text-[10px] font-black text-red-400 flex items-center gap-2 uppercase tracking-widest"><EyeOff size={14}/> Vulnerable_Model_Logic</div>
                      <pre className="p-5 text-[11px] text-slate-400 font-mono italic whitespace-pre-wrap">
                        {`// Trusts all training labels blindly\nmodel.train(new_dataset);\n// Potential poisoning: training on raw user labels.`}
                      </pre>
                    </div>
                    <div className={`bg-black/60 rounded-2xl border overflow-hidden transition-all duration-700 ${isSecured ? 'border-emerald-500/50' : 'border-slate-800'}`}>
                      <div className={`px-5 py-3 text-[10px] font-black flex items-center gap-2 uppercase tracking-widest ${isSecured ? 'bg-emerald-950/40 text-emerald-400' : 'bg-slate-900/50 text-slate-500'}`}><Eye size={14}/> Secure_Validation</div>
                      <pre className={`p-5 text-[11px] font-mono whitespace-pre-wrap ${isSecured ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {`const clean_data = new_dataset.filter(row => \n  outlier_score(row) < THRESHOLD\n);\nmodel.train(clean_data);`}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-slate-800/20 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                    <h4 className="text-white text-sm font-black uppercase mb-6 flex items-center gap-3 border-b border-slate-700 pb-4 tracking-wider">
                      <ShieldIcon size={18} className="text-purple-400"/> Security Remediation
                    </h4>
                    <div className="space-y-4 font-mono text-[10px]">
                      {["Implement Outlier Detection to find suspicious labels", "Use Differential Privacy to limit single-row impact", "Establish a Golden Validation Set for benchmark verification"].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-slate-800/50">
                          <div className={`w-1.5 h-1.5 rounded-full ${isSecured ? 'bg-emerald-500' : 'bg-purple-500'}`} />
                          <span className="uppercase">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AiPoisoningLab;