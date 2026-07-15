import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, X, Users, UserPlus, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MemberManager = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rfidCard, setRfidCard] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  useEffect(() => {
    let subMembers, subPlans;
    getDatabase().then((db) => {
      subMembers = db.members
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setMembers(docs);
        });

      subPlans = db.plans
        .find({ selector: { isDeleted: false, isActive: true } })
        .$.subscribe((docs) => {
          setPlans(docs);
        });
    });

    return () => {
      if (subMembers) subMembers.unsubscribe();
      if (subPlans) subPlans.unsubscribe();
    };
  }, []);

  const handleRegisterMember = async (e) => {
    e.preventDefault();
    if (!name || !phone || !selectedPlanId) {
      toast.error('Name, Phone, and Membership Plan are required');
      return;
    }

    const planObj = plans.find(p => p._id === selectedPlanId);
    if (!planObj) {
      toast.error('Selected plan is invalid');
      return;
    }

    const durationDays = planObj.durationInDays;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    try {
      const db = await getDatabase();
      const memberId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

      await db.members.insert({
        _id: memberId,
        tenantId: user?.tenantId || 'default',
        name,
        phone,
        rfidCard: rfidCard || '',
        activePlanId: selectedPlanId,
        planExpiryDate: expiryDate.toISOString(),
        status: 'ACTIVE',
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });

      toast.success('Gym member registered successfully');
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setRfidCard('');
      setSelectedPlanId('');
    } catch {
      toast.error('Failed to register member');
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      const db = await getDatabase();
      const doc = await db.members.findOne(memberId).exec();
      if (doc) {
        await doc.patch({
          isDeleted: true,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
        toast.success('Member record deleted');
      }
    } catch {
      toast.error('Failed to delete member');
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Gym Members</h1>
            <p className="text-xs text-muted-foreground">Onboard gym members and track attendance and subscription state</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[var(--primary-accent)] to-[var(--secondary-accent)] text-white hover:opacity-95 font-bold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register Member</span>
          </button>
        </div>
        <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
          <div className="overflow-x-auto w-full">
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6">
                <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-semibold text-foreground">No Registered Members</p>
                <p className="text-xs text-muted-foreground mt-1">Onboard your first gym member to begin tracking attendance and subscription state</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[40rem]">
                <thead>
                  <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Member Name</th>
                    <th className="py-3.5 px-6">Phone Number</th>
                    <th className="py-3.5 px-6">RFID / Barcode</th>
                    <th className="py-3.5 px-6">Active Plan</th>
                    <th className="py-3.5 px-6">Expiry Date</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-zinc-700 text-sm font-semibold">
                  {members.map((member) => {
                    const planObj = plans.find(p => p._id === member.activePlanId);
                    const expiry = new Date(member.planExpiryDate);
                    const isExpired = expiry.getTime() < Date.now();
                    const statusVal = isExpired ? 'EXPIRED' : member.status;

                    return (
                      <tr key={member._id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-4 px-6 font-extrabold text-foreground">{member.name}</td>
                        <td className="py-4 px-6 font-semibold text-foreground">{member.phone}</td>
                        <td className="py-4 px-6 text-xs text-muted-foreground font-mono">
                          {member.rfidCard ? (
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3.5 w-3.5 text-accent" /> {member.rfidCard}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-4 px-6 font-bold text-foreground">{planObj ? planObj.name : 'Unknown Plan'}</td>
                        <td className="py-4 px-6 text-xs font-semibold text-foreground">{expiry.toLocaleDateString()}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            statusVal === 'ACTIVE' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}>
                            {statusVal}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteMember(member._id)}
                            className="p-2 hover:bg-red-500/10 text-red-500 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5">
              <UserPlus className="h-5 w-5 text-accent" /> Register Gym Member
            </h3>
            <form onSubmit={handleRegisterMember} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Member Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="e.g. Clark Kent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="e.g. +1 555-0199"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">RFID / Card Number (Optional)</label>
                <input
                  type="text"
                  value={rfidCard}
                  onChange={(e) => setRfidCard(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="RFID Card scanning identifier..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Membership Plan *</label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                >
                  <option value="">Select a membership plan...</option>
                  {plans.map(p => (
                    <option key={p._id} value={p._id}>{p.name} (Rs. {p.price.toFixed(2)} - {p.durationInDays} Days)</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-foreground text-background py-3 text-xs font-bold shadow-sm"
              >
                Register Member
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManager;
