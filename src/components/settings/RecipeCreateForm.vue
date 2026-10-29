<script setup lang="ts">
import { ref } from 'vue';
import { recipesApi, type Product, type Recipe } from '../../services/recipes';
import { errorMessage } from '../../utils/activityFormat';

defineProps<{
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
}>();

const emit = defineEmits<{
  (e: 'created', recipe: Recipe): void;
  (e: 'cancel'): void;
  (e: 'retryProducts'): void;
}>();

const name = ref('');
const selected = ref<string[]>([]);
const saving = ref(false);
const error = ref<string | null>(null);

async function submit() {
  const trimmed = name.value.trim();
  if (!trimmed) {
    error.value = 'Enter a recipe name';
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    emit('created', await recipesApi.create({ name: trimmed, product_ids: selected.value }));
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form class="create-form" @submit.prevent="submit">
    <div class="field">
      <label class="label" for="recipe-create-name">Name</label>
      <input
        id="recipe-create-name"
        v-model="name"
        type="text"
        class="input"
        :disabled="saving"
        :aria-invalid="error ? true : undefined"
        aria-describedby="recipe-create-error"
      />
    </div>

    <fieldset class="products" :disabled="saving">
      <legend class="label">Products (cannot be changed after creation)</legend>
      <p v-if="productsLoading" class="muted">Loading data...</p>
      <p v-else-if="productsError" class="products-error">
        {{ productsError }}
        <button type="button" class="btn btn-outlined btn-sm" @click="emit('retryProducts')">Retry</button>
      </p>
      <p v-else-if="products.length === 0" class="muted">This account has no products yet</p>
      <div v-else class="product-grid">
        <label v-for="p in products" :key="p.id" class="product-option">
          <input v-model="selected" type="checkbox" class="check" :value="p.id" />
          <span>{{ p.name }}</span>
        </label>
      </div>
    </fieldset>

    <p v-if="error" id="recipe-create-error" class="form-error" role="alert">{{ error }}</p>

    <div class="form-actions">
      <button type="button" class="btn btn-outlined btn-sm" :disabled="saving" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-filled btn-sm" :disabled="saving">
        {{ saving ? 'Creating...' : 'Create' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-3);
  padding: var(--bpt-sp-4);
  background: var(--md-sys-color-surface-container);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.create-form .field {
  max-width: var(--bpt-w-side-sheet);
}

.products {
  border: 0;
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-2);
  min-width: 0;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--bpt-w-table-list), 1fr));
  gap: var(--bpt-sp-2) var(--bpt-sp-4);
  max-height: var(--bpt-w-side-sheet);
  overflow-y: auto;
}

.product-option {
  display: flex;
  align-items: center;
  gap: var(--bpt-sp-2);
  font-size: var(--bpt-fs-cell);
  cursor: pointer;
}

.products-error,
.form-error {
  color: var(--md-sys-color-error);
  font-size: var(--bpt-fs-cell);
  word-break: break-word;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--bpt-sp-2);
}
</style>
