import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Crown,
  Headphones,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Key,
  Lock,
  Mail,
  Phone,
  Trash2,
  Power,
  RefreshCw,
  Search,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  Clock,
  Sparkles,
  UserCog,
} from 'lucide-react';
import { StaffAgent, StaffPermissions, AdminRole } from '../../types';
import {
  apiGetStaffAgents,
  apiCreateStaffAgent,
  apiToggleStaffStatus,
  apiDeleteStaffAgent,
  apiGetAdminAuditLogs
} from '../../services/apiClient';
import { ActionConfirmModal } from '../modals/ActionConfirmModal';

interface StaffManagementTabProps {
  isLightMode?: boolean;
  showToast: (msg: string) => void;
  currentAdminRole?: AdminRole;
  onOpenProfile?: () => void;
}

export const StaffManagementTab: React.FC<StaffManagementTabProps> = ({
  isLightMode,
  showToast,
  currentAdminRole = 'super_admin',
  onOpenProfile,
}) => {
  const [agents, setAgents] = useState<StaffAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'support_agent' | 'finance_agent'>('all');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<StaffAgent | null>(null);
  const [agentToToggle, setAgentToToggle] = useState<StaffAgent | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // New Agent Form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<'support_agent' | 'finance_agent'>('support_agent');
  const [formError, setFormError] = useState<string | null>(null);

  // Granular Permissions configuration
  const [permissions, setPermissions] = useState<StaffPermissions>({
    canViewTransactions: true,
    canRequeryOrders: true,
    canRefundOrders: true,
    canFundWallets: false,
    canModifyPricing: false,
    canManageGateways: false,
    canManageStaff: false,
  });

  // Automatically adjust default permissions based on chosen role
  const handleRoleChange = (role: 'support_agent' | 'finance_agent') => {
    setNewRole(role);
    if (role === 'support_agent') {
      setPermissions({
        canViewTransactions: true,
        canRequeryOrders: true,
        canRefundOrders: true,
        canFundWallets: false,
        canModifyPricing: false,
        canManageGateways: false,
        canManageStaff: false,
      });
    } else {
      setPermissions({
        canViewTransactions: true,
        canRequeryOrders: true,
        canRefundOrders: false,
        canFundWallets: true,
        canModifyPricing: false,
        canManageGateways: false,
        canManageStaff: false,
      });
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await apiGetStaffAgents();
      if (res.status === 'success' && Array.isArray(res.data)) {
        const normalized: StaffAgent[] = res.data.map((agent: any) => {
          const isMasterCEO =
            agent.phone === '08123456789' ||
            agent.email?.toLowerCase() === 'bashirabubakar650@gmail.com' ||
            agent.adminRole === 'super_admin' ||
            agent.role === 'super_admin' ||
            agent.id === 'usr_admin_01';

          const fallbackPermissions: StaffPermissions = {
            canViewTransactions: true,
            canRequeryOrders: true,
            canRefundOrders: isMasterCEO,
            canFundWallets: isMasterCEO || agent.adminRole === 'finance_agent',
            canModifyPricing: isMasterCEO,
            canManageGateways: isMasterCEO,
            canManageStaff: isMasterCEO,
          };

          return {
            id: String(agent.id || agent.phone || Math.random().toString()),
            name: agent.name || agent.fullName || 'Staff Agent',
            email: agent.email || '',
            phone: agent.phone || '',
            role: isMasterCEO ? 'admin' : (agent.role || 'admin'),
            adminRole: isMasterCEO ? 'super_admin' : (agent.adminRole || 'support_agent'),
            status: agent.status || 'active',
            assignedBy: agent.assignedBy || (isMasterCEO ? 'Root System Owner' : 'CEO Admin'),
            createdAt: agent.createdAt || new Date().toISOString(),
            permissions: {
              ...fallbackPermissions,
              ...(agent.permissions || {}),
            },
          };
        });
        setAgents(normalized);
      }
      // Also fetch recent audit logs
      const logRes = await apiGetAdminAuditLogs(20);
      if (logRes.status === 'success' && Array.isArray(logRes.data)) {
        setAuditLogs(logRes.data.filter((l: any) => l.action?.startsWith('ADMIN_STAFF') || l.action === 'ADMIN_LOGIN'));
      }
    } catch (err: any) {
      console.error('Failed to load staff agents:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAgents();
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim()) {
      setFormError('Staff agent full name is required.');
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setFormError('Valid email is required (used for individual 2FA Email OTP).');
      return;
    }
    if (!newPhone.trim() || newPhone.replace(/\D/g, '').length < 10) {
      setFormError('Valid 11-digit Nigerian phone number is required.');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (!/^\d{4}$/.test(newPin.trim())) {
      setFormError('Personal staff security PIN must be exactly 4 digits.');
      return;
    }

    setIsCreating(true);
    try {
      const res = await apiCreateStaffAgent({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        password: newPassword,
        pin: newPin.trim(),
        adminRole: newRole,
        permissions,
      });

      if (res.status === 'success' && res.data) {
        showToast(`Staff agent "${newName}" created successfully as ${newRole === 'support_agent' ? 'Support Agent' : 'Finance Agent'}.`);
        setIsAddModalOpen(false);
        // Reset form
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewPassword('');
        setNewPin('');
        handleRoleChange('support_agent');
        fetchAgents();
      } else {
        setFormError(res.message || 'Failed to create staff account.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Server error occurred while creating staff member.');
    } finally {
      setIsCreating(false);
    }
  };

  const promptToggleStatus = (agent: StaffAgent) => {
    if (agent.adminRole === 'super_admin') {
      showToast('Master CEO account cannot be suspended.');
      return;
    }
    setAgentToToggle(agent);
  };

  const confirmToggleStatus = async () => {
    if (!agentToToggle) return;
    setIsActionLoading(true);
    const nextStatus = agentToToggle.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await apiToggleStaffStatus(agentToToggle.phone, nextStatus);
      if (res.status === 'success') {
        showToast(`Account for ${agentToToggle.name} is now ${nextStatus.toUpperCase()}.`);
        setAgents((prev) =>
          prev.map((a) => (a.id === agentToToggle.id ? { ...a, status: nextStatus } : a))
        );
        setAgentToToggle(null);
      } else {
        showToast(res.message || 'Failed to change staff status.');
      }
    } catch {
      showToast('Error updating staff status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const promptDeleteAgent = (agent: StaffAgent) => {
    if (agent.adminRole === 'super_admin') {
      showToast('Master CEO account cannot be deleted.');
      return;
    }
    setAgentToDelete(agent);
  };

  const confirmDeleteAgent = async () => {
    if (!agentToDelete) return;
    setIsActionLoading(true);
    try {
      const res = await apiDeleteStaffAgent(agentToDelete.phone);
      if (res.status === 'success') {
        showToast(`Staff agent ${agentToDelete.name} has been removed.`);
        setAgents((prev) => prev.filter((a) => a.id !== agentToDelete.id));
        setAgentToDelete(null);
      } else {
        showToast(res.message || 'Failed to remove staff agent.');
      }
    } catch {
      showToast('Error deleting staff agent.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter agents list
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.phone.includes(searchQuery);

    const matchesRole =
      roleFilter === 'all' || agent.adminRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  const ceoUser = agents.find((a) => a.adminRole === 'super_admin');
  const supportAgents = agents.filter((a) => a.adminRole === 'support_agent');
  const financeAgents = agents.filter((a) => a.adminRole === 'finance_agent');

  return (
    <div id="staff-management-tab" className="space-y-6">
      {/* CEO Command & Master Role Architecture Banner */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isLightMode
          ? 'bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white border-blue-800/50 shadow-xl'
          : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-black text-white border-blue-900/40 shadow-2xl'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black tracking-wide">
              <Crown size={14} className="text-amber-400" />
              <span>CEO MASTER ROOT ACCESS ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Staff & Delegated Agent Hierarchy
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              As the <span className="text-amber-300 font-bold">CEO (Master Administrator)</span>, you retain absolute authority over billing, telecom APIs, and system settings. Create dedicated accounts for subordinates with specialized access so they can resolve customer disputes or verify deposits without accessing sensitive master credentials.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all flex items-center gap-2 text-xs font-bold"
              title="Refresh staff records"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Sync Directory</span>
            </button>

            <button
              onClick={() => {
                setFormError(null);
                setIsAddModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center gap-2 active:scale-95"
            >
              <UserPlus size={18} />
              <span>Enroll New Agent</span>
            </button>
          </div>
        </div>

        {/* 3-Tier Hierarchy Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          {/* Tier 1: CEO */}
          <div className="p-4 rounded-2xl bg-white/5 border border-amber-400/20 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30 shrink-0">
              <Crown size={24} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold uppercase tracking-wider">
                <span>Tier 1 • CEO / Super Admin</span>
              </div>
              <p className="text-base font-black text-white">{ceoUser?.name || 'Bashir Abubakar'}</p>
              <p className="text-[11px] text-slate-400">Unrestricted Root Control • 1 Master</p>
            </div>
          </div>

          {/* Tier 2: Support Agents */}
          <div className="p-4 rounded-2xl bg-white/5 border border-sky-400/20 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30 shrink-0">
              <Headphones size={24} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-sky-300 font-bold uppercase tracking-wider">
                <span>Tier 2 • Support Agents</span>
              </div>
              <p className="text-base font-black text-white">{supportAgents.length} Active Agents</p>
              <p className="text-[11px] text-slate-400">Re-query Orders • Issue Refunds</p>
            </div>
          </div>

          {/* Tier 3: Finance Agents */}
          <div className="p-4 rounded-2xl bg-white/5 border border-emerald-400/20 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30 shrink-0">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold uppercase tracking-wider">
                <span>Tier 3 • Finance Agents</span>
              </div>
              <p className="text-base font-black text-white">{financeAgents.length} Active Agents</p>
              <p className="text-[11px] text-slate-400">Manual Deposits • Float Auditing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Comparison Explainer Card */}
      <div className={`p-5 rounded-2xl border ${
        isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <Shield size={14} className="text-[#0047cc]" />
          <span>Strict Privilege Matrix & Agent Separation</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className={`p-3.5 rounded-xl border ${
            isLightMode ? 'bg-amber-50/60 border-amber-200 text-slate-800' : 'bg-amber-950/20 border-amber-900/40 text-slate-200'
          }`}>
            <p className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
              <Crown size={14} />
              CEO (Master Super Admin)
            </p>
            <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <li>✓ Full system & pricing modifications</li>
              <li>✓ API Gateway switching & float transfers</li>
              <li>✓ Staff hiring, suspension & key rotation</li>
              <li>✓ Master bypass key & 2FA administration</li>
            </ul>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isLightMode ? 'bg-sky-50/60 border-sky-200 text-slate-800' : 'bg-sky-950/20 border-sky-900/40 text-slate-200'
          }`}>
            <p className="font-black text-sky-600 dark:text-sky-400 flex items-center gap-1.5 mb-1.5">
              <Headphones size={14} />
              Support Agent
            </p>
            <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <li>✓ Customer dispute investigation</li>
              <li>✓ Re-querying telecom upstream pending orders</li>
              <li>✓ Issuing instant wallet refunds for failed jobs</li>
              <li>✗ Cannot modify pricing or manage other staff</li>
            </ul>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isLightMode ? 'bg-emerald-50/60 border-emerald-200 text-slate-800' : 'bg-emerald-950/20 border-emerald-900/40 text-slate-200'
          }`}>
            <p className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
              <DollarSign size={14} />
              Finance Agent
            </p>
            <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <li>✓ Manual customer wallet credits (bank wire)</li>
              <li>✓ View platform balances & reserve ratio</li>
              <li>✓ Export financial reports & ledger</li>
              <li>✗ Cannot alter provider keys or delete staff</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border outline-none transition-all ${
              isLightMode
                ? 'bg-slate-50 border-slate-200 focus:border-[#0047cc] focus:bg-white text-slate-900'
                : 'bg-slate-800 border-slate-700 focus:border-blue-500 focus:bg-slate-900 text-slate-100'
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'support_agent', 'finance_agent'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                roleFilter === r
                  ? 'bg-[#0047cc] text-white shadow-xs'
                  : isLightMode
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {r === 'all' ? 'All Staff' : r === 'support_agent' ? 'Support Agents' : 'Finance Agents'}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Agents List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw size={24} className="animate-spin mx-auto text-[#0047cc]" />
            <p className="text-xs font-semibold">Loading authorized staff directory...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <Users size={36} className="mx-auto text-slate-400 mb-2" />
            <h4 className="font-bold text-sm">No staff agents found</h4>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'Try clearing your search query' : 'Enroll your first delegated assistant to help manage the platform'}
            </p>
          </div>
        ) : (
          filteredAgents.map((agent) => {
            const isCEO =
              agent.adminRole === 'super_admin' ||
              agent.phone === '08123456789' ||
              agent.email?.toLowerCase() === 'bashirabubakar650@gmail.com' ||
              agent.id === 'usr_admin_01';
            const isSupport = agent.adminRole === 'support_agent';
            const isFinance = agent.adminRole === 'finance_agent';

            return (
              <div
                key={agent.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isLightMode
                    ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Staff Info */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-base shadow-sm ${
                      isCEO
                        ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 border border-amber-300/40'
                        : isSupport
                        ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white'
                        : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white'
                    }`}>
                      {isCEO ? <Crown size={22} /> : isSupport ? <Headphones size={22} /> : <DollarSign size={22} />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100">
                          {agent.name}
                        </h4>

                        {/* Role Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isCEO
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : isSupport
                            ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        }`}>
                          {isCEO ? 'CEO • Master Admin' : isSupport ? 'Support Agent' : 'Finance Agent'}
                        </span>

                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          agent.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}>
                          {agent.status === 'active' ? '● Active' : '● Suspended'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Mail size={12} />
                          {agent.email}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone size={12} />
                          {agent.phone}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {agent.assignedBy}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Permissions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Permission Chips */}
                    <div className="flex flex-wrap items-center gap-1 mr-2">
                      {agent.permissions?.canRefundOrders && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                          Refunds
                        </span>
                      )}
                      {agent.permissions?.canRequeryOrders && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                          Requery
                        </span>
                      )}
                      {agent.permissions?.canFundWallets && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          Deposit
                        </span>
                      )}
                      {isCEO && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                          Root Access
                        </span>
                      )}
                    </div>

                    {!isCEO ? (
                      <>
                        <button
                          onClick={() => promptToggleStatus(agent)}
                          className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            agent.status === 'active'
                              ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                              : 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                          }`}
                          title={agent.status === 'active' ? 'Temporarily suspend agent' : 'Reactivate agent'}
                        >
                          <Power size={14} />
                          <span>{agent.status === 'active' ? 'Suspend' : 'Activate'}</span>
                        </button>

                        <button
                          onClick={() => promptDeleteAgent(agent)}
                          className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                          title="Permanently remove agent"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                          Immutable Root Founder
                        </span>
                        {onOpenProfile && (
                          <button
                            type="button"
                            onClick={onOpenProfile}
                            className="p-2 px-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            title="Edit CEO Personal Identity, Email, Password & Security PIN"
                          >
                            <UserCog size={13} />
                            <span>Edit My Details</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Audit Log Trail for Staff Accountability */}
      <div className={`p-5 rounded-2xl border ${
        isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Clock size={14} className="text-[#0047cc]" />
            <span>Staff Action & Security Audit Ledger</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Individual Agent Accountability Stamped</span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No recent staff actions recorded.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {auditLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{log.adminName || 'Admin'}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD AGENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl relative max-h-[90vh] overflow-y-auto ${
            isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0047cc] text-white flex items-center justify-center shadow-md">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg">Enroll Subordinate Agent</h3>
                  <p className="text-xs text-slate-500">Provide staff details and assign granular operational permissions</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <XCircle size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAgent} className="space-y-4">
              {/* Agent Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fatima Garba"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 focus:border-[#0047cc] text-slate-900'
                      : 'bg-slate-800 border-slate-700 focus:border-blue-500 text-white'
                  }`}
                  required
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Mail size={12} />
                    Official Email (2FA)
                  </label>
                  <input
                    type="email"
                    placeholder="agent.fatima@jagora.ng"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 focus:border-[#0047cc] text-slate-900'
                        : 'bg-slate-800 border-slate-700 focus:border-blue-500 text-white'
                    }`}
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Their 2FA code is sent here</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Phone size={12} />
                    Nigerian Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="08012345678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 focus:border-[#0047cc] text-slate-900'
                        : 'bg-slate-800 border-slate-700 focus:border-blue-500 text-white'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Password & Security PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Lock size={12} />
                    Initial Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none pr-10 ${
                        isLightMode
                          ? 'bg-slate-50 border-slate-300 focus:border-[#0047cc] text-slate-900'
                          : 'bg-slate-800 border-slate-700 focus:border-blue-500 text-white'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Key size={12} />
                    Personal Staff PIN (4 digits)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="e.g. 2244"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-widest border outline-none text-center ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 focus:border-[#0047cc] text-slate-900'
                        : 'bg-slate-800 border-slate-700 focus:border-blue-500 text-white'
                    }`}
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Staff personal authorization PIN</span>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-600 dark:text-slate-400">
                  Assigned Operational Tier
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('support_agent')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      newRole === 'support_agent'
                        ? 'bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-300 ring-2 ring-sky-500/30'
                        : isLightMode
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Headphones size={16} className="text-sky-500" />
                      <span className="font-bold text-xs">Support Agent</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Disputes, Re-querying orders, and issuing customer refunds.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('finance_agent')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      newRole === 'finance_agent'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                        : isLightMode
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign size={16} className="text-emerald-500" />
                      <span className="font-bold text-xs">Finance Agent</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Manual wallet deposits, ledger monitoring, and financial summaries.
                    </p>
                  </button>
                </div>
              </div>

              {/* Granular Permission Checklist */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
              }`}>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Fine-Grained Permissions</p>

                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span>View Customer Transactions & Ledger</span>
                  <input
                    type="checkbox"
                    checked={permissions.canViewTransactions}
                    onChange={(e) => setPermissions({ ...permissions, canViewTransactions: e.target.checked })}
                    className="rounded accent-[#0047cc]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span>Re-query Pending Orders at Upstream APIs</span>
                  <input
                    type="checkbox"
                    checked={permissions.canRequeryOrders}
                    onChange={(e) => setPermissions({ ...permissions, canRequeryOrders: e.target.checked })}
                    className="rounded accent-[#0047cc]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span>Approve & Issue Wallet Refunds</span>
                  <input
                    type="checkbox"
                    checked={permissions.canRefundOrders}
                    onChange={(e) => setPermissions({ ...permissions, canRefundOrders: e.target.checked })}
                    className="rounded accent-[#0047cc]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span>Credit/Fund Customer Wallets (Manual)</span>
                  <input
                    type="checkbox"
                    checked={permissions.canFundWallets}
                    onChange={(e) => setPermissions({ ...permissions, canFundWallets: e.target.checked })}
                    className="rounded accent-[#0047cc]"
                  />
                </label>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-amber-500 shrink-0" />
                  <span>CEO-Exclusive: Pricing alteration & Gateway switching are permanently locked to Master CEO.</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2.5 rounded-xl bg-[#0047cc] hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Creating Staff Account...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Confirm & Enroll Agent</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      <ActionConfirmModal
        isOpen={!!agentToDelete}
        onClose={() => !isActionLoading && setAgentToDelete(null)}
        onConfirm={confirmDeleteAgent}
        title="Permanently Delete Staff Agent?"
        description={`Are you sure you want to delete staff agent "${agentToDelete?.name}" (${agentToDelete?.email})?`}
        warningNote="This action cannot be undone. All active administrative sessions, 2FA tokens, and delegated permissions for this account will be permanently revoked immediately."
        confirmLabel="Delete Agent"
        cancelLabel="Keep Agent"
        variant="danger"
        iconType="delete"
        isLoading={isActionLoading}
        isLightMode={isLightMode}
      />

      {/* Toggle Status Confirmation Modal */}
      <ActionConfirmModal
        isOpen={!!agentToToggle}
        onClose={() => !isActionLoading && setAgentToToggle(null)}
        onConfirm={confirmToggleStatus}
        title={agentToToggle?.status === 'active' ? 'Suspend Staff Agent?' : 'Reactivate Staff Agent?'}
        description={
          agentToToggle?.status === 'active'
            ? `Suspending "${agentToToggle?.name}" (${agentToToggle?.email}) will immediately terminate their administrative console access.`
            : `Restore administrative access and portal login for "${agentToToggle?.name}".`
        }
        warningNote={
          agentToToggle?.status === 'active'
            ? 'Any ongoing transactions or management requests initiated by this agent will remain recorded in audit logs.'
            : undefined
        }
        confirmLabel={agentToToggle?.status === 'active' ? 'Suspend Agent' : 'Reactivate Agent'}
        cancelLabel="Cancel"
        variant={agentToToggle?.status === 'active' ? 'warning' : 'info'}
        iconType={agentToToggle?.status === 'active' ? 'freeze' : 'info'}
        isLoading={isActionLoading}
        isLightMode={isLightMode}
      />
    </div>
  );
};
