import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const createRipple = (event: MouseEvent) => {
  const target = (event.target as HTMLElement).closest('.bump, .dent, button, a') as HTMLElement;
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const diameter = Math.max(target.clientWidth, target.clientHeight) * 1.5;
  
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  // Use transform-based centering (CSS handles translate(-50%, -50%))
  // and use inline style for proper positioning from click point
  ripple.style.cssText = `
    position: absolute;
    width: ${diameter}px;
    height: ${diameter}px;
    left: ${event.clientX - rect.left - diameter / 2}px;
    top: ${event.clientY - rect.top - diameter / 2}px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(160, 200, 255, 0.35) 0%, transparent 70%);
    pointer-events: none;
    transform: translate(-50%, -50%) scale(0);
    animation: rippleOut 0.5s ease-out forwards;
    z-index: 10;
  `;

  target.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
};

window.addEventListener('mousedown', createRipple);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
