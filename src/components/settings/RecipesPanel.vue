<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ApiError } from '../../services/api';
import { recipesApi, type Product, type Recipe } from '../../services/recipes';
import { errorMessage, formatDateTime } from '../../utils/activityFormat';
import { formatNumber } from '../../utils/datetime';
import ConfirmDialog from '../ui/ConfirmDialog.vue';
import RecipeCreateForm from './RecipeCreateForm.vue';

type DialogKind = 'archive' | 'delete' | 'delete-conflict';

const recipes = ref<Recipe[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const includeArchived = ref(false);
let listSeq = 0;

const products = ref<Product[]>([]);
const productsLoaded = ref(false);
const productsLoading = ref(false);
const productsError = ref<string | null>(null);

const createOpen = ref(false);
const expandedId = ref<string | null>(null);
const actionError = ref<string | null>(null);

const renamingId = ref<string | null>(null);
const renameDraft = ref('');
const renameSaving = ref(false);
const renameError = ref<string | null>(null);

const dialog = ref<{ kind: DialogKind; recipe: Recipe; detail?: string } | null>(null);
const dialogBusy = ref(false);

const productNames = computed(() => new Map(products.value.map((p) => [p.id, p.name])));

async function loadList() {
  const seq = ++listSeq;
  loading.value = true;
  error.value = null;
  try {
    const result = await recipesApi.list(includeArchived.value);
    if (seq === listSeq) recipes.value = result;
  } catch (e) {
    if (seq !== listSeq) return;
    recipes.value = [];
    error.value = errorMessage(e);
  } finally {
    if (seq === listSeq) loading.value = false;
  }
}

async function loadProducts() {
  productsLoading.value = true;
  productsError.value = null;
  try {
    products.value = await recipesApi.listProducts();
    productsLoaded.value = true;
  } catch (e) {
    productsError.value = errorMessage(e);
  } finally {
    productsLoading.value = false;
  }
}

function ensureProducts() {
  if (!productsLoaded.value && !productsLoading.value) loadProducts();
}

function openCreate() {
  createOpen.value = true;
  ensureProducts();
}

function onCreated(recipe: Recipe) {
  createOpen.value = false;
  recipes.value = [...recipes.value, recipe].sort((a, b) => a.name.localeCompare(b.name));
}

function toggleExpand(recipe: Recipe) {
  expandedId.value = expandedId.value === recipe.id ? null : recipe.id;
  if (expandedId.value) ensureProducts();
}

function replaceRecipe(updated: Recipe) {
  // Archiving drops the row from the list while archived recipes are hidden
  recipes.value = recipes.value
    .map((r) => (r.id === updated.id ? updated : r))
    .filter((r) => includeArchived.value || !r.archived);
}

function startRename(recipe: Recipe) {
  renamingId.value = recipe.id;
  renameDraft.value = recipe.name;
  renameError.value = null;
}

function cancelRename() {
  renamingId.value = null;
  renameError.value = null;
}

async function saveRename(recipe: Recipe) {
  const name = renameDraft.value.trim();
  if (!name) {
    renameError.value = 'Enter a recipe name';
    return;
  }
  if (name === recipe.name) {
    cancelRename();
    return;
  }
  renameSaving.value = true;
  renameError.value = null;
  try {
    replaceRecipe(await recipesApi.update(recipe.id, { name }));
    renamingId.value = null;
  } catch (e) {
    renameError.value = errorMessage(e);
  } finally {
    renameSaving.value = false;
  }
}

async function unarchive(recipe: Recipe) {
  actionError.value = null;
  try {
    replaceRecipe(await recipesApi.update(recipe.id, { archived: false }));
  } catch (e) {
    actionError.value = errorMessage(e);
  }
}

async function confirmDialog() {
  if (!dialog.value) return;
  const { kind, recipe } = dialog.value;
  dialogBusy.value = true;
  actionError.value = null;
  try {
    if (kind === 'delete') {
      await recipesApi.remove(recipe.id);
      recipes.value = recipes.value.filter((r) => r.id !== recipe.id);
      dialog.value = null;
    } else {
      replaceRecipe(await recipesApi.update(recipe.id, { archived: true }));
      dialog.value = null;
    }
  } catch (e) {
    if (kind === 'delete' && e instanceof ApiError && e.status === 409) {
      // Referenced by dishes: offer archiving instead
      dialog.value = { kind: 'delete-conflict', recipe, detail: e.message };
    } else {
      dialog.value = null;
      actionError.value = errorMessage(e);
    }
  } finally {
    dialogBusy.value = false;
  }
}

const dialogTitle = computed(() => {
  switch (dialog.value?.kind) {
    case 'archive':
      return 'Archive recipe?';
    case 'delete':
      return 'Delete recipe?';
    default:
      return 'Recipe cannot be deleted';
  }
});

// Archiving instead of deleting reuses the archive branch of the confirm handler
const dialogConfirmText = computed(() => {
  switch (dialog.value?.kind) {
    case 'delete':
      return 'Delete';
    case 'delete-conflict':
      return 'Archive instead';
    default:
      return 'Archive';
  }
});

function onDialogConfirm() {
  if (dialog.value?.kind === 'delete-conflict') {
    dialog.value = { kind: 'archive', recipe: dialog.value.recipe };
  }
  confirmDialog();
}

watch(includeArchived, () => {
  expandedId.value = null;
  loadList();
});

onMounted(loadList);
</script>

<template>
  <div class="card recipes-card">
    <div class="toolbar">
      <div class="archived-toggle">
        <button
          id="recipes-archived"
          type="button"
          class="switch"
          role="switch"
          :aria-checked="includeArchived"
          aria-labelledby="recipes-archived-label"
          @click="includeArchived = !includeArchived"
        ></button>
        <span id="recipes-archived-label">Show archived</span>
      </div>
      <button v-if="!createOpen" type="button" class="btn btn-filled" @click="openCreate">New recipe</button>
    </div>

    <RecipeCreateForm
      v-if="createOpen"
      :products="products"
      :products-loading="productsLoading"
      :products-error="productsError"
      @created="onCreated"
      @cancel="createOpen = false"
      @retry-products="loadProducts"
    />

    <p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p>

    <p v-if="loading" class="state muted">Loading data...</p>
    <div v-else-if="error" class="state error">
      {{ error }}
      <button type="button" class="btn btn-outlined btn-sm" @click="loadList">Retry</button>
    </div>
    <p v-else-if="recipes.length === 0" class="state muted">
      {{ includeArchived ? 'No recipes yet' : 'No active recipes' }}
    </p>

    <ul v-else class="recipe-list">
      <li v-for="r in recipes" :key="r.id" class="recipe">
        <div class="recipe-row">
          <div class="recipe-name">
            <form v-if="renamingId === r.id" class="rename-form" @submit.prevent="saveRename(r)">
              <input
                v-model="renameDraft"
                type="text"
                class="input"
                :aria-label="`New name for ${r.name}`"
                :aria-invalid="renameError ? true : undefined"
                :disabled="renameSaving"
                @keydown.esc="cancelRename"
              />
              <button type="submit" class="btn btn-filled btn-sm" :disabled="renameSaving">
                {{ renameSaving ? 'Saving...' : 'Save' }}
              </button>
              <button type="button" class="btn btn-outlined btn-sm" :disabled="renameSaving" @click="cancelRename">
                Cancel
              </button>
            </form>
            <template v-else>
              <span class="name-text">{{ r.name }}</span>
              <span v-if="r.archived" class="badge">Archived</span>
            </template>
          </div>

          <span class="mono muted recipe-count">{{ formatNumber(r.product_ids.length) }} products</span>
          <span class="mono muted recipe-date">{{ formatDateTime(r.updated_at) }}</span>

          <div class="recipe-actions">
            <button type="button" class="btn btn-sm" :disabled="renamingId === r.id" @click="startRename(r)">Rename</button>
            <button v-if="r.archived" type="button" class="btn btn-sm" @click="unarchive(r)">Unarchive</button>
            <button v-else type="button" class="btn btn-sm" @click="dialog = { kind: 'archive', recipe: r }">Archive</button>
            <button type="button" class="btn btn-danger btn-sm" @click="dialog = { kind: 'delete', recipe: r }">Delete</button>
            <button
              type="button"
              class="btn btn-icon btn-sm"
              :aria-expanded="expandedId === r.id"
              :aria-label="`Products of ${r.name}`"
              @click="toggleExpand(r)"
            >
              <svg class="i" viewBox="0 0 24 24" aria-hidden="true">
                <path :d="expandedId === r.id ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'" />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="renamingId === r.id && renameError" class="rename-error" role="alert">{{ renameError }}</p>

        <div v-if="expandedId === r.id" class="recipe-detail">
          <span class="label">Products</span>
          <p v-if="productsLoading" class="muted">Loading data...</p>
          <p v-else-if="productsError" class="rename-error">
            {{ productsError }}
            <button type="button" class="btn btn-outlined btn-sm" @click="loadProducts">Retry</button>
          </p>
          <p v-else-if="r.product_ids.length === 0" class="muted">This recipe has no products</p>
          <ul v-else class="product-chips">
            <li v-for="pid in r.product_ids" :key="pid" class="badge b-link">
              {{ productNames.get(pid) ?? pid }}
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </div>

  <ConfirmDialog
    :is-open="dialog !== null"
    :title="dialogTitle"
    :confirm-text="dialogConfirmText"
    :confirm-danger="dialog?.kind === 'delete'"
    :loading="dialogBusy"
    @confirm="onDialogConfirm"
    @cancel="dialog = null"
  >
    <template v-if="dialog?.kind === 'archive'">
      <strong class="dialog-strong">{{ dialog.recipe.name }}</strong> will be hidden from the active list. You can
      unarchive it later.
    </template>
    <template v-else-if="dialog?.kind === 'delete'">
      <strong class="dialog-strong">{{ dialog.recipe.name }}</strong> will be deleted permanently.
    </template>
    <template v-else-if="dialog?.kind === 'delete-conflict'">
      {{ dialog.detail }}. Archive <strong class="dialog-strong">{{ dialog.recipe.name }}</strong> instead?
    </template>
  </ConfirmDialog>
</template>

<style scoped>
.recipes-card {
  overflow: hidden;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bpt-sp-3);
  padding: var(--bpt-sp-3) var(--bpt-sp-4);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.archived-toggle {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-3);
}

.state {
  padding: var(--bpt-sp-6);
  text-align: center;
}

.state.error,
.action-error,
.rename-error {
  color: var(--md-sys-color-error);
}

.action-error {
  padding: var(--bpt-sp-3) var(--bpt-sp-4);
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  word-break: break-word;
}

.rename-error {
  font-size: var(--bpt-fs-cell);
  word-break: break-word;
}

.recipe-list {
  list-style: none;
}

.recipe {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.recipe:last-child {
  border-bottom: 0;
}

.recipe-row {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-4);
  min-height: var(--bpt-h-row);
  padding: var(--bpt-sp-2) var(--bpt-sp-4);
  font-size: var(--bpt-fs-cell);
}

.recipe-row:hover {
  background: var(--bpt-state-hover);
}

.recipe-name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  min-width: 0;
}

.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rename-form {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  width: 100%;
  max-width: var(--bpt-w-side-sheet);
}

.recipe-count,
.recipe-date {
  white-space: nowrap;
}

.recipe-actions {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-1);
}

.rename-error {
  padding: 0 var(--bpt-sp-4) var(--bpt-sp-2);
}

.recipe-detail {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-2);
  padding: var(--bpt-sp-3) var(--bpt-sp-4);
  background: var(--md-sys-color-surface-container);
}

.product-chips {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--bpt-sp-2);
}
</style>
