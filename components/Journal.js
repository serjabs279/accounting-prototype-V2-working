
import { defineComponent, h, reactive, computed } from 'vue';
import { state, logAction, deleteEntry } from '../state.js';
import Icon from './Icon.js';

export default defineComponent({
  name: 'Journal',
  setup() {
    const ui = reactive({
      showModal: false,
      showDeleteConfirm: false,
      entryToDelete: null
    });

    const newEntry = reactive({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 }
      ]
    });

    const totals = computed(() => {
      return newEntry.lines.reduce((acc, line) => {
        acc.debit += (Number(line.debit) || 0);
        acc.credit += (Number(line.credit) || 0);
        return acc;
      }, { debit: 0, credit: 0 });
    });

    const activeLines = computed(() => {
      return newEntry.lines.filter(l => (Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0);
    });

    const balanceDifference = computed(() => {
      return Math.abs(Number(totals.value.debit) - Number(totals.value.credit));
    });

    const isBalanced = computed(() => {
      const d = Number(totals.value.debit);
      const c = Number(totals.value.credit);
      const sumsMatch = Math.abs(d - c) < 0.01 && d > 0;
      const allActiveHaveAccounts = activeLines.value.length > 0 && 
                                   activeLines.value.every(l => l.accountId !== '');
      return sumsMatch && allActiveHaveAccounts;
    });

    const validationMessage = computed(() => {
      if (totals.value.debit === 0 && totals.value.credit === 0) return "Enter transaction values";
      if (Math.abs(totals.value.debit - totals.value.credit) > 0.01) return `Out of balance: ₱${balanceDifference.value.toLocaleString()}`;
      if (activeLines.value.some(l => l.accountId === '')) return "Select accounts for all lines";
      return "Balanced & Ready";
    });

    const addEntry = () => {
      if (!isBalanced.value) return;
      
      const entryId = Date.now().toString();
      state.entries.push({
        id: entryId,
        date: newEntry.date,
        reference: newEntry.reference || `REF-${entryId.slice(-4)}`,
        description: newEntry.description || 'Manual Journal Entry',
        lines: activeLines.value.map(l => ({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0
        }))
      });

      logAction('Admin', `Manually posted: ${newEntry.description}`, 'General Ledger');
      ui.showModal = false;
      resetForm();
    };

    const confirmDelete = (entry) => {
      ui.entryToDelete = entry;
      ui.showDeleteConfirm = true;
    };

    const handleActualDelete = () => {
      if (ui.entryToDelete) {
        deleteEntry(ui.entryToDelete.id);
        ui.entryToDelete = null;
        ui.showDeleteConfirm = false;
      }
    };

    const resetForm = () => {
      newEntry.date = new Date().toISOString().split('T')[0];
      newEntry.reference = '';
      newEntry.description = '';
      newEntry.lines = [
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 }
      ];
    };

    const closeModal = () => {
      ui.showModal = false;
      resetForm();
    };

    const updateLine = (idx, field, value) => {
      const numVal = value === '' ? 0 : Number(value);
      newEntry.lines[idx][field] = numVal;
    };

    return { state, newEntry, ui, totals, isBalanced, balanceDifference, validationMessage, addEntry, closeModal, updateLine, confirmDelete, handleActualDelete };
  },
  render() {
    return h('div', { class: 'animate-fade space-y-10' }, [
      h('div', { class: 'flex justify-between items-end mb-12' }, [
        h('div', [
          h('h2', { class: 'text-5xl font-black text-slate-900 tracking-tight' }, 'General Ledger'),
          h('p', { class: 'text-xl text-slate-500 font-medium mt-3' }, 'Institutional double-entry records.')
        ]),
        h('button', { 
          onClick: () => this.ui.showModal = true,
          class: 'green-gradient text-white px-12 py-6 rounded-[2rem] font-black text-lg shadow-2xl hover:scale-[1.02] transition active:scale-95 flex items-center gap-4' 
        }, [
          h(Icon, { name: 'plus', size: 28 }),
          'ADD NEW ENTRY'
        ])
      ]),

      h('div', { class: 'premium-card overflow-hidden shadow-2xl' }, [
        this.state.entries.length === 0 ? 
        h('div', { class: 'py-40 text-center space-y-8' }, [
          h(Icon, { name: 'reports', size: 96, class: 'mx-auto opacity-20' }),
          h('p', { class: 'text-2xl text-slate-400 font-bold italic' }, 'No journal entries recorded for the current period.')
        ]) :
        h('table', { class: 'w-full text-left' }, [
          h('thead', { class: 'bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]' }, [
            h('tr', [
              h('th', { class: 'px-10 py-8' }, 'Date'),
              h('th', { class: 'px-10 py-8' }, 'Description & Ref'),
              h('th', { class: 'px-10 py-8' }, 'Accounts'),
              h('th', { class: 'px-10 py-8 text-right' }, 'Debit (₱)'),
              h('th', { class: 'px-10 py-8 text-right' }, 'Credit (₱)'),
              h('th', { class: 'px-10 py-8 text-center' }, 'Actions')
            ])
          ]),
          h('tbody', { class: 'divide-y divide-slate-100' }, this.state.entries.slice().reverse().map(e => 
            h('tr', { key: e.id, class: 'hover:bg-slate-50/50 transition-colors group' }, [
              h('td', { class: 'px-10 py-10 text-lg font-bold text-slate-500 align-top' }, e.date),
              h('td', { class: 'px-10 py-10 align-top' }, [
                h('p', { class: 'text-2xl font-black text-slate-800' }, e.description),
                h('p', { class: 'text-xs text-emerald-600 font-black uppercase tracking-widest mt-3' }, e.reference)
              ]),
              h('td', { class: 'px-10 py-10 align-top space-y-5' }, e.lines.map((l, idx) => 
                h('p', { key: idx, class: `text-xl font-bold ${l.credit > 0 ? 'pl-10 text-slate-400' : 'text-slate-700'}` }, 
                  this.state.accounts.find(a => a.id === l.accountId)?.name || 'Unknown'
                )
              )),
              h('td', { class: 'px-10 py-10 text-right align-top space-y-5' }, e.lines.map((l, idx) => 
                h('p', { key: idx, class: 'text-xl font-black text-emerald-600' }, l.debit > 0 ? `₱${Number(l.debit).toLocaleString()}` : '-')
              )),
              h('td', { class: 'px-10 py-10 text-right align-top space-y-5' }, e.lines.map((l, idx) => 
                h('p', { key: idx, class: 'text-xl font-black text-slate-400' }, l.credit > 0 ? `₱${Number(l.credit).toLocaleString()}` : '-')
              )),
              h('td', { class: 'px-10 py-10 text-center align-top' }, [
                h('button', { 
                  onClick: () => this.confirmDelete(e),
                  class: 'p-4 rounded-2xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm hover:shadow-md' 
                }, [
                  h(Icon, { name: 'trash', size: 24 })
                ])
              ])
            ])
          ))
        ])
      ]),

      // --- DELETE CONFIRMATION MODAL ---
      this.ui.showDeleteConfirm ? h('div', { class: 'fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-6' }, [
        h('div', { class: 'bg-white p-16 rounded-[4rem] w-full max-w-2xl shadow-2xl relative animate-fade text-center' }, [
          h('div', { class: 'w-32 h-32 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-10' }, [
            h(Icon, { name: 'audit', size: 64, class: 'text-rose-500' })
          ]),
          h('h3', { class: 'text-4xl font-black text-slate-900 mb-6 tracking-tight' }, 'Delete Ledger Entry?'),
          h('p', { class: 'text-lg text-slate-500 font-medium mb-12 leading-relaxed' }, [
            'Are you sure you want to remove ',
            h('span', { class: 'font-black text-slate-800' }, `"${this.ui.entryToDelete?.description}"`),
            '? This will also automatically reverse any impacts on student balances or vendor payables linked to this record.'
          ]),
          h('div', { class: 'flex gap-6' }, [
            h('button', { 
              onClick: () => this.ui.showDeleteConfirm = false, 
              class: 'flex-1 py-7 bg-slate-100 text-slate-500 rounded-3xl font-black text-lg' 
            }, 'CANCEL'),
            h('button', { 
              onClick: this.handleActualDelete, 
              class: 'flex-[2] py-7 bg-rose-600 text-white rounded-3xl font-black text-2xl shadow-xl hover:bg-rose-700 transition' 
            }, 'DELETE & REVERT')
          ])
        ])
      ]) : null,

      // --- MANUAL JOURNAL POSTING MODAL ---
      this.ui.showModal ? h('div', { class: 'fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-6' }, [
        h('div', { class: 'bg-white p-10 rounded-[3.5rem] w-full max-w-6xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] relative animate-fade' }, [
          
          h('button', { 
            onClick: this.closeModal,
            class: 'absolute top-8 right-8 w-10 h-10 flex items-center justify-center text-slate-900 font-black text-2xl hover:opacity-60 transition-opacity'
          }, [ h(Icon, { name: 'close', size: 24 }) ]),

          h('div', { class: 'mb-6 border-b pb-4 shrink-0' }, [
            h('h3', { class: 'text-3xl font-black text-slate-900 tracking-tight' }, 'Manual Journal Posting'),
            h('p', { class: 'text-slate-400 font-bold text-sm mt-0.5' }, 'Standard Double-Entry Posting Engine')
          ]),
          
          h('div', { class: 'grid grid-cols-2 gap-8 mb-6 shrink-0' }, [
            h('div', [
              h('label', { class: 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2' }, 'Transaction Date'),
              h('input', { 
                type: 'date', 
                value: this.newEntry.date, 
                onInput: e => this.newEntry.date = e.target.value, 
                class: 'w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-lg text-slate-800' 
              })
            ]),
            h('div', [
              h('label', { class: 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2' }, 'Official Description'),
              h('input', { 
                placeholder: 'Enter transaction particulars...', 
                value: this.newEntry.description, 
                onInput: e => this.newEntry.description = e.target.value, 
                class: 'w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-lg text-slate-800' 
              })
            ])
          ]),

          h('div', { class: 'grid grid-cols-12 gap-6 mb-3 px-2 shrink-0 border-b border-slate-100 pb-2' }, [
            h('div', { class: 'col-span-6 text-[10px] font-black text-slate-400 uppercase tracking-widest' }, 'Account Code / Name'),
            h('div', { class: 'col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right' }, 'Debit (₱)'),
            h('div', { class: 'col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right' }, 'Credit (₱)')
          ]),

          h('div', { class: 'space-y-3 flex-1 overflow-y-auto pr-2 mb-6 scrollbar-hide pt-1' }, [
            ...this.newEntry.lines.map((l, idx) => 
              h('div', { key: idx, class: 'grid grid-cols-12 gap-5 items-stretch' }, [
                h('div', { class: 'col-span-6' }, [
                  h('select', { 
                    value: l.accountId, 
                    onChange: e => l.accountId = e.target.value,
                    class: 'w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-base text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm' 
                  }, [
                    h('option', { value: '' }, 'Select Account...'),
                    ...this.state.accounts.map(a => h('option', { value: a.id }, `${a.code} - ${a.name}`))
                  ])
                ]),
                h('div', { class: 'col-span-3' }, [
                  h('input', { 
                    type: 'number', 
                    placeholder: '0.00', 
                    value: l.debit === 0 ? '' : l.debit, 
                    onInput: e => this.updateLine(idx, 'debit', e.target.value), 
                    class: 'w-full h-12 px-4 rounded-xl text-right font-black text-xl text-emerald-600 bg-slate-50 border border-slate-200 focus:bg-white outline-none transition-all shadow-sm' 
                  })
                ]),
                h('div', { class: 'col-span-3' }, [
                  h('input', { 
                    type: 'number', 
                    placeholder: '0.00', 
                    value: l.credit === 0 ? '' : l.credit, 
                    onInput: e => this.updateLine(idx, 'credit', e.target.value), 
                    class: 'w-full h-12 px-4 rounded-xl text-right font-black text-xl text-slate-500 bg-slate-50 border border-slate-200 focus:bg-white outline-none transition-all shadow-sm' 
                  })
                ])
              ])
            ),
            h('button', { 
              onClick: () => this.newEntry.lines.push({ accountId: '', debit: 0, credit: 0 }), 
              class: 'w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-emerald-200 hover:text-emerald-600 transition-all' 
            }, '+ ADD TRANSACTION LINE')
          ]),

          h('div', { class: 'py-4 border-t mt-auto shrink-0 bg-white' }, [
             h('div', { class: 'flex justify-between items-center mb-4 px-2' }, [
               h('div', { class: 'space-y-0.5' }, [
                 h('p', { class: 'text-[8px] text-slate-400 font-black uppercase tracking-widest' }, 'Institutional Status'),
                 this.isBalanced 
                   ? h('span', { class: 'text-emerald-600 font-black text-[10px] flex items-center gap-1.5' }, [h('span', { class: 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' }), 'Balanced & Ready']) 
                   : h('span', { class: 'text-rose-500 font-black text-[10px] flex items-center gap-1.5' }, [h('span', { class: 'w-1.5 h-1.5 rounded-full bg-rose-500' }), 'Ledger Unbalanced'])
               ]),
               h('div', { class: 'flex flex-col items-end' }, [
                 h('div', { class: 'flex gap-6 text-right mb-2' }, [
                   h('div', [
                     h('p', { class: 'text-[8px] text-slate-400 font-black uppercase tracking-widest' }, 'Total Debit'),
                     h('p', { class: 'text-2xl font-black text-emerald-600 tracking-tighter' }, `₱${Number(this.totals.debit).toLocaleString()}`)
                   ]),
                   h('div', [
                     h('p', { class: 'text-[8px] text-slate-400 font-black uppercase tracking-widest' }, 'Total Credit'),
                     h('p', { class: 'text-2xl font-black text-slate-800 tracking-tighter' }, `₱${Number(this.totals.credit).toLocaleString()}`)
                   ])
                 ]),
                 // VALIDATION BANNER BELOW NUMBERS
                 !this.isBalanced ? h('div', { class: 'bg-rose-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-fade z-20 transition-all border border-white/20' }, [
                   h(Icon, { name: 'audit', size: 12 }),
                   h('span', this.validationMessage),
                 ]) : null
               ])
             ]),

             h('div', { class: 'flex items-stretch gap-4 h-14 relative' }, [
                h('button', { onClick: this.closeModal, class: 'px-6 rounded-xl font-black bg-rose-50 text-rose-600 border border-rose-100 transition-all text-[9px] uppercase tracking-widest hover:bg-rose-100' }, 'DISCARD'),
                h('div', { class: 'flex-1' }, [
                  h('button', { 
                    onClick: this.addEntry,
                    disabled: !this.isBalanced,
                    class: `w-full h-full rounded-xl text-white font-black transition-all text-base shadow-lg flex items-center justify-center gap-2.5 ${
                      this.isBalanced 
                      ? 'green-gradient hover:scale-[1.01] cursor-pointer' 
                      : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                    }`
                  }, [
                    h(Icon, { name: 'check', size: 20 }),
                    'POST TO LEDGER'
                  ])
                ])
             ])
          ])
        ])
      ]) : null
    ]);
  }
});
