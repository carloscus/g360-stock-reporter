const G360_SIGNATURE_STYLES = `
:host {
  display: inline-block;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}
:host(:hover) {
  opacity: 1;
}
.container {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 18px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-weight: normal;
  font-size: 12px;
  line-height: 1;
}
.isotype-wrapper {
  display: flex;
  align-items: center;
  gap: 1px;
  height: 100%;
}
.isotype {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  height: 100%;
}
.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}
.dot-top { background: var(--g360-gray); }
.dot-mid { background: var(--g360-green); }
.dot-bottom { background: var(--g360-gray); }
.chevron {
  color: var(--g360-green);
  width: 20px;
  height: 20px;
}
.text {
  color: var(--g360-gray);
  letter-spacing: 0.5px;
}
.version {
  color: var(--g360-gray);
  opacity: 0.7;
}
.separator {
  color: var(--g360-gray);
  opacity: 0.5;
}
@media (prefers-color-scheme: dark) {
  :host {
    --g360-green: #00d084;
    --g360-gray: #94a3b8;
  }
}
@media (prefers-color-scheme: light) {
  :host {
    --g360-green: #00d084;
    --g360-gray: #64748b;
  }
}
`;

class G360Signature extends HTMLElement {
  static get observedAttributes() {
    return ['mode', 'version'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  get mode() {
    return this.getAttribute('mode') || 'own';
  }

  get version() {
    return this.getAttribute('version') || '';
  }

  render() {
    const isOwn = this.mode === 'own';
    const mainText = isOwn ? 'G360 by ccusi' : 'powered by G360';
    
    const versionHtml = this.version 
      ? `<span class="separator">></span><span class="version">${this.version}</span>` 
      : '';

    this.shadowRoot.innerHTML = `
      <style>${G360_SIGNATURE_STYLES}</style>
      <div class="container">
        <div class="isotype-wrapper">
          <div class="isotype">
            <div class="dot dot-top"></div>
            <div class="dot dot-mid"></div>
            <div class="dot dot-bottom"></div>
          </div>
          <svg class="chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 4 14 10 6 16"></polyline>
          </svg>
        </div>
        <span class="text">${mainText}</span>
        ${versionHtml}
      </div>
    `;
  }
}

customElements.define('g360-signature', G360Signature);

export default G360Signature;
