type ToastProps = {
  title: string
  description?: string
  duration?: number
}

let lastToastTime = 0;
let toastTimeout: ReturnType<typeof setTimeout> | null = null;
let toastEl: HTMLDivElement | null = null;

export function toast({ title, description, duration = 3000 }: ToastProps) {
  const now = Date.now();
  if (now - lastToastTime < 1000) {
    // Ignore if less than 1 second passed
    return;
  }
  lastToastTime = now;

  // Remove any existing toast immediately
  if (toastEl) {
    toastEl.remove();
    toastEl = null;
  }
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  // Create a toast element
  toastEl = document.createElement("div");
  toastEl.className =
    "fixed top-4 right-4 z-50 max-w-md rounded-lg bg-white p-4 shadow-lg border border-gray-200 transition-all duration-300 transform translate-y-[-10px] opacity-0";

  // Create toast content
  const titleEl = document.createElement("div");
  titleEl.className = "font-sans font-semibold text-foreground";
  titleEl.textContent = title;

  toastEl.appendChild(titleEl);

  if (description) {
    const descEl = document.createElement("div");
    descEl.className = "font-sans text-sm text-muted-foreground mt-1";
    descEl.textContent = description;
    toastEl.appendChild(descEl);
  }

  // Add to DOM
  document.body.appendChild(toastEl);

  // Animate in
  setTimeout(() => {
    if (toastEl) {
      toastEl.style.transform = "translateY(0)";
      toastEl.style.opacity = "1";
    }
  }, 10);

  // Remove after duration
  toastTimeout = setTimeout(() => {
    if (toastEl) {
      toastEl.style.transform = "translateY(-10px)";
      toastEl.style.opacity = "0";

      setTimeout(() => {
        if (toastEl && toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
        toastEl = null;
      }, 300);
    }
    toastTimeout = null;
  }, duration);
}
