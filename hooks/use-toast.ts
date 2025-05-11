type ToastProps = {
  title: string
  description?: string
  duration?: number
}

export function toast({ title, description, duration = 3000 }: ToastProps) {
  // Create a toast element
  const toastEl = document.createElement("div")
  toastEl.className =
    "fixed top-4 right-4 z-50 max-w-md rounded-lg bg-white p-4 shadow-lg border border-gray-200 transition-all duration-300 transform translate-y-[-10px] opacity-0"

  // Create toast content
  const titleEl = document.createElement("div")
  titleEl.className = "font-semibold text-[#1f1f1f]"
  titleEl.textContent = title

  toastEl.appendChild(titleEl)

  if (description) {
    const descEl = document.createElement("div")
    descEl.className = "text-sm text-gray-500 mt-1"
    descEl.textContent = description
    toastEl.appendChild(descEl)
  }

  // Add to DOM
  document.body.appendChild(toastEl)

  // Animate in
  setTimeout(() => {
    toastEl.style.transform = "translateY(0)"
    toastEl.style.opacity = "1"
  }, 10)

  // Remove after duration
  setTimeout(() => {
    toastEl.style.transform = "translateY(-10px)"
    toastEl.style.opacity = "0"

    setTimeout(() => {
      document.body.removeChild(toastEl)
    }, 300)
  }, duration)
}
