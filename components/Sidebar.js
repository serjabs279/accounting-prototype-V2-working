
import { defineComponent, h } from 'vue';
import { state } from '../state.js';
import Icon from './Icon.js';

export default defineComponent({
  name: 'Sidebar',
  setup() {
    const groups = [
      { name: 'Core Registry', items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'accounts', label: 'Chart of Accounts', icon: 'accounts' },
        { id: 'journal', label: 'General Ledger', icon: 'ledger' }
      ]},
      { name: 'Operations', items: [
        { id: 'billing', label: 'Student Billing', icon: 'billing' },
        { id: 'procurement', label: 'Procurement', icon: 'procurement' },
        { id: 'payroll', label: 'Payroll & HR', icon: 'payroll' },
        { id: 'assets', label: 'Asset Manager', icon: 'assets' }
      ]},
      { name: 'System Admin', items: [
        { id: 'budgeting', label: 'Budgeting', icon: 'budget' },
        { id: 'reports', label: 'Reports', icon: 'reports' },
        { id: 'audit', label: 'Audit Log', icon: 'audit' }
      ]}
    ];
    return { state, groups };
  },
  render() {
    return h('aside', { class: 'w-72 bg-[#064e3b] text-white flex flex-col h-full shadow-2xl z-20' }, [
      h('div', { class: 'p-10 pb-12' }, [
        h('div', { class: 'flex items-center gap-4' }, [
          h('div', { class: 'w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-white text-2xl shadow-lg' }, 'S'),
          h('div', [
            h('h2', { class: 'text-xl font-black tracking-tight leading-none' }, 'SRPHS HUB'),
            h('p', { class: 'text-[10px] text-emerald-400 font-bold tracking-[0.2em] uppercase opacity-80 mt-1' }, 'Accounting')
          ])
        ])
      ]),
      
      h('nav', { class: 'flex-1 overflow-y-auto scrollbar-hide space-y-10 px-6' }, this.groups.map(group => h('div', [
        h('p', { class: 'px-2 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-300/50 mb-4' }, group.name),
        h('div', { class: 'space-y-1.5' }, group.items.map(item => 
          h('button', {
            onClick: () => this.state.activeTab = item.id,
            class: `w-full text-left px-4 py-4 rounded-2xl transition-all flex items-center gap-4 font-bold ${
              this.state.activeTab === item.id 
              ? 'bg-white/10 text-white shadow-xl border-l-4 border-emerald-400' 
              : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
            }`
          }, [
            h(Icon, { name: item.icon, size: 22, class: 'opacity-80' }),
            h('span', { class: 'text-base' }, item.label)
          ])
        ))
      ]))),

      h('div', { class: 'p-8 mt-auto bg-emerald-950/40 border-t border-emerald-900/50' }, [
        h('div', { class: 'flex items-center gap-4' }, [
          h('div', { class: 'w-12 h-12 rounded-full bg-emerald-800 flex items-center justify-center text-xl border border-emerald-700 shadow-inner overflow-hidden' }, [
             h(Icon, { name: 'payroll', size: 24, class: 'text-emerald-300' })
          ]),
          h('div', [
            h('p', { class: 'text-sm font-black text-white' }, 'Admin Bursar'),
            h('p', { class: 'text-[10px] text-emerald-400 font-bold uppercase tracking-widest' }, 'Full Access')
          ])
        ])
      ])
    ]);
  }
});
