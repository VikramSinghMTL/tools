<script setup>
import { Copy, Search, X } from "@lucide/vue";
import { computed, ref } from "vue";
import blooms from "./blooms.js";

const props = defineProps({
	// Words the user accepted as verbs in Verify.
	acceptedVerbs: { type: Array, default: () => [] },
});
const emit = defineEmits(["remove-verb"]);

const dialog = ref(null);
const search = ref(null);
const query = ref("");
const toast = ref(null); // { ok: boolean, text: string }
let toastTimer;

const levels = computed(() => {
	const q = query.value.trim().toLowerCase();
	return Object.entries(blooms).map(([level, verbs]) => ({
		level,
		verbs: verbs.filter((verb) => verb.toLowerCase().includes(q)),
	}));
});

function open() {
	query.value = "";
	toast.value = null;
	dialog.value.showModal();
	search.value.focus();
}

async function copy(verb) {
	try {
		await navigator.clipboard.writeText(verb);
		toast.value = { ok: true, text: `Copied “${verb}”` };
	} catch {
		toast.value = {
			ok: false,
			text: "Couldn’t copy. Your browser blocked clipboard access.",
		};
	}
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => (toast.value = null), 1800);
}

const yourVerbs = computed(() => {
	const q = query.value.trim().toLowerCase();
	return props.acceptedVerbs.filter((verb) => verb.includes(q));
});

defineExpose({ open });
</script>

<template>
  <dialog ref="dialog" class="modal">
    <div class="modal-box flex max-h-[88vh] w-11/12 max-w-6xl flex-col rounded-box border border-base-300 p-0 shadow-xl shadow-black/10">
      <div class="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-base-300 px-6 pt-6 pb-4">
        <div class="flex-1">
          <h2 class="font-serif text-2xl font-semibold tracking-tight">Example verbs</h2>
          <p class="mt-1 text-sm text-base-content/60">Ideas for each level of <a href="https://en.wikipedia.org/wiki/Bloom's_taxonomy" target="_blank" rel="noopener noreferrer" class="underline decoration-base-content/30 underline-offset-2 hover:text-primary hover:decoration-current">Bloom's taxonomy</a>, from lower-order (1) to higher-order (6) thinking. Any verb works. Click one to copy it.</p>
        </div>
        <div class="flex w-full items-center gap-2 border-b border-base-content/30 py-1 text-sm focus-within:border-primary sm:w-56">
          <Search class="size-3.5 opacity-50" />
          <input ref="search" v-model="query" type="search"
            aria-label="Find a verb" placeholder="Find a verb" class="w-full bg-transparent outline-none">
        </div>
        <form method="dialog" class="absolute top-3 right-3">
          <button type="submit" class="tool" title="Close"><X class="size-4" /></button>
        </form>
      </div>

      <div class="grid grid-cols-2 overflow-y-auto md:grid-cols-3 xl:grid-cols-6">
        <section
          v-for="({ level, verbs }, index) in levels"
          :key="level"
          class="border-base-300 px-4 py-4 not-last:border-r max-xl:border-b"
        >
          <h3 class="mb-2 font-serif font-semibold">
            <span class="mr-1 font-sans text-xs font-normal text-base-content/45 tabular-nums">{{ index + 1 }}</span>{{ level }}
          </h3>
          <ul class="-mx-1.5 text-sm">
            <li v-for="verb in verbs" :key="verb">
              <button
                type="button"
                class="group flex w-full cursor-pointer items-center justify-between rounded px-1.5 py-0.5 text-left hover:bg-base-200 focus-visible:bg-base-200 focus-visible:outline-none"
                :title="`Copy “${verb}”`"
                @click="copy(verb)"
              >
                {{ verb }}
                <Copy class="size-3.5 opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60" aria-hidden="true" />
              </button>
            </li>
            <li v-if="verbs.length === 0" class="px-1.5 py-0.5 text-base-content/40">No matches</li>
          </ul>
        </section>

        <section v-if="acceptedVerbs.length" class="col-span-full border-t border-base-300 px-4 py-4">
          <h3 class="font-serif font-semibold">Your verbs</h3>
          <p class="mb-2 text-xs text-base-content/55">
            Words you've accepted as verbs in Verify. They aren't tied to a Bloom's level.
          </p>
          <ul v-if="yourVerbs.length" class="flex flex-wrap gap-1.5 text-sm">
            <li v-for="verb in yourVerbs" :key="verb" class="flex items-center rounded border border-base-300">
              <button
                type="button"
                class="group flex cursor-pointer items-center gap-1.5 px-2 py-0.5 capitalize hover:bg-base-200 focus-visible:bg-base-200 focus-visible:outline-none"
                :title="`Copy “${verb}”`"
                @click="copy(verb.charAt(0).toUpperCase() + verb.slice(1))"
              >
                {{ verb }}
                <Copy class="size-3 opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60" aria-hidden="true" />
              </button>
              <button type="button" class="tool danger size-6!" :title="`Remove “${verb}”`" @click="emit('remove-verb', verb)"><X class="size-3.5" /></button>
            </li>
          </ul>
          <p v-else class="text-sm text-base-content/40">No matches</p>
        </section>
      </div>
    </div>

    <div
      v-if="toast"
      role="status"
      class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded bg-neutral px-3 py-1.5 text-sm text-neutral-content shadow-lg"
      :class="{ 'bg-error text-error-content': !toast.ok }"
    >
      {{ toast.text }}
    </div>

    <form method="dialog" class="modal-backdrop"><button type="submit">close</button></form>
  </dialog>
</template>
