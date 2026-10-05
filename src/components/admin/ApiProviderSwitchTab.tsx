import React, { useState } from 'react';
import { ApiProvider, ServiceRouteConfig, UpstreamProviderId } from '../../types';
import {
  Server,
  Shuffle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Settings,
  Shield,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Power,
  Zap,
  AlertOctagon,
  ShieldAlert,
  RadioReceiver,
  Cpu,
  Lock,
} from 'lucide-react';

interface ApiProviderSwitchTabProps {
  providers: ApiProvider[];
  routes: ServiceRouteConfig[];
  onUpdateRoute: (
    routeId: string,
    updates: Partial<{
      primaryProviderId: UpstreamProviderId;
      fallbackProviderId: UpstreamProviderId;
      autoFailover: boolean;
      status: 'active' | 'paused';
    }>
  ) => void;
  onPingAllProviders: () => void;
  isPinging: boolean;
  isLightMode?: boolean;
  gatewaySwitches?: Record<string, boolean>;
  serviceSwitches?: Record<string, boolean>;
  onToggleGatewaySwitch?: (gateway: string, active: boolean) => Promise<void> | void;
  onToggleServiceSwitch?: (service: string, active: boolean) => Promise<void> | void;
}

export const ApiProviderSwitchTab: React.FC<ApiProviderSwitchTabProps> = ({
  providers,
  routes,
  onUpdateRoute,
  onPingAllProviders,
  isPinging,
  isLightMode,
  gatewaySwitches: initialGatewaySwitches,
  serviceSwitches: initialServiceSwitches,
  onToggleGatewaySwitch,
  onToggleServiceSwitch,
}) => {
  const [selectedProviderForConfig, setSelectedProviderForConfig] = useState<ApiProvider | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Master Gateway Switches state with optimistic updates
  const [localGatewaySwitches, setLocalGatewaySwitches] = useState<Record<string, boolean>>({
    payflex: true,
    clubkonnect: true,
    payvessel: true,
    monnify: true,
    husmodata: true,
    ...(initialGatewaySwitches || {}),
  });

  // Service Fulfillment Switches state with optimistic updates
  const [localServiceSwitches, setLocalServiceSwitches] = useState<Record<string, boolean>>({
    data: true,
    airtime: true,
    cable: true,
    electricity: true,
    exam: true,
    recharge_pin: true,
    data_card: true,
    ...(initialServiceSwitches || {}),
  });

  const [togglingGateway, setTogglingGateway] = useState<string | null>(null);
  const [togglingService, setTogglingService] = useState<string | null>(null);

  // Sync external changes
  React.useEffect(() => {
    if (initialGatewaySwitches) {
      setLocalGatewaySwitches((prev) => ({ ...prev, ...initialGatewaySwitches }));
    }
  }, [initialGatewaySwitches]);

  React.useEffect(() => {
    if (initialServiceSwitches) {
      setLocalServiceSwitches((prev) => ({ ...prev, ...initialServiceSwitches }));
    }
  }, [initialServiceSwitches]);

  const handleGatewayToggle = async (gatewayKey: string) => {
    const currentStatus = localGatewaySwitches[gatewayKey] !== false;
    const nextStatus = !currentStatus;

    // Optimistic UI update
    setLocalGatewaySwitches((prev) => ({ ...prev, [gatewayKey]: nextStatus }));
    setTogglingGateway(gatewayKey);

    if (onToggleGatewaySwitch) {
      try {
        await onToggleGatewaySwitch(gatewayKey, nextStatus);
      } catch (err) {
        // Rollback on failure
        setLocalGatewaySwitches((prev) => ({ ...prev, [gatewayKey]: currentStatus }));
      } finally {
        setTogglingGateway(null);
      }
    } else {
      setTogglingGateway(null);
    }
  };

  const handleServiceToggle = async (serviceKey: string) => {
    const currentStatus = localServiceSwitches[serviceKey] !== false;
    const nextStatus = !currentStatus;

    // Optimistic UI update
    setLocalServiceSwitches((prev) => ({ ...prev, [serviceKey]: nextStatus }));
    setTogglingService(serviceKey);

    if (onToggleServiceSwitch) {
      try {
        await onToggleServiceSwitch(serviceKey, nextStatus);
      } catch (err) {
        setLocalServiceSwitches((prev) => ({ ...prev, [serviceKey]: currentStatus }));
      } finally {
        setTogglingService(null);
      }
    } else {
      setTogglingService(null);
    }
  };

  const filteredRoutes = routes.filter((r) => {
    if (categoryFilter === 'all') return true;
    return r.serviceCategory === categoryFilter;
  });

  const handleCopyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  // Upstream Gateway definition cards
  const upstreamGateways = [
    {
      key: 'payflex',
      name: 'Payflex (Peyflex) Wholesale Gateway',
      badge: 'PF',
      role: 'PRIMARY LAUNCH GATEWAY (ALL SERVICES)',
      isPrimary: true,
      color: 'blue',
      description:
        'Main wholesale provider for Data (MTN SME/CG, Airtel, Glo, 9mobile), Airtime Top-Up, Cable TV, Electricity DISCOs, and Exam PINs.',
      endpoint: 'https://client.peyflex.com.ng/api',
    },
    {
      key: 'clubkonnect',
      name: 'ClubKonnect Gateway',
      badge: 'CK',
      role: 'AUTOMATIC FAILOVER GATEWAY',
      isPrimary: false,
      color: 'amber',
      description:
        'Secondary failover gateway for Airtime VTU, Cable TV renewals, and Electricity payments when Payflex is in maintenance.',
      endpoint: 'https://www.clubkonnect.com/API',
    },
    {
      key: 'payvessel',
      name: 'Payvessel Virtual Accounts Gateway',
      badge: 'PV',
      role: 'DEDICATED CBN VIRTUAL ACCOUNTS',
      isPrimary: false,
      color: 'emerald',
      description:
        'Generates dedicated Nigerian bank accounts (Palmpay / 9PSB / Wema) for instant automatic customer wallet funding.',
      endpoint: 'https://api.payvessel.com/api/v1',
    },
    {
      key: 'monnify',
      name: 'Monnify Gateway',
      badge: 'MN',
      role: 'CHECKOUT & BACKUP ACCOUNTS',
      isPrimary: false,
      color: 'purple',
      description:
        'Monnify card checkout and secondary virtual account reservation switch.',
      endpoint: 'https://api.monnify.com',
    },
    {
      key: 'husmodata',
      name: 'HusmoData REST API Gateway',
      badge: 'HD',
      role: 'WHOLESALE TOKEN BACKUP',
      isPrimary: false,
      color: 'slate',
      description:
        'Token-authenticated REST backup provider for data bundle fulfillment.',
      endpoint: 'https://husmodata.com/api',
    },
  ];

  const serviceCategories = [
    { key: 'data', name: 'Data Bundle Vending', desc: 'MTN SME/CG, Airtel, Glo & 9mobile' },
    { key: 'airtime', name: 'Airtime VTU Recharge', desc: 'Instant VTU airtime top-ups' },
    { key: 'cable', name: 'Cable TV Subscriptions', desc: 'DSTV, GOtv & StarTimes bouquets' },
    { key: 'electricity', name: 'Electricity DISCO Bills', desc: 'Prepaid tokens & postpaid bills' },
    { key: 'exam', name: 'Exam PIN Dispenser', desc: 'WAEC, NECO, NABTEB result checker PINs' },
    { key: 'recharge_pin', name: 'Recharge Voucher PINs', desc: 'Airtime voucher printing' },
    { key: 'data_card', name: 'Data Card Printing', desc: 'Offline data voucher cards' },
  ];

  const anyGatewayShutdown = upstreamGateways.some(
    (gw) => localGatewaySwitches[gw.key] === false
  );

  return (
    <div id="admin-provider-switch-tab" className="space-y-6 pb-16">
      {/* ========================================================================= */}
      {/* 1. MASTER GATEWAY SHUTDOWN SWITCHES (EMERGENCY KILL SWITCH CONSOLE) */}
      {/* ========================================================================= */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all ${
          isLightMode
            ? 'bg-white border-slate-200 shadow-xs'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert size={20} className="text-rose-500" />
              <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Master Upstream Gateway Shutdown Switches
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Admin emergency kill switches: Turn off any gateway to completely terminate traffic
              to that API until turned back on manually.
            </p>
          </div>

          {anyGatewayShutdown && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold animate-pulse">
              <AlertOctagon size={14} />
              <span>Gateway Shutdown Active</span>
            </div>
          )}
        </div>

        {/* Warning banner when a gateway is shut down */}
        {anyGatewayShutdown && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold block">One or more upstream gateways are currently shut down.</span>
              <span className="text-[11px] opacity-90">
                Customer requests targeting shut-down gateways will be safely redirected to active backup failovers
                or cleanly refunded to the customer wallet. No requests will hit disabled gateways.
              </span>
            </div>
          </div>
        )}

        {/* Gateway Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upstreamGateways.map((gw) => {
            const isActive = localGatewaySwitches[gw.key] !== false;
            const isProcessing = togglingGateway === gw.key;

            return (
              <div
                key={gw.key}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  !isActive
                    ? 'border-rose-500/70 bg-rose-50/20 dark:bg-rose-950/20'
                    : isLightMode
                    ? 'border-slate-200 bg-slate-50/70 hover:border-blue-300'
                    : 'border-slate-800 bg-slate-800/40 hover:border-blue-900'
                }`}
              >
                <div>
                  {/* Top Bar: Badge, Name, Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                          !isActive
                            ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                            : gw.isPrimary
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {gw.badge}
                      </div>
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                          {gw.name}
                        </h3>
                        <span
                          className={`text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm inline-block mt-0.5 ${
                            gw.isPrimary
                              ? 'bg-blue-100 dark:bg-blue-950 text-[#0047cc] dark:text-blue-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {gw.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 mb-3">
                    {gw.description}
                  </p>
                </div>

                {/* Bottom Bar: Operational State Indicator & Action Switch */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold font-mono ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isActive ? 'OPERATIONAL (ACTIVE)' : 'SHUTDOWN (PAUSED)'}
                    </span>
                  </div>

                  {/* Switch Toggle Button (44px min touch target) */}
                  <button
                    type="button"
                    onClick={() => handleGatewayToggle(gw.key)}
                    disabled={isProcessing}
                    aria-label={`Toggle ${gw.name} status`}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900 border border-rose-300 dark:border-rose-800'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    }`}
                  >
                    <Power size={14} className={isProcessing ? 'animate-spin' : ''} />
                    <span>{isActive ? 'Shut Down' : 'Turn On'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PER-SERVICE FULFILLMENT KILL SWITCHES */}
      {/* ========================================================================= */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all ${
          isLightMode
            ? 'bg-white border-slate-200 shadow-xs'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="mb-4">
          <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RadioReceiver size={18} className="text-[#0047cc] dark:text-blue-400" />
            <span>Service Delivery Operational Switches</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pause or resume individual VTU telecom and bill payment service categories instantly
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {serviceCategories.map((svc) => {
            const isSvcActive = localServiceSwitches[svc.key] !== false;
            const isProcessing = togglingService === svc.key;

            return (
              <div
                key={svc.key}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  !isSvcActive
                    ? 'border-amber-400/80 bg-amber-50/20 dark:bg-amber-950/20'
                    : isLightMode
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-slate-800 bg-slate-800/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {svc.name}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSvcActive ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">
                    {svc.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase ${
                      isSvcActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isSvcActive ? 'Accepting Orders' : 'Paused by Admin'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleServiceToggle(svc.key)}
                    disabled={isProcessing}
                    aria-label={`Toggle ${svc.name}`}
                    className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      isSvcActive
                        ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Power size={12} />
                    <span>{isSvcActive ? 'Pause' : 'Activate'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GATEWAY HEALTH & LATENCY MONITOR */}
      {/* ========================================================================= */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all ${
          isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server size={18} className="text-[#0047cc] dark:text-blue-400" />
              <span>Upstream Gateway API Latency & Float Health</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live round-trip ping latency and wholesale vendor float balances
            </p>
          </div>

          <button
            onClick={onPingAllProviders}
            disabled={isPinging}
            className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-400 hover:bg-blue-100 font-bold text-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw size={14} className={isPinging ? 'animate-spin' : ''} />
            <span>{isPinging ? 'Testing Gateway APIs...' : 'Ping All Gateways'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {providers.map((p) => {
            const isDegraded = p.status === 'degraded' || p.avgLatencyMs > 2000;
            const isSwitchedOff = localGatewaySwitches[p.id] === false;

            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSwitchedOff
                    ? 'border-rose-400/80 bg-rose-50/20 dark:bg-rose-950/20'
                    : isDegraded
                    ? 'border-amber-400/80 bg-amber-50/20 dark:bg-amber-950/20'
                    : isLightMode
                    ? 'border-slate-200 bg-slate-50/60'
                    : 'border-slate-800 bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {p.name}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSwitchedOff
                        ? 'bg-rose-500'
                        : p.status === 'active'
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-500'
                    }`}
                  />
                </div>

                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-mono font-bold">
                    Live Float
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    ₦{p.floatBalance.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-mono font-bold">
                    Latency
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                    {isSwitchedOff ? 'OFFLINE' : `${p.avgLatencyMs} ms`}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-mono font-bold">
                    Success Rate
                  </span>
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {isSwitchedOff ? 'PAUSED' : `${p.successRate}%`}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedProviderForConfig(p)}
                  className="w-full text-center min-h-[36px] py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  API Keys & Endpoints
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DYNAMIC SERVICE ROUTING & SWITCHING MATRIX */}
      {/* ========================================================================= */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all ${
          isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-sans text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shuffle size={18} className="text-[#0047cc] dark:text-blue-400" />
              <span>Service Provider Routing & Failover Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set primary fulfillment gateways and automated fallback failover triggers
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs overflow-x-auto">
            {['all', 'data', 'airtime', 'utility', 'cable'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`min-h-[36px] px-3 py-1 rounded-lg font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-white dark:bg-slate-900 text-[#0047cc] dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Services' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Routing List */}
        <div className="space-y-3.5">
          {filteredRoutes.map((route) => {
            const isPaused = route.status === 'paused';
            return (
              <div
                key={route.id}
                className={`p-4 rounded-xl border transition-all ${
                  isPaused
                    ? 'opacity-70 border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50'
                    : isLightMode
                    ? 'border-slate-200 bg-slate-50/70 hover:bg-white'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Service Info */}
                  <div className="min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          route.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {route.serviceName}
                      </h3>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Cost: <span className="text-slate-700 dark:text-slate-300 font-semibold">{route.costPriceDescription}</span> • Retail: {route.sellingPriceDescription}
                    </div>
                  </div>

                  {/* Middle: Provider Switch Selectors */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Primary Provider Selector */}
                    <div>
                      <label className="text-[10px] font-bold uppercase font-mono text-slate-700 dark:text-slate-300 block mb-1">
                        Primary Gateway (Active)
                      </label>
                      <select
                        value={route.primaryProviderId}
                        onChange={(e) =>
                          onUpdateRoute(route.id, {
                            primaryProviderId: e.target.value as UpstreamProviderId,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-700 font-bold text-xs text-[#0047cc] dark:text-blue-400 focus:outline-none shadow-xs"
                      >
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₦{p.floatBalance.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-slate-300 dark:text-slate-700 hidden sm:block">
                      ➔
                    </div>

                    {/* Fallback Provider Selector */}
                    <div>
                      <label className="text-[10px] font-bold uppercase font-mono text-slate-700 dark:text-slate-300 block mb-1">
                        Backup Gateway (Failover)
                      </label>
                      <select
                        value={route.fallbackProviderId}
                        onChange={(e) =>
                          onUpdateRoute(route.id, {
                            fallbackProviderId: e.target.value as UpstreamProviderId,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right: Controls & Toggles */}
                  <div className="flex items-center gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
                    {/* Auto-failover Toggle */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Auto-Failover
                      </label>
                      <button
                        onClick={() =>
                          onUpdateRoute(route.id, { autoFailover: !route.autoFailover })
                        }
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          route.autoFailover ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            route.autoFailover ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Route Active/Pause Toggle */}
                    <button
                      onClick={() =>
                        onUpdateRoute(route.id, {
                          status: route.status === 'active' ? 'paused' : 'active',
                        })
                      }
                      className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                        route.status === 'active'
                          ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Power size={13} />
                      <span>{route.status === 'active' ? 'Pause Route' : 'Activate'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. API CONFIGURATION & WEBHOOK MODAL */}
      {/* ========================================================================= */}
      {selectedProviderForConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-400 flex items-center justify-center font-bold text-xs font-mono">
                  {selectedProviderForConfig.badge}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedProviderForConfig.name} Configuration
                  </h3>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-mono font-medium">
                    Gateway ID: {selectedProviderForConfig.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProviderForConfig(null)}
                className="min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase font-mono text-slate-700 dark:text-slate-300 block mb-1">
                  API Endpoint Base URL
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedProviderForConfig.endpointUrl}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase font-mono text-slate-700 dark:text-slate-300 block mb-1">
                  Live Production Secret Key
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedProviderForConfig.maskedApiKey}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase font-mono text-slate-700 dark:text-slate-300 block mb-1">
                  Inbound Webhook Callback URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      typeof window !== 'undefined'
                        ? `${window.location.origin}/api/webhooks/${selectedProviderForConfig.id}`
                        : `https://api.jagora.ng/api/webhooks/${selectedProviderForConfig.id}`
                    }
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() =>
                      handleCopyWebhook(
                        typeof window !== 'undefined'
                          ? `${window.location.origin}/api/webhooks/${selectedProviderForConfig.id}`
                          : `https://api.jagora.ng/api/webhooks/${selectedProviderForConfig.id}`
                      )
                    }
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0047cc] dark:text-blue-400 font-bold flex items-center gap-1 hover:bg-blue-100 cursor-pointer"
                  >
                    {copiedWebhook ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase font-mono text-slate-700 dark:text-slate-300 block mb-1">
                  Assigned Services Handled by this Gateway
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProviderForConfig.supportedServices.map((srv) => (
                    <span
                      key={srv}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Emergency Gateway Escalation:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedProviderForConfig.contactSupport}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedProviderForConfig(null)}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer"
              >
                Close Gateway Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
