
import { defineComponent, h, computed, ref } from 'vue';
import { useAccounting, state } from '../state.js';
import { AccountType } from '../constants.js';
import Icon from './Icon.js';

export default defineComponent({
  name: 'Dashboard',
  setup() {
    const { summary } = useAccounting();
    const hoveredIdx = ref(null);

    const chartData = computed(() => {
      const days = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        let dailyRev = 0;
        let dailyExp = 0;

        state.entries.forEach(e => {
          if (e.date === dateStr) {
            e.lines.forEach(l => {
              const acc = state.accounts.find(a => a.id === l.accountId);
              if (acc.type === AccountType.REVENUE) dailyRev += Number(l.credit - l.debit);
              if (acc.type === AccountType.EXPENSE) dailyExp += Number(l.debit - l.credit);
            });
          }
        });

        days.push({
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: dailyRev,
          expense: dailyExp,
          fullDate: dateStr
        });
      }
      return days;
    });

    const todayReport = computed(() => {
      const today = new Date().toISOString().split('T')[0];
      return state.entries.filter(e => e.date === today);
    });

    const openManualEntry = () => {
      state.activeTab = 'journal';
    };

    return { summary, state, openManualEntry, chartData, todayReport, hoveredIdx };
  },
  render() {
    const stats = [
      { label: 'Total Assets', icon: 'assets', value: this.summary.totalAssets, color: 'text-emerald-700', symColor: 'text-emerald-200', sub: 'School Properties', definition: 'Sum of all institutional resources.' },
      { label: 'Annual Revenue', icon: 'billing', value: this.summary.totalRevenue, color: 'text-emerald-700', symColor: 'text-emerald-200', sub: 'Collection', definition: 'Total gross income from fees.' },
      { label: 'Total Expenses', icon: 'budget', value: this.summary.totalExpenses, color: 'text-rose-600', symColor: 'text-rose-200', sub: 'Operations', definition: 'Aggregated operational costs.' },
      { label: 'Total Debit', icon: 'ledger', value: this.summary.totalSystemDebit, color: 'text-slate-900', symColor: 'text-emerald-300', sub: 'System Volume', definition: 'Cumulative left-side ledger entries.' },
      { label: 'Total Credit', icon: 'check', value: this.summary.totalSystemCredit, color: 'text-slate-900', symColor: 'text-emerald-300', sub: 'System Volume', definition: 'Cumulative right-side ledger entries.' },
      { label: 'Fiscal Surplus', icon: 'sparkle', value: this.summary.netIncome, color: 'text-slate-900', symColor: 'text-slate-200', sub: 'Institutional Health', definition: 'Net income (Revenue - Expenses).' }
    ];

    const maxVal = Math.max(...this.chartData.map(d => Math.max(d.revenue, d.expense, 1000)));
    const graphHeight = 160;

    return h('div', { class: 'animate-fade space-y-12 pb-20' }, [
      h('div', { class: 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6' }, stats.map((s, idx) => 
        h('div', { 
          class: 'premium-card p-8 transition-all hover:shadow-2xl flex flex-col justify-center relative cursor-help group border-b-4 border-emerald-50 hover:border-emerald-500',
          onMouseenter: () => this.hoveredIdx = idx,
          onMouseleave: () => this.hoveredIdx = null
        }, [
          h('div', { class: 'flex justify-between items-start mb-6' }, [
            h('p', { class: 'text-[10px] font-black text-slate-400 uppercase tracking-widest' }, s.label),
            h(Icon, { name: s.icon, size: 24, class: 'text-slate-300 group-hover:text-emerald-500 transition-colors' })
          ]),
          h('div', { class: 'flex items-baseline gap-1' }, [
            h('span', { class: `text-xl font-black ${s.symColor}` }, '₱'),
            h('span', { class: `text-3xl font-black ${s.color} tracking-tighter` }, s.value.toLocaleString())
          ]),
          h('p', { class: 'text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-wider' }, s.sub),
          this.hoveredIdx === idx ? h('div', { class: 'absolute z-[100] top-full left-0 mt-4 w-72 bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl animate-fade pointer-events-none' }, [
            h('p', { class: 'text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3' }, 'Accountant Insight'),
            h('p', { class: 'text-sm font-medium leading-relaxed opacity-90' }, s.definition)
          ]) : null
        ])
      )),
      h('div', { class: 'grid grid-cols-3 gap-10' }, [
        h('div', { class: 'col-span-2 premium-card p-16' }, [
          h('div', { class: 'flex justify-between items-center mb-16' }, [
            h('div', [
              h('h3', { class: 'text-3xl font-black text-slate-800' }, 'Financial Pulse'),
              h('p', { class: 'text-base text-slate-400 font-bold' }, '7-Day Revenue vs Expense Trend')
            ])
          ]),
          h('div', { class: 'relative h-72 flex items-end justify-between px-6 pb-12' }, 
            this.chartData.map((d, i) => h('div', { class: 'flex flex-col items-center gap-5 flex-1' }, [
              h('div', { class: 'flex items-end gap-2' }, [
                h('div', { class: 'w-8 bg-emerald-500 rounded-t-xl transition-all', style: { height: `${(d.revenue / maxVal) * graphHeight}px` } }),
                h('div', { class: 'w-8 bg-rose-400 rounded-t-xl transition-all', style: { height: `${(d.expense / maxVal) * graphHeight}px` } })
              ]),
              h('p', { class: 'text-[11px] font-black text-slate-400 uppercase' }, d.label)
            ]))
          )
        ]),
        h('div', { class: 'premium-card p-14 flex flex-col' }, [
          h('h3', { class: 'text-2xl font-black text-slate-800 mb-10' }, 'Today\'s Activity'),
          this.todayReport.length === 0 ? h('div', { class: 'flex-1 flex flex-col items-center justify-center opacity-30' }, [h(Icon, { name: 'reports', size: 64 }), h('p', { class: 'mt-4 font-bold uppercase tracking-widest' }, 'Registry Clean')]) :
          h('div', { class: 'space-y-6 overflow-y-auto' }, this.todayReport.map(e => h('div', { class: 'p-6 rounded-3xl bg-slate-50' }, [
            h('p', { class: 'text-base font-black text-slate-800' }, e.description),
            h('p', { class: 'text-xl font-black text-slate-900 mt-2' }, `₱${e.lines.reduce((sum, l) => sum + Number(l.debit || l.credit), 0).toLocaleString()}`)
          ])))
        ])
      ])
    ]);
  }
});
