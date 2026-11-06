<script>
import { autosize } from './autosize.js';
import VerbsDialog from './VerbsDialog.vue';
import {
  createTable,
  deleteTable,
  isEmptyTable,
  isTableKey,
  migrateLegacyTable,
  parseBackup,
  readAcceptedVerbs,
  readCurrentId,
  readTables,
  readTheme,
  readVerifyMode,
  toBackup,
  writeAcceptedVerbs,
  writeCurrentId,
  writeTable,
  writeTheme,
  writeVerifyMode,
} from './library.js';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileDown,
  FilePlus,
  Info,
  ListChecks,
  Moon,
  Plus,
  Sun,
  Trash2,
  Upload,
} from '@lucide/vue';

const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Dot colours for Verify notes.
const SEVERITY_DOT = {
  error: 'bg-error',
  warning: 'bg-warning',
  hint: 'bg-base-content/35',
};
const SEVERITY_RANK = { error: 0, warning: 1, hint: 2 };

const KNOWLEDGE_LABELS = ['Factual', 'Conceptual', 'Procedural', 'Metacognitive'];
const COGNITIVE_LABELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export default {
  directives: { autosize },
  components: {
    VerbsDialog,
    ArrowDown,
    ArrowUp,
    BookOpen,
    Check,
    ChevronDown,
    Copy,
    Download,
    FileDown,
    FilePlus,
    Info,
    ListChecks,
    Moon,
    Plus,
    Sun,
    Trash2,
    Upload,
  },
  data() {
    return {
      themeOverride: readTheme(), // 'light' | 'dark' | null (follow the system)
      systemDark: systemDarkQuery.matches,
      tables: [],
      currentId: null,
      storageError: '',
      importError: '',
      verifyMode: readVerifyMode(),
      acceptedVerbs: readAcceptedVerbs(),
      verification: null, // Result of verifyTable() for the current table, when verify mode is on.
      verifyPending: false, // An edit is waiting for the user to leave the field before re-checking.
      showDismissed: false,
      knowledgeLabels: KNOWLEDGE_LABELS,
      cognitiveLabels: COGNITIVE_LABELS,
      // Which rows the margin buttons under the pointer (or keyboard focus) act on.
      hover: { glo: null, slo: null, danger: false },
    };
  },
  computed: {
    table() {
      return this.tables.find((table) => table.id === this.currentId);
    },
    // The editing methods below work on the current table through these.
    title: {
      get() { return this.table.title; },
      set(value) { this.table.title = value; },
    },
    description: {
      get() { return this.table.description; },
      set(value) { this.table.description = value; },
    },
    glos: {
      get() { return this.table.glos; },
      set(value) { this.table.glos = value; },
    },
    isDark() {
      return this.themeOverride ? this.themeOverride === 'dark' : this.systemDark;
    },
    sortedTables() {
      return [...this.tables].sort((a, b) => b.updatedAt - a.updatedAt);
    },
    // Active (not dismissed) notes per cell, keyed "glo:slo:field".
    cellNotes() {
      const cells = {};
      for (const note of this.verification?.notes ?? []) {
        if (note.dismissed || note.glo === null || !note.field) continue;
        (cells[`${note.glo}:${note.slo}:${note.field}`] ??= []).push(note);
      }
      return cells;
    },
    // Notes grouped by objective, in table order.
    noteGroups() {
      const groups = [];
      for (const note of this.verification?.notes ?? []) {
        if (note.dismissed && !this.showDismissed) continue;
        let group = groups.find((g) => g.glo === note.glo && g.slo === note.slo);
        if (!group) groups.push((group = { glo: note.glo, slo: note.slo, label: note.label, notes: [] }));
        group.notes.push(note);
      }
      for (const group of groups) {
        group.notes.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
      }
      // Course-wide notes last.
      return groups.sort((a, b) => (a.glo === null) - (b.glo === null));
    },
    verifySummary() {
      const counts = this.verification?.counts;
      if (!counts) return [];
      return [
        ['error', counts.error, counts.error === 1 ? 'error' : 'errors'],
        ['warning', counts.warning, counts.warning === 1 ? 'warning' : 'warnings'],
        ['hint', counts.hint, counts.hint === 1 ? 'hint' : 'hints'],
      ].filter(([, n]) => n > 0);
    },
    gridMax() {
      return Math.max(1, ...(this.verification?.grid.flat() ?? []));
    },
  },
  created() {
    migrateLegacyTable();
    this.tables = readTables();

    const savedId = readCurrentId();
    if (this.tables.some((table) => table.id === savedId)) {
      this.currentId = savedId;
    } else if (this.tables.length) {
      this.currentId = this.sortedTables[0].id;
    } else {
      this.openTable(createTable());
    }

    // Auto-save the current table on every edit.
    this.$watch(
      () => [this.currentId, JSON.stringify({ title: this.title, description: this.description, glos: this.glos, dismissed: this.table.dismissed })],
      ([id, json], [previousId, previousJson]) => {
        // Switching tables, or a sync from another tab that changed nothing, is not an edit.
        if (id !== previousId || json === previousJson) return;
        this.table.updatedAt = Date.now();
        this.persist(this.table);
      }
    );

    // Verify mode: re-check after edits, but wait until the user leaves a text box they are typing in.
    this.$watch(
      () => JSON.stringify([this.verifyMode, this.currentId, this.glos, this.table.dismissed, this.acceptedVerbs]),
      () => {
        const typingIn = document.activeElement;
        if (this.verifyMode && typingIn?.tagName === 'TEXTAREA' && typingIn.closest('#table-of-objectives')) {
          this.verifyPending = true;
        } else {
          this.runVerify();
        }
      },
      { immediate: true }
    );
    document.addEventListener('focusout', () => {
      if (this.verifyPending) setTimeout(() => this.runVerify());
    });

    systemDarkQuery.addEventListener('change', (event) => {
      this.systemDark = event.matches;
    });

    // Keep the list (and the open table) in step with other tabs.
    window.addEventListener('storage', (event) => {
      if (isTableKey(event.key)) this.syncFromStorage();
    });
  },
  methods: {
    // Flips light/dark. Picking what the system already uses clears the override, so the app follows
    // the system again from then on.
    toggleTheme() {
      const next = this.isDark ? 'light' : 'dark';
      this.themeOverride = next === (this.systemDark ? 'dark' : 'light') ? null : next;
      writeTheme(this.themeOverride);

      const root = document.documentElement;
      if (this.themeOverride) root.dataset.theme = this.themeOverride === 'dark' ? 'paper-dark' : 'paper';
      else delete root.dataset.theme;
    },
    hoverRow(glo, slo = null) {
      this.hover = { glo, slo, danger: false };
    },
    // Highlight class for a cell. GLO cells and "Add" rows pass sloIndex -1, so they light up
    // only when a whole GLO is targeted.
    highlight(gloIndex, sloIndex) {
      const { glo, slo, danger } = this.hover;
      if (glo !== gloIndex || (slo !== null && slo !== sloIndex)) return null;
      return danger ? 'hl-danger' : 'hl';
    },
    dotClass(severity) {
      return SEVERITY_DOT[severity];
    },
    // The most severe note for a cell, plus all of its messages for the tooltip.
    cellDot(glo, slo, field) {
      const notes = this.cellNotes[`${glo}:${slo}:${field}`];
      if (!notes) return null;
      const worst = notes.reduce((a, b) => (SEVERITY_RANK[b.severity] < SEVERITY_RANK[a.severity] ? b : a));
      return { class: SEVERITY_DOT[worst.severity], title: notes.map((n) => n.message).join('\n') };
    },
    async runVerify() {
      this.verifyPending = false;
      if (!this.verifyMode) {
        this.verification = null;
        return;
      }

      // Loaded on demand: the verb list is ~70 KB.
      const { verifyTable } = await import('./verify.js');
      const table = this.table;
      const result = verifyTable(table, { acceptedVerbs: this.acceptedVerbs, dismissed: table.dismissed });

      // Forget dismissals whose note no longer exists: the objective changed, so it is re-checked.
      const live = new Set(result.notes.map((note) => note.key));
      if (table.dismissed.some((key) => !live.has(key))) {
        table.dismissed = table.dismissed.filter((key) => live.has(key));
      }

      this.verification = result;
    },
    toggleVerify() {
      writeVerifyMode(this.verifyMode);
    },
    dismissNote(note) {
      this.table.dismissed = [...this.table.dismissed, note.key];
    },
    restoreNote(note) {
      this.table.dismissed = this.table.dismissed.filter((key) => key !== note.key);
    },
    acceptVerb(word) {
      if (!this.acceptedVerbs.includes(word)) {
        this.acceptedVerbs = [...this.acceptedVerbs, word].sort();
        writeAcceptedVerbs(this.acceptedVerbs);
      }
    },
    removeAcceptedVerb(word) {
      this.acceptedVerbs = this.acceptedVerbs.filter((verb) => verb !== word);
      writeAcceptedVerbs(this.acceptedVerbs);
    },
    // Scrolls to a note's objective and briefly highlights it, like the margin buttons do.
    revealRow(group) {
      if (group.glo === null) return;
      const row = document.querySelector(`[data-row="${group.glo}-${group.slo ?? 0}"]`);
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.hoverRow(group.glo, group.slo);
      clearTimeout(this.revealTimer);
      this.revealTimer = setTimeout(() => {
        if (this.hover.glo === group.glo && this.hover.slo === group.slo) this.hoverRow(null);
      }, 1600);
    },
    tableName(table) {
      return table.title.trim() || 'Untitled table';
    },
    editedAgo(table) {
      const seconds = (table.updatedAt - Date.now()) / 1000;
      if (seconds > -60) return 'just now';
      if (seconds > -3600) return relativeTime.format(Math.round(seconds / 60), 'minute');
      if (seconds > -86400) return relativeTime.format(Math.round(seconds / 3600), 'hour');
      if (seconds > -86400 * 7) return relativeTime.format(Math.round(seconds / 86400), 'day');
      return new Date(table.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    },
    persist(table) {
      try {
        writeTable(table);
        this.storageError = '';
      } catch (error) {
        this.storageError = 'Your changes could not be saved in this browser (' + error.message + '). Export a backup to keep a copy.';
      }
    },
    syncFromStorage() {
      const stored = readTables();
      const current = this.table;
      if (current && !stored.some((table) => table.id === current.id)) stored.push(current);
      this.tables = stored;
    },
    closeMenu() {
      document.activeElement?.blur();
    },
    // Opens a table, dropping the one being left if nothing was ever typed into it.
    openTable(table) {
      const leaving = this.table;
      if (leaving && leaving.id !== table.id && isEmptyTable(leaving)) {
        this.tables = this.tables.filter((t) => t.id !== leaving.id);
      }
      if (!this.tables.includes(table)) this.tables.push(table);

      this.currentId = table.id;
      this.importError = '';
      writeCurrentId(table.id);
      this.closeMenu();
    },
    newTable() {
      if (isEmptyTable(this.table)) {
        this.closeMenu();
        return;
      }
      this.openTable(createTable());
    },
    duplicateTable() {
      // A JSON round trip deep-copies the reactive table (structuredClone rejects Vue proxies).
      const copy = createTable({ ...parseBackup(toBackup(this.table)), title: this.tableName(this.table) + ' (copy)' });
      this.openTable(copy);
      this.persist(copy);
    },
    deleteCurrentTable() {
      if (!confirm('Delete "' + this.tableName(this.table) + '"? This cannot be undone.')) return;

      const id = this.currentId;
      deleteTable(id);
      this.tables = this.tables.filter((table) => table.id !== id);
      this.openTable(this.sortedTables[0] ?? createTable());
    },
    exportBackup() {
      const file = new Blob([toBackup(this.table)], { type: 'application/json' });
      downloadBlob(file, this.tableName(this.table).replace(/[\\/:*?"<>|]/g, '-') + '.json');
      this.closeMenu();
    },
    importBackup(event) {
      const file = event.target.files[0];
      // Allow importing the same file again later.
      event.target.value = '';
      if (!file) return;

      file.text().then((json) => {
        try {
          const table = createTable(parseBackup(json));
          this.openTable(table);
          this.persist(table);
        } catch (error) {
          this.importError = `Could not import ${file.name}: ${error.message}`;
        }
      });
    },
    addGlo() {
      this.glos.push({
        id: this.glos.length + 1,
        description: '',
        slos: [
          {
            id: this.glos.length + 1 + '.1',
            description: '',
            knowledge: '',
            cognitive: '',
          },
        ],
      });
    },
    addSlo(gloId) {
      const sloId = gloId + '.' + (this.glos[gloId - 1].slos.length + 1);
      this.glos[gloId - 1].slos.push({
        id: sloId,
        description: '',
        knowledge: '',
        cognitive: '',
      });
    },
    removeSlo(gloId, sloId) {
      if (this.glos.length == 1 && this.glos[gloId].slos.length == 1) {
        this.glos = [];
        return;
      }

      if (this.glos[gloId].slos.length == 1) {
        this.glos.splice(gloId, 1);
      } else {
        this.glos[gloId].slos.splice(sloId, 1);
      }

      for (let i = gloId; i < this.glos.length; i++) {
        this.glos[i].id = i + 1;

        for (let j = sloId; j < this.glos[i].slos.length; j++) {
          this.glos[i].slos[j].id = i + 1 + '.' + (j + 1);
        }
      }
    },
    promoteSlo(gloId, sloId) {
      this.glos[gloId].slos.splice(sloId - 1, 0, this.glos[gloId].slos[sloId]);
      this.glos[gloId].slos.splice(sloId + 1, 1);
      this.glos[gloId].slos[sloId].id = gloId + 1 + '.' + (sloId + 1);
      this.glos[gloId].slos[sloId - 1].id = gloId + 1 + '.' + sloId;
    },
    demoteSlo(gloId, sloId) {
      this.glos[gloId].slos.splice(sloId + 2, 0, this.glos[gloId].slos[sloId]);
      this.glos[gloId].slos.splice(sloId, 1);
      this.glos[gloId].slos[sloId].id = gloId + 1 + '.' + (sloId + 1);
      this.glos[gloId].slos[sloId + 1].id = gloId + 1 + '.' + (sloId + 2);
    },
    removeGlo(gloId) {
      if (this.glos.length == 1) {
        this.glos = [];
        return;
      }

      this.glos.splice(gloId, 1);

      for (let i = gloId; i < this.glos.length; i++) {
        this.glos[i].id = i + 1;

        for (let j = 0; j < this.glos[i].slos.length; j++) {
          this.glos[i].slos[j].id = i + 1 + '.' + (j + 1);
        }
      }
    },
    promoteGlo(gloId) {
      for (let j = 0; j < this.glos[gloId].slos.length; j++) {
        this.glos[gloId].slos[j].id = gloId + '.' + (j + 1);
      }

      for (let j = 0; j < this.glos[gloId - 1].slos.length; j++) {
        this.glos[gloId - 1].slos[j].id = gloId + 1 + '.' + (j + 1);
      }

      this.glos.splice(gloId - 1, 0, this.glos[gloId]);
      this.glos.splice(gloId + 1, 1);
      this.glos[gloId].id = gloId + 1;
      this.glos[gloId - 1].id = gloId;
    },
    demoteGlo(gloId) {
      for (let j = 0; j < this.glos[gloId].slos.length; j++) {
        this.glos[gloId].slos[j].id = gloId + 2 + '.' + (j + 1);
      }

      for (let j = 0; j < this.glos[gloId + 1].slos.length; j++) {
        this.glos[gloId + 1].slos[j].id = gloId + 1 + '.' + (j + 1);
      }

      this.glos.splice(gloId + 2, 0, this.glos[gloId]);
      this.glos.splice(gloId, 1);
      this.glos[gloId].id = gloId + 1;
      this.glos[gloId + 1].id = gloId + 2;
    },
    async exportToFile() {
      const { exportToDocx } = await import('./export-docx.js');
      const blob = await exportToDocx(this.title, this.description, this.glos);
      downloadBlob(blob, 'Table of Objectives - ' + this.tableName(this.table).replace(/[\\/:*?"<>|]/g, '-') + '.docx');
    },
    showVerbs() {
      this.$refs.verbs.open();
    },
  },
};

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
}
</script>

<template>
  <header class="border-b border-base-300">
    <div class="mx-auto flex max-w-[84rem] items-center gap-3 px-4 py-2.5 sm:px-6">
      <span class="hidden font-serif text-[1.0625rem] font-semibold tracking-tight whitespace-nowrap sm:inline">Table of Objectives</span>
      <span class="hidden text-base-content/25 sm:inline">/</span>

      <div class="dropdown min-w-0">
        <div tabindex="0" role="button" class="tb-btn min-w-0 font-normal" title="Switch table">
          <span class="truncate">{{ tableName(table) }}</span>
          <ChevronDown class="size-3.5! shrink-0" />
        </div>
        <div tabindex="0" class="dropdown-content z-30 mt-1 w-80 rounded-box border border-base-300 bg-base-100 py-1 text-sm shadow-lg shadow-black/5">
          <ul class="max-h-72 overflow-y-auto py-1">
            <li v-for="item in sortedTables" :key="item.id">
              <button type="button" class="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-base-200" @click="openTable(item)">
                <Check class="size-3.5 shrink-0" :class="item.id === currentId ? '' : 'invisible'" />
                <span class="min-w-0 flex-1 truncate" :class="{ 'font-semibold': item.id === currentId }">{{ tableName(item) }}</span>
                <span class="text-xs whitespace-nowrap text-base-content/50">{{ editedAgo(item) }}</span>
              </button>
            </li>
          </ul>
          <ul class="border-t border-base-300 py-1">
            <li><button type="button" class="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-base-200" @click="newTable()"><FilePlus class="size-3.5 shrink-0 opacity-70" /> New table</button></li>
            <li><button type="button" class="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-base-200" @click="duplicateTable()"><Copy class="size-3.5 shrink-0 opacity-70" /> Duplicate</button></li>
            <li><button type="button" class="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-base-200 text-error" @click="closeMenu(); deleteCurrentTable()"><Trash2 class="size-3.5 shrink-0" /> Delete…</button></li>
          </ul>
          <ul class="border-t border-base-300 py-1">
            <li class="px-3 pt-1.5 pb-0.5 pl-8.5 text-xs text-base-content/55">
              Only needed to move a table to another browser or device. Everything here saves automatically.
            </li>
            <li><button type="button" class="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-base-200" @click="exportBackup()"><Download class="size-3.5 shrink-0 opacity-70" /> Export backup</button></li>
            <li><button type="button" class="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-base-200" @click="closeMenu(); $refs.importInput.click()"><Upload class="size-3.5 shrink-0 opacity-70" /> Import backup…</button></li>
          </ul>
          <p class="flex gap-2 border-t border-base-300 px-3 pt-2 pb-1.5 text-xs leading-relaxed text-base-content/55">
            <Info class="mt-0.5 size-3.5 shrink-0" />
            Tables are saved in this browser only and don't sync to other browsers or devices.
          </p>
        </div>
      </div>
      <input ref="importInput" type="file" class="hidden" accept=".json,application/json" @change="importBackup">

      <nav class="ml-auto flex shrink-0 items-center gap-1">
        <button type="button" class="tb-btn" title="Example verbs" @click="showVerbs()">
          <BookOpen /><span class="hidden sm:inline">Example verbs</span>
        </button>
        <button
          type="button"
          class="tb-btn"
          :aria-pressed="verifyMode"
          :title="verifyMode ? 'Verify is on: objectives are checked as you edit' : 'Check objectives as you edit'"
          @click="verifyMode = !verifyMode; toggleVerify()"
        >
          <ListChecks />
          <span>Verify</span>
          <span v-if="verifyMode && verification" class="hidden items-center gap-1.5 text-xs font-normal tabular-nums md:flex">
            <template v-if="verifySummary.length">
              <span v-for="[severity, count] in verifySummary" :key="severity" class="flex items-center gap-1">
                <span class="size-1.5 rounded-full" :class="dotClass(severity)"></span>{{ count }}
              </span>
            </template>
            <span v-else>✓</span>
          </span>
        </button>
        <button type="button" class="tb-btn tb-primary" title="Export to Word" @click="exportToFile()">
          <FileDown /><span class="hidden sm:inline">Export to Word</span>
        </button>
        <button
          type="button"
          class="tb-btn tb-icon"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme()"
        >
          <Sun v-if="isDark" />
          <Moon v-else />
        </button>
      </nav>
    </div>
  </header>

  <main class="px-3 py-8 sm:px-6 sm:py-12">
    <p v-if="storageError" role="alert" class="mx-auto mb-4 max-w-[84rem] text-sm text-error">{{ storageError }}</p>
    <p v-if="importError" role="alert" class="mx-auto mb-4 max-w-[84rem] text-sm text-error">{{ importError }}</p>

    <article class="mx-auto max-w-[84rem] border border-base-300 bg-base-100 px-5 py-10 shadow-sm shadow-black/[0.03] sm:px-12 sm:py-14 lg:px-16">
      <textarea
        v-autosize
        v-model="title"
        class="doc-field text-center font-serif text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl"
        placeholder="Course name"
        aria-label="Course name"
        @keydown.enter.prevent
      ></textarea>

      <h2 class="mt-10 mb-1 font-serif text-lg font-semibold text-primary">Course Description</h2>
      <textarea
        v-autosize
        v-model="description"
        class="doc-field max-w-[75ch]"
        placeholder="What the course covers, who it's for, and what students will do."
        aria-label="Course description"
      ></textarea>

      <div class="relative mt-10 -mr-5 overflow-x-auto pr-5 sm:-mr-12 sm:pr-12 lg:-mr-16 lg:pr-4">
        <table id="table-of-objectives" class="toa">
          <thead>
            <tr>
              <th class="cell w-[28%]">General Learning Objective</th>
              <th class="cell">Specific Learning Objective</th>
              <th class="cell w-36">Knowledge Dimension</th>
              <th class="cell w-36">Cognitive Process</th>
              <th class="margin" colspan="2"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="glos.length === 0">
              <td class="cell py-8 text-center text-base-content/45" colspan="4">No objectives yet.</td>
              <td class="margin" colspan="2"></td>
            </tr>
            <template v-for="(glo, gloIndex) in glos" :key="glo.id">
              <tr v-for="(slo, sloIndex) in glo.slos" :key="slo.id" :data-row="gloIndex + '-' + sloIndex">
                <td v-if="sloIndex === 0" class="cell relative" :class="highlight(gloIndex, -1)" :rowspan="glo.slos.length + 1">
                  <span v-if="cellDot(gloIndex, null, 'description')" class="note-dot" v-bind="cellDot(gloIndex, null, 'description')"></span>
                  <div class="flex gap-3">
                    <span class="w-5 shrink-0 pt-0.5 font-semibold tabular-nums">{{ glo.id }}</span>
                    <textarea
                      v-autosize
                      v-model="glo.description"
                      class="doc-field"
                      placeholder="General objective, e.g. Understand why the college system was created."
                      aria-label="General learning objective"
                    ></textarea>
                  </div>
                </td>
                <td class="cell relative" :class="highlight(gloIndex, sloIndex)">
                  <span v-if="cellDot(gloIndex, sloIndex, 'description')" class="note-dot" v-bind="cellDot(gloIndex, sloIndex, 'description')"></span>
                  <div class="flex gap-3">
                    <span class="w-7 shrink-0 pt-0.5 tabular-nums">{{ slo.id }}</span>
                    <textarea
                      v-autosize
                      v-model="slo.description"
                      class="doc-field"
                      placeholder="Specific objective, starting with a verb."
                      aria-label="Specific learning objective"
                    ></textarea>
                  </div>
                </td>
                <td class="cell relative" :class="highlight(gloIndex, sloIndex)">
                  <span v-if="cellDot(gloIndex, sloIndex, 'knowledge')" class="note-dot" v-bind="cellDot(gloIndex, sloIndex, 'knowledge')"></span>
                  <select v-model="slo.knowledge" class="doc-field" :class="{ 'text-base-content/40': !slo.knowledge }" aria-label="Knowledge dimension">
                    <option value="">Choose…</option>
                    <option value="factual">Factual</option>
                    <option value="conceptual">Conceptual</option>
                    <option value="procedural">Procedural</option>
                    <option value="metacognitive">Metacognitive</option>
                  </select>
                </td>
                <td class="cell relative" :class="highlight(gloIndex, sloIndex)">
                  <span v-if="cellDot(gloIndex, sloIndex, 'cognitive')" class="note-dot" v-bind="cellDot(gloIndex, sloIndex, 'cognitive')"></span>
                  <select v-model="slo.cognitive" class="doc-field" :class="{ 'text-base-content/40': !slo.cognitive }" aria-label="Cognitive process">
                    <option value="">Choose…</option>
                    <option value="remember">Remember</option>
                    <option value="understand">Understand</option>
                    <option value="apply">Apply</option>
                    <option value="analyze">Analyze</option>
                    <option value="evaluate">Evaluate</option>
                    <option value="create">Create</option>
                  </select>
                </td>
                <td
                  class="margin"
                  @mouseenter="hoverRow(gloIndex, sloIndex)"
                  @mouseleave="hoverRow(null)"
                  @focusin="hoverRow(gloIndex, sloIndex)"
                  @focusout="hoverRow(null)"
                >
                  <button type="button" class="tool" title="Move specific objective up" :disabled="sloIndex === 0" @click="promoteSlo(gloIndex, sloIndex)"><ArrowUp class="size-3.5" /></button>
                  <button type="button" class="tool" title="Move specific objective down" :disabled="sloIndex === glo.slos.length - 1" @click="demoteSlo(gloIndex, sloIndex)"><ArrowDown class="size-3.5" /></button>
                  <button type="button" class="tool danger" title="Delete specific objective" @mouseenter="hover.danger = true" @mouseleave="hover.danger = false" @focus="hover.danger = true" @blur="hover.danger = false" @click="removeSlo(gloIndex, sloIndex)"><Trash2 class="size-3.5" /></button>
                </td>
                <td
                  v-if="sloIndex === 0"
                  class="margin border-l border-base-300 pl-2"
                  :rowspan="glo.slos.length + 1"
                  @mouseenter="hoverRow(gloIndex)"
                  @mouseleave="hoverRow(null)"
                  @focusin="hoverRow(gloIndex)"
                  @focusout="hoverRow(null)"
                >
                  <div class="flex flex-col">
                    <button type="button" class="tool" title="Move general objective up" :disabled="gloIndex === 0" @click="promoteGlo(gloIndex)"><ArrowUp class="size-3.5" /></button>
                    <button type="button" class="tool" title="Move general objective down" :disabled="gloIndex === glos.length - 1" @click="demoteGlo(gloIndex)"><ArrowDown class="size-3.5" /></button>
                    <button type="button" class="tool danger" title="Delete general objective and its specific objectives" @mouseenter="hover.danger = true" @mouseleave="hover.danger = false" @focus="hover.danger = true" @blur="hover.danger = false" @click="removeGlo(gloIndex)"><Trash2 class="size-3.5" /></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="cell py-1" :class="highlight(gloIndex, -1)" colspan="3">
                  <button type="button" class="add-link inline-flex items-center gap-1" @click="addSlo(glo.id)">
                    <Plus class="size-3.5" /> Add specific objective
                  </button>
                </td>
                <td class="margin"></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <button type="button" class="add-link mt-4 inline-flex items-center gap-1" @click="addGlo()">
        <Plus class="size-3.5" /> Add general objective
      </button>
    </article>

    <template v-if="verifyMode && verification">
      <section class="mx-auto mt-10 max-w-[84rem]" aria-label="Verify notes">
        <div class="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 class="text-xs font-semibold tracking-wider text-base-content/60 uppercase">Verify</h2>
          <span class="text-xs text-base-content/60">
            <template v-if="verifySummary.length">{{ verifySummary.map(([, n, word]) => n + ' ' + word).join(' · ') }}</template>
            <template v-else>No issues found.</template>
          </span>
          <button
            v-if="verification.counts.dismissed"
            type="button"
            class="ml-auto text-xs text-base-content/60 hover:text-base-content hover:underline"
            @click="showDismissed = !showDismissed"
          >
            {{ showDismissed ? 'Hide' : 'Show' }} {{ verification.counts.dismissed }} dismissed
          </button>
        </div>

        <ol v-if="noteGroups.length" class="divide-y divide-base-300 border-y border-base-300 text-sm">
          <li v-for="group in noteGroups" :key="group.glo + ':' + group.slo" class="flex items-baseline gap-4 py-2.5">
            <button
              type="button"
              class="w-14 shrink-0 text-left font-semibold tabular-nums"
              :class="group.glo === null ? 'cursor-default font-normal text-base-content/60' : 'hover:text-primary hover:underline'"
              :title="group.glo === null ? null : 'Show in table'"
              @click="revealRow(group)"
            >{{ group.label }}</button>
            <ul class="min-w-0 flex-1 space-y-1.5">
              <li v-for="note in group.notes" :key="note.key" class="flex items-baseline gap-2.5" :class="{ 'opacity-50': note.dismissed }">
                <span class="size-2 shrink-0 translate-y-[-1px] rounded-full" :class="dotClass(note.severity)"></span>
                <span class="min-w-0 flex-1">{{ note.message }}</span>
                <span class="flex shrink-0 gap-3 text-xs">
                  <button v-if="note.code === 'not-verb' && note.word" type="button" class="text-primary hover:underline" @click="acceptVerb(note.word)">
                    Accept “{{ note.word }}” as a verb
                  </button>
                  <button v-if="note.dismissible && !note.dismissed" type="button" class="text-base-content/55 hover:text-base-content hover:underline" @click="dismissNote(note)">Dismiss</button>
                  <button v-if="note.dismissed" type="button" class="text-base-content/55 hover:text-base-content hover:underline" @click="restoreNote(note)">Restore</button>
                </span>
              </li>
            </ul>
          </li>
        </ol>
      </section>

      <section class="mx-auto mt-10 max-w-[84rem]" aria-label="Overview">
        <h2 class="mb-1 text-xs font-semibold tracking-wider text-base-content/60 uppercase">Overview</h2>
        <p class="mb-3 text-xs text-base-content/60">Specific objectives by Knowledge Dimension and Cognitive Process.</p>
        <div class="overflow-x-auto">
          <table class="toa min-w-0! w-auto text-sm">
            <thead>
              <tr>
                <th class="cell"><span class="sr-only">Knowledge Dimension</span></th>
                <th v-for="label in cognitiveLabels" :key="label" class="cell w-24 font-medium!">{{ label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, k) in verification.grid" :key="k">
                <th class="cell pr-6 text-left font-medium">{{ knowledgeLabels[k] }}</th>
                <td
                  v-for="(count, c) in row"
                  :key="c"
                  class="cell text-center align-middle tabular-nums"
                  :class="{ 'text-base-content/25': !count }"
                  :style="count ? { background: `color-mix(in oklab, var(--color-primary) ${Math.round(6 + (count / gridMax) * 22)}%, transparent)` } : null"
                >{{ count || '·' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </main>

  <footer class="px-4 pb-10 text-center text-xs text-base-content/50">
    Your tables are saved in this browser only and don't sync to other browsers or devices.
    Use <em>Export backup</em> in the table menu to keep a copy.
  </footer>

  <VerbsDialog ref="verbs" :accepted-verbs="acceptedVerbs" @remove-verb="removeAcceptedVerb" />
</template>
