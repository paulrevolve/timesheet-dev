export const showToast = (message, type = "info") => {
  // Refined color palette
  const bgColor =
    type === "success"
      ? "#16a34a" // Medium green
      : type === "error"
      ? "#dc2626" // Soft red
      : type === "warning"
      ? "#f59e0b" // Amber
      : "#2563eb"; // Blue

  // Create the toast container
  const toast = document.createElement("div");
  toast.innerHTML = `
    <div style="
      font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
      font-size: 15px;
      font-weight: 400;
      letter-spacing: 0.2px;
      color: #fff;
      padding-right: 30px;
      line-height: 1.4;
    ">${message}</div>
    <button type="button" aria-label="Close toast" tabindex="0"
      style="
        position: absolute;
        top: 8px;
        right: 12px;
        background: transparent;
        border: none;
        color: #fff;
        font-size: 18px;
        font-weight: 400;
        cursor: pointer;
        line-height: 1;
        opacity: 0.8;
        transition: opacity 0.2s;
      "
      onmouseover="this.style.opacity=1"
      onmouseout="this.style.opacity=0.8"
    >✕</button>
  `;

  // Toast outer style
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    background: ${bgColor};
    min-width: 280px;
    max-width: 380px;
    padding: 14px 16px 14px 14px;
    border-radius: 8px;
    box-shadow: 0 6px 24px rgba(40,65,86,0.14);
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
    position: fixed;
    overflow: visible;
  `;

  document.body.appendChild(toast);

  // Close button logic
  const closeBtn = toast.querySelector("button");
  closeBtn.onclick = () => {
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  };

  // Auto-hide logic
  const displayTime = message.toLowerCase().includes("import") ? 5000 : 2000;
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 400);
  }, displayTime);
};
