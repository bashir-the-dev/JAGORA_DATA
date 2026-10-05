import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './ActionModals';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  apiTestConnection,
  getAuthToken,
  DEFAULT_API_BASE_URL,
} from '../../services/apiClient';
import { Server, CheckCircle2, AlertTriangle, RefreshCw, Database, Key, Download, FileText } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightMode?: boolean;
  onConnectionChange?: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  isLightMode,
  onConnectionChange,
}) => {
  const [url, setUrl] = useState(getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; plansCount?: number } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiBaseUrl());
      setToken(getAuthToken());
      handleTest(getApiBaseUrl());
    }
  }, [isOpen]);

  const handleTest = async (testUrl?: string) => {
    const target = testUrl || url;
    setIsTesting(true);
    setTestResult(null);

    // Save temporary if user typed it
    if (target) {
      setApiBaseUrl(target);
    }

    const result = await apiTestConnection();
    setTestResult(result);
    setIsTesting(false);
    if (onConnectionChange) onConnectionChange();
  };

  const handleSave = () => {
    setApiBaseUrl(url);
    handleTest(url);
  };

  const handlePreset = (presetUrl: string) => {
    setUrl(presetUrl);
    setApiBaseUrl(presetUrl);
    handleTest(presetUrl);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Backend API Connection" isLightMode={isLightMode}>
      <div className="space-y-4 font-sans text-xs">
        {/* Explanation */}
        <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-slate-700 dark:text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#0047cc] dark:text-blue-400">
            <Server size={15} />
            <span>Connect to Your PHP / MySQL Server</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Link this web interface directly with your local XAMPP backend or your production cPanel API.
          </p>
        </div>

        {/* Status result card */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 transition-all ${
              testResult.ok
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-bold text-xs">
                {testResult.ok ? 'Connection Active & Operational' : 'Connection Failed'}
              </p>
              <p className="text-[11px] leading-snug">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="space-y-1.5">
          <label className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
            API Base Endpoint
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost/jagora-api"
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0047cc] focus:ring-1 focus:ring-[#0047cc]"
            />
            <button
              onClick={() => handleTest()}
              disabled={isTesting}
              className="px-3.5 py-2.5 rounded-xl bg-[#0047cc] hover:bg-[#003eb8] text-white font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
              <span>{isTesting ? 'Testing...' : 'Test'}</span>
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Quick Presets / Third-Party Hosting:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handlePreset('https://alaminjagoradata.com.ng')}
              className="px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300"
            >
              Live cPanel: alaminjagoradata.com.ng
            </button>
            <button
              type="button"
              onClick={() => handlePreset('http://localhost/jagora-api')}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300"
            >
              Local: http://localhost/jagora-api
            </button>
          </div>
        </div>

        {/* Configured Gateways Overview */}
        <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
              <Database size={13} className="text-[#0047cc] dark:text-blue-400" />
              VTU Provider:
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900 text-[11px]">
              ClubKonnect (CK101290315)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
              <Key size={13} className="text-[#0047cc] dark:text-blue-400" />
              Automated Funding:
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900 text-[11px]">
              Monnify (Y1NYAQEH8RD5)
            </span>
          </div>
        </div>

        {/* PDF Integration Manual Download */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">API Integration Manual</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Step-by-step PDF guide with code samples</p>
            </div>
          </div>
          <a
            href="/api/docs/api-guide.pdf"
            download="Alamin_Jagora_Data_API_Integration_Manual.pdf"
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-2xs transition-all active:scale-95"
          >
            <Download size={13} />
            <span>Download PDF</span>
          </a>
        </div>

        {/* Active Auth Token status */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Key size={13} />
            <span>Active Session Token:</span>
          </div>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
            {token ? `${token.slice(0, 10)}...${token.slice(-6)}` : 'None (Guest Mode)'}
          </span>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={() => {
            handleSave();
            onClose();
          }}
          className="w-full mt-3 bg-[#0047cc] hover:bg-[#003eb8] text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] text-center"
        >
          Save & Close
        </button>
      </div>
    </ModalWrapper>
  );
};
