import { ref, onMounted, onBeforeUnmount } from 'vue';

export function useScrollDirection() {
  const isVisible = ref(true);
  let lastScrollTop = 0;

  function handleScroll(e: Event) {
    const target = e.target as HTMLElement;
    if (!target || typeof target.scrollTop === 'undefined') return;
    const scrollTop = target.scrollTop;
    
    // Ignore minor scroll changes
    if (Math.abs(scrollTop - lastScrollTop) < 10) return;

    if (scrollTop > lastScrollTop && scrollTop > 50) {
      isVisible.value = false;
    } else {
      isVisible.value = true;
    }
    lastScrollTop = scrollTop;
  }

  onMounted(() => {
    // capture: true intercepts scrolling in nested divs
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleScroll, { capture: true });
  });

  return { isVisible };
}
