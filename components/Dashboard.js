
import { defineComponent, h, computed, ref } from 'vue';
import { useAccounting, state } from '../state.js';
import { AccountType } from '../constants.js';
import Icon from './Icon.js';

export default defineComponent({
  name: 'Dashboard',
  setup() {
    const { summary } = useAccounting();
    const hoveredIdx = ref(null);

    // Logic for the 7-day graph
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
      { 
        label: 'Total Assets', 
        icon: 'assets',
        value: this.summary.totalAssets, 
        color: 'text-emerald-700', 
        symColor: 'text-emerald-200', 
        sub: 'School Properties',
        definition: 'Represents the sum of all resources owned by the school, including Cash at Bank, Tuition Receivables, and Fixed Assets like Buildings or Equipment.'
      },
      { 
        label: 'Annual Revenue', 
        icon: 'billing',
        value: this.summary.totalRevenue, 
        color: 'text-emerald-700', 
        symColor: 'text-emerald-200', 
        sub: 'Collection',
        definition: 'The total gross income generated from institutional activities such as Student Tuition, Miscellaneous Fees, and other revenue streams.'
      },
      { 
        label: 'Total Expenses', 
        icon: 'budget',
        value: this.summary.totalExpenses, 
        color: 'text-rose-600', 
        symColor: 'text-rose-200', 
        sub: 'Operations',
        definition: 'Aggregated costs incurred for running the school, including Teacher Salaries, Utilities, Maintenance, and Procurement of supplies.'
      },
      { 
        label: 'Total Debit', 
        icon: 'ledger',
        value: this.summary.totalSystemDebit, 
        color: 'text-slate-900', 
        symColor: 'text-emerald-300', 
        sub: 'System Volume',
        definition: 'The cumulative value of all left-side entries in the General Ledger. In double-entry, this tracks increases in Assets/Expenses or decreases in Liabilities/Equity.'
      },
      { 
        label: 'Total Credit', 
        icon: 'check',
        value: this.summary.totalSystemCredit, 
        color: 'text-slate-900', 
        symColor: 'text-emerald-300', 
        sub: 'System Volume',
        definition: 'The cumulative value of all right-side entries in the General Ledger. Tracks increases in Liabilities/Equity/Revenue or decreases in Assets/Expenses.'
      },
      { 
        label: 'Fiscal Surplus', 
        icon: 'sparkle',
        value: this.summary.netIncome, 
        color: 'text-slate-900', 
        symColor: 'text-slate-200', 
        sub: 'Institutional Health',
        definition: 'Calculated as Net Income (Total Revenue minus Total Expenses). A positive value indicates profitability or institutional savings.'
      }
    ];

    // SVG Graph Helper
    const maxVal = Math.max(...this.chartData.map(d => Math.max(d.revenue, d.expense, 1000)));
    const graphHeight = 160;

    return h('div', { class: 'animate-fade space-y-12 pb-20' }, [
      // Top Stats Row
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

          // DEFINITION OVERLAY / MODAL ON HOVER
          this.hoveredIdx === idx ? h('div', { 
            class: 'absolute z-[100] top-full left-0 mt-4 w-72 bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl animate-fade pointer-events-none' 
          }, [
            h('div', { class: 'absolute -top-2 left-10 w-4 h-4 bg-slate-900 rotate-45' }),
            h('p', { class: 'text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3' }, 'Accountant Insight'),
            h('p', { class: 'text-sm font-medium leading-relaxed opacity-90' }, s.definition)
          ]) : null
        ])
      )),

      h('div', { class: 'grid grid-cols-3 gap-10' }, [
        // Financial Pulse Graph Section
        h('div', { class: 'col-span-2 premium-card p-16' }, [
          h('div', { class: 'flex justify-between items-center mb-16' }, [
            h('div', [
              h('h3', { class: 'text-3xl font-black text-slate-800' }, 'Financial Pulse'),
              h('p', { class: 'text-base text-slate-400 font-bold' }, '7-Day Revenue vs Expense Trend')
            ]),
            h('div', { class: 'flex gap-8 text-[11px] font-black uppercase tracking-widest' }, [
              h('div', { class: 'flex items-center gap-3' }, [
                h('div', { class: 'w-4 h-4 bg-emerald-500 rounded-md' }),
                h('span', 'Revenue')
              ]),
              h('div', { class: 'flex items-center gap-3' }, [
                h('div', { class: 'w-4 h-4 bg-rose-400 rounded-md' }),
                h('span', 'Expenses')
              ])
            ])
          ]),
          
          // Custom SVG Graph
          h('div', { class: 'relative h-72 flex items-end justify-between px-6 pb-12 border-b border-slate-50' }, 
            this.chartData.map((d, i) => {
              const revH = (d.revenue / maxVal) * graphHeight;
              const expH = (d.expense / maxVal) * graphHeight;
              
              return h('div', { class: 'flex flex-col items-center gap-5 flex-1' }, [
                h('div', { class: 'flex items-end gap-2' }, [
                  // Revenue Bar
                  h('div', { 
                    class: 'w-8 bg-emerald-500 rounded-t-xl transition-all duration-700 shadow-lg shadow-emerald-500/20',
                    style: { height: `${revH}px`, minHeight: d.revenue > 0 ? '6px' : '0' }
                  }),
                  // Expense Bar
                  h('div', { 
                    class: 'w-8 bg-rose-400 rounded-t-xl transition-all duration-700 shadow-lg shadow-rose-400/20',
                    style: { height: `${expH}px`, minHeight: d.expense > 0 ? '6px' : '0' }
                  })
                ]),
                h('p', { class: 'text-[11px] font-black text-slate-400 uppercase tracking-tighter' }, d.label)
              ]);
            })
          ),
          
          h('div', { class: 'mt-12 grid grid-cols-2 gap-12' }, [
            h('div', { class: 'bg-emerald-50/50 p-8 rounded-[2rem]' }, [
              h('p', { class: 'text-[11px] font-black text-emerald-600 uppercase mb-3' }, 'Highest Daily Collection'),
              h('div', { class: 'flex items-baseline gap-2' }, [
                h('span', { class: 'text-lg font-black text-emerald-300' }, '₱'),
                h('p', { class: 'text-3xl font-black text-slate-800 tracking-tighter' }, Math.max(...this.chartData.map(d => d.revenue)).toLocaleString())
              ])
            ]),
            h('div', { class: 'bg-rose-50/50 p-8 rounded-[2rem]' }, [
              h('p', { class: 'text-[11px] font-black text-rose-500 uppercase mb-3' }, 'Highest Daily Spend'),
              h('div', { class: 'flex items-baseline gap-2' }, [
                h('span', { class: 'text-lg font-black text-rose-300' }, '₱'),
                h('p', { class: 'text-3xl font-black text-slate-800 tracking-tighter' }, Math.max(...this.chartData.map(d => d.expense)).toLocaleString())
              ])
            ])
          ])
        ]),

        // Daily Input Report / Quick Feed
        h('div', { class: 'premium-card p-14 flex flex-col shadow-xl' }, [
          h('h3', { class: 'text-2xl font-black text-slate-800 mb-10' }, 'Today\'s Activity'),
          
          this.todayReport.length === 0 
            ? h('div', { class: 'flex-1 flex flex-col items-center justify-center space-y-6 opacity-30 py-20' }, [
                h(Icon, { name: 'reports', size: 64 }),
                h('p', { class: 'text-base font-bold uppercase tracking-widest' }, 'Registry Clean')
              ])
            : h('div', { class: 'space-y-6 overflow-y-auto max-h-[500px] pr-2 scrollbar-hide' }, this.todayReport.map(e => 
                h('div', { class: 'group p-6 rounded-3xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all' }, [
                  h('div', { class: 'flex justify-between items-start' }, [
                    h('div', [
                      h('p', { class: 'text-base font-black text-slate-800 leading-tight' }, e.description),
                      h('p', { class: 'text-[11px] text-emerald-600 mt-2 font-black uppercase tracking-[0.2em]' }, e.reference)
                    ]),
                    h('div', { class: 'text-right' }, [
                      h('p', { class: 'text-base font-black text-slate-900' }, `₱${e.lines.reduce((sum, l) => sum + Number(l.debit || l.credit), 0).toLocaleString()}`),
                      h('p', { class: 'text-[10px] text-slate-300 font-bold uppercase mt-1' }, 'Total Vol.')
                    ])
                  ])
                ])
              )),
          
          h('button', { 
            onClick: this.openManualEntry,
            class: 'mt-auto w-full py-6 rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 font-black text-xs tracking-[0.2em] hover:border-emerald-200 hover:text-emerald-500 transition-all uppercase pt-10'
          }, '+ New Ledger Entry')
        ])
      ]),

      // Shortcuts Bar
      h('div', { class: 'premium-card p-10 flex items-center justify-between border-l-8 border-emerald-500 bg-emerald-50/40 shadow-xl' }, [
        h('div', { class: 'flex items-center gap-8' }, [
          h(Icon, { name: 'procurement', size: 48, class: 'text-emerald-600' }),
          h('div', [
            h('h4', { class: 'text-2xl font-black text-emerald-900 tracking-tight' }, 'Accounting Shortcuts'),
            h('p', { class: 'text-base text-emerald-700/70 font-medium' }, 'Fast-track your daily institutional bookkeeping tasks.')
          ])
        ]),
        h('div', { class: 'flex gap-6' }, [
          h('button', { 
            onClick: this.openManualEntry,
            class: 'bg-white text-emerald-800 px-8 py-4 rounded-2xl font-black text-xs shadow-md border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-3' 
          }, [h(Icon, { name: 'ledger', size: 18 }), 'NEW LEDGER ENTRY']),
          h('button', { 
            onClick: () => this.state.activeTab = 'billing',
            class: 'bg-white text-emerald-800 px-8 py-4 rounded-2xl font-black text-xs shadow-md border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-3' 
          }, [h(Icon, { name: 'billing', size: 18 }), 'BILL STUDENT'])
        ])
      ])
    ]);
  }
});
