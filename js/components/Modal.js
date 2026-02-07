/**
 * Modal.js
 * Reusable Modal Component for Fitness Pro App
 * Supports various modal types: confirm, prompt, alert, custom
 */

class ModalManager {
  constructor() {
    this.activeModals = [];
    this.modalContainer = null;
    this.init();
  }

  init() {
    // Create modal container if it doesn't exist
    if (!document.getElementById("modal-container")) {
      this.modalContainer = document.createElement("div");
      this.modalContainer.id = "modal-container";
      document.body.appendChild(this.modalContainer);
    } else {
      this.modalContainer = document.getElementById("modal-container");
    }

    // Add global styles if not already present
    if (!document.getElementById("modal-styles")) {
      const styles = document.createElement("style");
      styles.id = "modal-styles";
      styles.textContent = this.getStyles();
      document.head.appendChild(styles);
    }

    // Close modal on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activeModals.length > 0) {
        const topModal = this.activeModals[this.activeModals.length - 1];
        if (topModal.closeable !== false) {
          this.close(topModal.id);
        }
      }
    });
  }

  generateId() {
    return "modal_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Show a custom modal
   * @param {Object} options Modal configuration
   * @returns {Promise} Resolves with user action result
   */
  show(options = {}) {
    return new Promise((resolve, reject) => {
      const {
        title = "",
        content = "",
        type = "custom", // alert, confirm, prompt, passphrase, custom
        icon = null,
        closeable = true,
        size = "medium", // small, medium, large, fullscreen
        buttons = null,
        onClose = null,
        className = "",
        inputs = [], // For prompt/passphrase: [{name, type, placeholder, required, value}]
      } = options;

      const modalId = this.generateId();

      // Default buttons based on type
      let modalButtons = buttons;
      if (!modalButtons) {
        switch (type) {
          case "alert":
            modalButtons = [{ text: "OK", type: "primary", action: "ok" }];
            break;
          case "confirm":
            modalButtons = [
              { text: "Annulla", type: "secondary", action: "cancel" },
              { text: "Conferma", type: "primary", action: "confirm" },
            ];
            break;
          case "prompt":
          case "passphrase":
            modalButtons = [
              { text: "Annulla", type: "secondary", action: "cancel" },
              { text: "Conferma", type: "primary", action: "submit" },
            ];
            break;
          default:
            modalButtons = [{ text: "Chiudi", type: "secondary", action: "close" }];
        }
      }

      // Default inputs for passphrase type
      let modalInputs = inputs;
      if (type === "passphrase" && inputs.length === 0) {
        modalInputs = [
          {
            name: "passphrase",
            type: "password",
            placeholder: "Inserisci la passphrase...",
            required: true,
            label: "Passphrase",
            autocomplete: "off",
          },
        ];
      }

      // Default icon based on type
      let modalIcon = icon;
      if (!modalIcon) {
        switch (type) {
          case "alert":
            modalIcon = "fa-info-circle";
            break;
          case "confirm":
            modalIcon = "fa-question-circle";
            break;
          case "passphrase":
            modalIcon = "fa-lock";
            break;
          case "prompt":
            modalIcon = "fa-edit";
            break;
          default:
            modalIcon = null;
        }
      }

      const modalData = {
        id: modalId,
        title,
        content,
        type,
        icon: modalIcon,
        closeable,
        size,
        buttons: modalButtons,
        inputs: modalInputs,
        className,
        resolve,
        reject,
        onClose,
      };

      this.activeModals.push(modalData);
      this.render(modalData);

      // Focus first input if exists
      setTimeout(() => {
        const firstInput = document.querySelector(`#${modalId} .modal-input`);
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    });
  }

  render(modalData) {
    const {
      id,
      title,
      content,
      type,
      icon,
      closeable,
      size,
      buttons,
      inputs,
      className,
    } = modalData;

    const inputsHtml = inputs
      .map(
        (input, index) => `
      <div class="modal-input-group">
        ${input.label ? `<label for="${id}-input-${index}">${input.label}</label>` : ""}
        <input
          type="${input.type || "text"}"
          id="${id}-input-${index}"
          name="${input.name || `input-${index}`}"
          class="modal-input"
          placeholder="${input.placeholder || ""}"
          value="${input.value || ""}"
          ${input.required ? "required" : ""}
          ${input.autocomplete ? `autocomplete="${input.autocomplete}"` : ""}
          ${input.minlength ? `minlength="${input.minlength}"` : ""}
          ${input.maxlength ? `maxlength="${input.maxlength}"` : ""}
        />
        ${input.hint ? `<span class="input-hint">${input.hint}</span>` : ""}
      </div>
    `
      )
      .join("");

    const buttonsHtml = buttons
      .map(
        (btn) => `
      <button
        class="modal-btn modal-btn-${btn.type || "secondary"}"
        data-action="${btn.action || "close"}"
        ${btn.disabled ? "disabled" : ""}
      >
        ${btn.icon ? `<i class="fas ${btn.icon}"></i>` : ""}
        ${btn.text}
      </button>
    `
      )
      .join("");

    const modalHtml = `
      <div id="${id}" class="modal-overlay ${className}" data-modal-id="${id}">
        <div class="modal-container modal-${size} modal-type-${type}">
          ${
            closeable
              ? `
            <button class="modal-close" data-action="close" aria-label="Chiudi">
              <i class="fas fa-times"></i>
            </button>
          `
              : ""
          }

          ${
            title || icon
              ? `
            <div class="modal-header">
              ${icon ? `<i class="fas ${icon} modal-icon"></i>` : ""}
              ${title ? `<h3 class="modal-title">${title}</h3>` : ""}
            </div>
          `
              : ""
          }

          <div class="modal-body">
            ${content ? `<div class="modal-content">${content}</div>` : ""}
            ${inputs.length > 0 ? `<form class="modal-form" onsubmit="return false;">${inputsHtml}</form>` : ""}
          </div>

          ${
            buttons.length > 0
              ? `
            <div class="modal-footer">
              ${buttonsHtml}
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;

    this.modalContainer.insertAdjacentHTML("beforeend", modalHtml);

    // Add event listeners
    const modalElement = document.getElementById(id);

    // Button clicks
    modalElement.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        this.handleAction(id, action);
      });
    });

    // Overlay click
    modalElement.addEventListener("click", (e) => {
      if (e.target === modalElement && closeable) {
        this.handleAction(id, "close");
      }
    });

    // Form submit on enter
    const form = modalElement.querySelector(".modal-form");
    if (form) {
      form.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.handleAction(id, "submit");
        }
      });
    }

    // Animate in
    requestAnimationFrame(() => {
      modalElement.classList.add("modal-visible");
    });
  }

  handleAction(modalId, action) {
    const modalData = this.activeModals.find((m) => m.id === modalId);
    if (!modalData) return;

    const modalElement = document.getElementById(modalId);
    let result = { action, values: {} };

    // Collect input values
    if (modalData.inputs.length > 0) {
      modalData.inputs.forEach((input, index) => {
        const inputEl = document.getElementById(`${modalId}-input-${index}`);
        if (inputEl) {
          result.values[input.name || `input-${index}`] = inputEl.value;
        }
      });
    }

    // Validate required inputs on submit
    if (action === "submit" || action === "confirm") {
      let isValid = true;
      modalData.inputs.forEach((input, index) => {
        if (input.required) {
          const inputEl = document.getElementById(`${modalId}-input-${index}`);
          if (!inputEl.value.trim()) {
            inputEl.classList.add("modal-input-error");
            isValid = false;
          } else {
            inputEl.classList.remove("modal-input-error");
          }
        }
      });

      if (!isValid) {
        return;
      }
    }

    // Close modal
    this.close(modalId, result);
  }

  close(modalId, result = { action: "close", values: {} }) {
    const modalData = this.activeModals.find((m) => m.id === modalId);
    if (!modalData) return;

    const modalElement = document.getElementById(modalId);

    // Animate out
    modalElement.classList.remove("modal-visible");
    modalElement.classList.add("modal-hiding");

    setTimeout(() => {
      modalElement.remove();
      this.activeModals = this.activeModals.filter((m) => m.id !== modalId);

      // Call onClose callback
      if (modalData.onClose) {
        modalData.onClose(result);
      }

      // Resolve promise
      modalData.resolve(result);
    }, 300);
  }

  closeAll() {
    [...this.activeModals].forEach((modal) => {
      this.close(modal.id);
    });
  }

  /**
   * Shorthand methods
   */

  alert(title, content, options = {}) {
    return this.show({
      type: "alert",
      title,
      content,
      ...options,
    });
  }

  confirm(title, content, options = {}) {
    return this.show({
      type: "confirm",
      title,
      content,
      ...options,
    });
  }

  prompt(title, placeholder = "", options = {}) {
    return this.show({
      type: "prompt",
      title,
      inputs: [
        {
          name: "value",
          type: "text",
          placeholder,
          required: true,
          ...options.inputOptions,
        },
      ],
      ...options,
    });
  }

  passphrase(title = "Inserisci Passphrase", options = {}) {
    return this.show({
      type: "passphrase",
      title,
      content:
        options.content ||
        "La passphrase è necessaria per cifrare/decifrare i tuoi backup.",
      inputs: [
        {
          name: "passphrase",
          type: "password",
          placeholder: "Inserisci la passphrase...",
          required: true,
          label: "Passphrase",
          autocomplete: "off",
          minlength: 6,
          hint: "Minimo 6 caratteri",
        },
      ],
      ...options,
    });
  }

  loading(title = "Caricamento...", content = "") {
    return this.show({
      type: "custom",
      title,
      content: `
        <div class="modal-loading">
          <div class="modal-spinner"></div>
          ${content ? `<p>${content}</p>` : ""}
        </div>
      `,
      closeable: false,
      buttons: [],
    });
  }

  success(title, content, options = {}) {
    return this.show({
      type: "alert",
      title,
      content,
      icon: "fa-check-circle",
      className: "modal-success",
      ...options,
    });
  }

  error(title, content, options = {}) {
    return this.show({
      type: "alert",
      title,
      content,
      icon: "fa-exclamation-circle",
      className: "modal-error",
      ...options,
    });
  }

  getStyles() {
    return `
      #modal-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-md, 16px);
        opacity: 0;
        pointer-events: all;
        transition: opacity 0.3s ease;
        z-index: 9999;
      }

      .modal-overlay.modal-visible {
        opacity: 1;
      }

      .modal-overlay.modal-hiding {
        opacity: 0;
      }

      .modal-container {
        background: var(--bg-card, #1e293b);
        border-radius: var(--radius-lg, 16px);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;
        transform: scale(0.9) translateY(20px);
        transition: transform 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .modal-visible .modal-container {
        transform: scale(1) translateY(0);
      }

      .modal-hiding .modal-container {
        transform: scale(0.9) translateY(20px);
      }

      /* Modal sizes */
      .modal-small { width: 320px; max-width: 90vw; }
      .modal-medium { width: 450px; max-width: 90vw; }
      .modal-large { width: 600px; max-width: 90vw; }
      .modal-fullscreen { width: 95vw; height: 90vh; }

      /* Close button */
      .modal-close {
        position: absolute;
        top: var(--spacing-sm, 12px);
        right: var(--spacing-sm, 12px);
        background: rgba(255, 255, 255, 0.1);
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        color: var(--text-secondary, #94a3b8);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 1;
      }

      .modal-close:hover {
        background: rgba(255, 255, 255, 0.2);
        color: var(--text-primary, #fff);
      }

      /* Header */
      .modal-header {
        padding: var(--spacing-lg, 24px);
        padding-bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .modal-icon {
        font-size: 2.5rem;
        color: var(--accent-primary, #8b5cf6);
        margin-bottom: var(--spacing-sm, 12px);
      }

      .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary, #fff);
        margin: 0;
      }

      /* Body */
      .modal-body {
        padding: var(--spacing-lg, 24px);
        overflow-y: auto;
        flex: 1;
      }

      .modal-content {
        color: var(--text-secondary, #94a3b8);
        font-size: 0.95rem;
        line-height: 1.6;
        text-align: center;
        margin-bottom: var(--spacing-md, 16px);
      }

      /* Form inputs */
      .modal-form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md, 16px);
      }

      .modal-input-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs, 8px);
      }

      .modal-input-group label {
        font-size: 0.85rem;
        color: var(--text-secondary, #94a3b8);
        font-weight: 500;
      }

      .modal-input {
        width: 100%;
        padding: 0.875rem 1rem;
        background: var(--bg-primary, #0f172a);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-md, 8px);
        color: var(--text-primary, #fff);
        font-size: 1rem;
        font-family: inherit;
        transition: all 0.2s ease;
      }

      .modal-input:focus {
        outline: none;
        border-color: var(--accent-primary, #8b5cf6);
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
      }

      .modal-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      .modal-input-error {
        border-color: var(--danger, #ef4444) !important;
        animation: shake 0.3s ease;
      }

      .input-hint {
        font-size: 0.75rem;
        color: var(--text-secondary, #94a3b8);
        opacity: 0.8;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      /* Footer */
      .modal-footer {
        padding: var(--spacing-md, 16px) var(--spacing-lg, 24px);
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        gap: var(--spacing-sm, 12px);
        justify-content: flex-end;
      }

      .modal-btn {
        padding: 0.75rem 1.5rem;
        border-radius: var(--radius-md, 8px);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
        font-family: inherit;
      }

      .modal-btn-primary {
        background: var(--accent-primary, #8b5cf6);
        color: white;
      }

      .modal-btn-primary:hover {
        background: var(--accent-secondary, #7c3aed);
        transform: translateY(-1px);
      }

      .modal-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary, #fff);
      }

      .modal-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .modal-btn-danger {
        background: var(--danger, #ef4444);
        color: white;
      }

      .modal-btn-danger:hover {
        background: #dc2626;
      }

      .modal-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Loading modal */
      .modal-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-md, 16px);
        padding: var(--spacing-lg, 24px) 0;
      }

      .modal-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: var(--accent-primary, #8b5cf6);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Type-specific styles */
      .modal-success .modal-icon {
        color: var(--success, #10b981);
      }

      .modal-error .modal-icon {
        color: var(--danger, #ef4444);
      }

      .modal-type-passphrase .modal-icon {
        color: var(--accent-primary, #8b5cf6);
      }

      /* Responsive adjustments */
      @media (max-width: 480px) {
        .modal-container {
          margin: var(--spacing-sm, 12px);
        }

        .modal-footer {
          flex-direction: column;
        }

        .modal-btn {
          width: 100%;
          justify-content: center;
        }
      }
    `;
  }
}

// Create singleton instance
export const modal = new ModalManager();

// Export for global access in development
if (typeof window !== "undefined") {
  window.modal = modal;
}
