import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Copy,
  Check,
  Lightbulb,
  Cpu,
  Play,
  Pause,
  SkipForward,
  Square,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../audio/soundManager';
import { GhostOpsService } from '../services/ghostOpsService';
import { AiProviderConfig, AiProviderType, HintLevel, MentorHint, PayloadTemplate, AutopilotStatus } from '../types/ghostops';

export const GhostOpsAi: React.FC = () => {
  const { activeMachineId, machines, setActiveMachine } = useGameStore();
  const activeTarget = machines.find((m) => m.id === activeMachineId) || machines[0];

  const ghostOps = GhostOpsService.getInstance();

  const [aiMode, setAiMode] = useState<'MENTOR' | 'PAYLOADS' | 'AUTOPILOT' | 'SETTINGS'>('MENTOR');

  // --- Mentor Mode State ---
  const [hintLevel, setHintLevel] = useState<HintLevel>(1);
  const [currentHint, setCurrentHint] = useState<MentorHint | null>(null);
  const [isHintLoading, setIsHintLoading] = useState<boolean>(false);

  // --- Payload Forge State ---
  const templates = ghostOps.getPayloadTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<PayloadTemplate>(templates[0]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // --- Autopilot State ---
  const autopilotSteps = ghostOps.getAutopilotSteps(activeTarget.id);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [autopilotStatus, setAutopilotStatus] = useState<AutopilotStatus>('IDLE');

  // --- Provider Settings State ---
  const [providerConfig, setProviderConfig] = useState<AiProviderConfig>(ghostOps.getConfig());
  const [configSaved, setConfigSaved] = useState<boolean>(false);

  // Load hint when machine or level changes
  useEffect(() => {
    let isMounted = true;
    setIsHintLoading(true);
    ghostOps.getHint(activeTarget.id, hintLevel).then((hint) => {
      if (isMounted) {
        setCurrentHint(hint);
        setIsHintLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeTarget.id, hintLevel]);

  // Reset autopilot on target machine change
  useEffect(() => {
    setCurrentStepIndex(0);
    setAutopilotStatus('IDLE');
  }, [activeTarget.id]);

  // Autopilot loop when running
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (autopilotStatus === 'RUNNING') {
      timer = setTimeout(() => {
        handleAutopilotStepForward();
      }, 2500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autopilotStatus, currentStepIndex]);

  // --- Handlers ---

  const handleCopyText = (text: string) => {
    soundManager.playKey();
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleParamChange = (id: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [id]: value }));
  };

  const getRenderedPayload = () => {
    const mergedParams: Record<string, string> = {};
    selectedTemplate.parameters.forEach((p) => {
      mergedParams[p.id] = paramValues[p.id] !== undefined ? paramValues[p.id] : p.defaultValue;
    });
    return selectedTemplate.template(mergedParams);
  };

  const handleAutopilotStepForward = () => {
    if (currentStepIndex >= autopilotSteps.length) {
      setAutopilotStatus('COMPLETED');
      soundManager.playConnect();
      return;
    }

    const step = autopilotSteps[currentStepIndex];
    soundManager.playKey();
    const result = ghostOps.executeAutopilotStep(step);

    if (result.flagCaptured) {
      soundManager.playFlagSuccess();
    }

    if (currentStepIndex + 1 >= autopilotSteps.length) {
      setAutopilotStatus('COMPLETED');
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playKey();
    ghostOps.setProvider(providerConfig);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  return (
    <div className="flex h-full bg-[#070a0f] border border-slate-800 rounded-lg overflow-hidden font-mono shadow-2xl">
      {/* Left Navigation Column */}
      <div className="w-64 border-r border-slate-800 bg-[#0a0f17] p-4 flex flex-col justify-between text-xs select-none">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-bold mb-4 pb-2 border-b border-slate-800">
            <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="tracking-wider uppercase">GHOSTOPS AI COPILOT</span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => {
                soundManager.playKey();
                setAiMode('MENTOR');
              }}
              className={`w-full text-left px-3 py-2 rounded flex items-center space-x-2 transition ${
                aiMode === 'MENTOR'
                  ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Socratic Mentor</span>
            </button>

            <button
              onClick={() => {
                soundManager.playKey();
                setAiMode('PAYLOADS');
              }}
              className={`w-full text-left px-3 py-2 rounded flex items-center space-x-2 transition ${
                aiMode === 'PAYLOADS'
                  ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Payload Forge</span>
            </button>

            <button
              onClick={() => {
                soundManager.playKey();
                setAiMode('AUTOPILOT');
              }}
              className={`w-full text-left px-3 py-2 rounded flex items-center space-x-2 transition ${
                aiMode === 'AUTOPILOT'
                  ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Autopilot Red Team</span>
            </button>

            <button
              onClick={() => {
                soundManager.playKey();
                setAiMode('SETTINGS');
              }}
              className={`w-full text-left px-3 py-2 rounded flex items-center space-x-2 transition ${
                aiMode === 'SETTINGS'
                  ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Provider Settings</span>
            </button>
          </div>
        </div>

        {/* Current Target Selector */}
        <div className="bg-slate-900/80 p-3 rounded border border-slate-800 text-[11px] space-y-2">
          <span className="text-slate-500 block text-[9px] uppercase font-bold">TARGET MACHINE CONTEXT</span>
          <select
            value={activeTarget.id}
            onChange={(e) => setActiveMachine(e.target.value)}
            className="w-full bg-[#070a0f] border border-slate-800 text-slate-200 p-1.5 rounded text-xs outline-none focus:border-cyan-500"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.ip})
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>Level: <strong className="text-emerald-400">{activeTarget.compromiseLevel}</strong></span>
            <span>OS: <strong className="text-slate-300">{activeTarget.os}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 p-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.03)_0%,rgba(7,10,15,1)_100%)]">
        {/* MODE 1: SOCRATIC MENTOR */}
        {aiMode === 'MENTOR' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <span>SOCRATIC MENTOR // {activeTarget.name.toUpperCase()}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                ACTIVE PROVIDER: <strong className="text-cyan-400">{providerConfig.type.toUpperCase()}</strong>
              </span>
            </div>

            {/* Hint Level Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold block">GRADUATED HINT DEPTH</span>
              <div className="grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as HintLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      soundManager.playKey();
                      setHintLevel(lvl);
                    }}
                    className={`p-2.5 rounded border text-xs font-bold transition flex flex-col items-center justify-center ${
                      hintLevel === lvl
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-[#0c1017] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>LEVEL {lvl}</span>
                    <span className="text-[9px] font-normal opacity-80">
                      {lvl === 1 ? 'Direction' : lvl === 2 ? 'Service' : lvl === 3 ? 'Evidence' : lvl === 4 ? 'Next Step' : 'Walkthrough'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hint Display Card */}
            {isHintLoading ? (
              <div className="p-8 text-center bg-[#0c1017] border border-slate-800 rounded-xl text-slate-500">
                Evaluating target state and generating Socratic guidance...
              </div>
            ) : currentHint ? (
              <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-amber-400 font-bold text-xs">{currentHint.levelTitle}</span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Current Engagement Phase: <strong className="text-emerald-400">{currentHint.currentPhase}</strong>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Grounded in Virtual State
                  </span>
                </div>

                <p className="text-slate-200 text-xs leading-relaxed">
                  {currentHint.content}
                </p>

                {currentHint.suggestedAction && (
                  <div className="p-3 rounded bg-black/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">SUGGESTED TERMINAL ACTION</span>
                      <code className="text-cyan-400 text-xs font-mono">{currentHint.suggestedAction}</code>
                    </div>
                    <button
                      onClick={() => handleCopyText(currentHint.suggestedAction || '')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-1"
                    >
                      {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPayload ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                )}

                {/* Relevant Evidence */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-bold block">RELEVANT EVIDENCE & DISCOVERIES</span>
                  <div className="space-y-1">
                    {currentHint.relevantEvidence.map((ev, i) => (
                      <div key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* MODE 2: PAYLOAD FORGE */}
        {aiMode === 'PAYLOADS' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>OFFENSIVE PAYLOAD FORGE // TEMPLATE COMPOSER</span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Educational Mock Only — Will Not Execute Automatically</span>
              </span>
            </div>

            {/* Template Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    soundManager.playKey();
                    setSelectedTemplate(tpl);
                    setParamValues({});
                  }}
                  className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                    selectedTemplate.id === tpl.id
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300 font-bold'
                      : 'bg-[#0c1017] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs text-white block mb-1">{tpl.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-slate-800 text-slate-400 inline-block w-fit">
                    {tpl.category}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Template Editor */}
            <div className="bg-[#0c1017] border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="font-bold text-white text-sm">{selectedTemplate.title}</h3>
                <p className="text-slate-400 text-xs mt-1">{selectedTemplate.educationalExplanation}</p>
              </div>

              {/* Configurable Parameters */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">CONFIGURABLE PARAMETERS</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTemplate.parameters.map((p) => (
                    <div key={p.id} className="space-y-1">
                      <label className="text-[11px] text-slate-300 block">{p.label}</label>
                      <input
                        type="text"
                        value={paramValues[p.id] !== undefined ? paramValues[p.id] : p.defaultValue}
                        onChange={(e) => handleParamChange(p.id, e.target.value)}
                        placeholder={p.placeholder}
                        className="w-full bg-[#070a0f] border border-slate-800 text-cyan-300 p-2 rounded text-xs outline-none focus:border-cyan-500 font-mono"
                      />
                      <span className="text-[9px] text-slate-500">{p.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Output */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">GENERATED PAYLOAD PREVIEW</span>
                  <button
                    onClick={() => handleCopyText(getRenderedPayload())}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPayload ? 'COPIED TO CLIPBOARD' : 'COPY PAYLOAD'}</span>
                  </button>
                </div>
                <pre className="text-xs font-mono text-emerald-400 bg-black/60 p-3 rounded border border-slate-800/80 overflow-x-auto select-all leading-relaxed">
                  <code>{getRenderedPayload()}</code>
                </pre>
              </div>

              {/* Safety Notes */}
              <div className="p-3 rounded bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300/80">
                <strong>Safety Disclaimer:</strong> {selectedTemplate.safetyNotes}
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: AUTOPILOT RED TEAM */}
        {aiMode === 'AUTOPILOT' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <span>ADVERSARY SIMULATION AUTOPILOT // {activeTarget.name.toUpperCase()}</span>
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold border ${
                autopilotStatus === 'RUNNING'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800 animate-pulse'
                  : autopilotStatus === 'COMPLETED'
                  ? 'bg-purple-950 text-purple-400 border-purple-800'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}>
                STATUS: {autopilotStatus}
              </span>
            </div>

            {/* Autopilot Controls */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c1017] border border-slate-800">
              <div className="flex items-center space-x-2">
                <button
                  disabled={autopilotStatus === 'RUNNING' || autopilotStatus === 'COMPLETED'}
                  onClick={() => {
                    soundManager.playKey();
                    setAutopilotStatus('RUNNING');
                  }}
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>START AUTOPILOT</span>
                </button>

                <button
                  disabled={autopilotStatus !== 'RUNNING'}
                  onClick={() => {
                    soundManager.playKey();
                    setAutopilotStatus('PAUSED');
                  }}
                  className="px-3 py-1.5 rounded bg-amber-950 hover:bg-amber-900 disabled:opacity-40 text-amber-300 border border-amber-800 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE</span>
                </button>

                <button
                  disabled={autopilotStatus === 'RUNNING' || currentStepIndex >= autopilotSteps.length}
                  onClick={handleAutopilotStepForward}
                  className="px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 disabled:opacity-40 text-cyan-300 border border-cyan-800 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>STEP FORWARD</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playKey();
                    setAutopilotStatus('STOPPED');
                    setCurrentStepIndex(0);
                  }}
                  className="px-3 py-1.5 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>RESET AUTOPILOT</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                Step <strong className="text-white">{Math.min(currentStepIndex + 1, autopilotSteps.length)}</strong> of {autopilotSteps.length}
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-3">
              {autopilotSteps.map((step, idx) => {
                const isExecuted = idx < currentStepIndex || autopilotStatus === 'COMPLETED';
                const isCurrent = idx === currentStepIndex && autopilotStatus !== 'COMPLETED';

                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-slate-900 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : isExecuted
                        ? 'bg-[#0c1017] border-slate-800 opacity-90'
                        : 'bg-[#080c12] border-slate-800/60 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isExecuted
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : isCurrent
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-slate-900 text-slate-500'
                        }`}>
                          STEP 0{step.stepNumber} // {step.phase}
                        </span>
                        <h4 className="font-bold text-xs text-white">{step.title}</h4>
                      </div>
                      <span className="text-[10px] text-slate-500">{step.explanation}</span>
                    </div>

                    <div className="p-2.5 rounded bg-black/70 border border-slate-800/80 font-mono text-[11px] space-y-1.5">
                      <div className="text-cyan-400">$ {step.simulatedCommand}</div>
                      {isExecuted && (
                        <div className="text-slate-400 whitespace-pre-wrap text-[10px] pt-1 border-t border-slate-800/60">
                          {step.simulatedOutput}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 4: PROVIDER SETTINGS */}
        {aiMode === 'SETTINGS' && (
          <div className="space-y-4 max-w-2xl">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" />
                <span>AI PROVIDER CONFIGURATION & ABSTRACTION</span>
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Configure GhostOps to use deterministic offline guidance or connect to optional self-hosted Ollama and external LLM endpoints.
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="bg-[#0c1017] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold block">Active Provider</label>
                <select
                  value={providerConfig.type}
                  onChange={(e) => setProviderConfig((prev) => ({ ...prev, type: e.target.value as AiProviderType }))}
                  className="w-full bg-[#070a0f] border border-slate-800 text-white p-2.5 rounded text-xs outline-none focus:border-cyan-500"
                >
                  <option value="offline">Offline Deterministic Engine (No API Key Required // Default)</option>
                  <option value="ollama">Local Ollama Service (http://localhost:11434)</option>
                  <option value="openai">OpenAI Compatible Endpoint</option>
                  <option value="anthropic">Anthropic Compatible Endpoint</option>
                  <option value="gemini">Google Gemini API</option>
                </select>
                <span className="text-[10px] text-slate-500">
                  ROOTRANGE never sends code to external servers unless an external provider is explicitly configured.
                </span>
              </div>

              {providerConfig.type !== 'offline' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-bold block">Base URL / Endpoint</label>
                    <input
                      type="text"
                      value={providerConfig.baseUrl || ''}
                      onChange={(e) => setProviderConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder={providerConfig.type === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com/v1'}
                      className="w-full bg-[#070a0f] border border-slate-800 text-white p-2 rounded text-xs outline-none focus:border-cyan-500"
                    />
                  </div>

                  {providerConfig.type !== 'ollama' && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-bold block">API Key (Stored in Session Memory Only)</label>
                      <input
                        type="password"
                        value={providerConfig.apiKey || ''}
                        onChange={(e) => setProviderConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="sk-..."
                        className="w-full bg-[#070a0f] border border-slate-800 text-white p-2 rounded text-xs outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-bold block">Model Name</label>
                    <input
                      type="text"
                      value={providerConfig.model || ''}
                      onChange={(e) => setProviderConfig((prev) => ({ ...prev, model: e.target.value }))}
                      placeholder={providerConfig.type === 'ollama' ? 'llama3' : 'gpt-4o-mini'}
                      className="w-full bg-[#070a0f] border border-slate-800 text-white p-2 rounded text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition"
              >
                APPLY PROVIDER SETTINGS
              </button>

              {configSaved && (
                <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-600/60 text-emerald-300 flex items-center gap-2 text-xs">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Provider settings successfully updated!</span>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
