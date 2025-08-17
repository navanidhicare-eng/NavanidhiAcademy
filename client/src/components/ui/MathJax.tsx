import { useEffect, useRef } from 'react';

// Simple MathJax loader for production use
declare global {
  interface Window {
    MathJax: any;
  }
}

// Load MathJax from CDN
const loadMathJax = () => {
  if (window.MathJax) return Promise.resolve();

  return new Promise<void>((resolve) => {
    // Configure MathJax
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true,
      },
      options: {
        ignoreHtmlClass: 'tex2jax_ignore',
        processHtmlClass: 'tex2jax_process'
      },
      startup: {
        ready: () => {
          window.MathJax.startup.defaultReady();
          resolve();
        }
      }
    };

    // Load MathJax script
    const script = document.createElement('script');
    script.src = 'https://polyfill.io/v3/polyfill.min.js?features=es6';
    script.onload = () => {
      const mathJaxScript = document.createElement('script');
      mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      mathJaxScript.async = true;
      document.head.appendChild(mathJaxScript);
    };
    document.head.appendChild(script);
  });
};

interface MathJaxProps {
  children: string;
  className?: string;
  inline?: boolean;
}

export const MathJaxComponent: React.FC<MathJaxProps> = ({ 
  children, 
  className = "", 
  inline = false 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const processContent = async () => {
      if (!containerRef.current) return;
      
      // Set the content first
      containerRef.current.innerHTML = children;
      containerRef.current.className = `tex2jax_process ${className}`;
      
      // Wait for MathJax to load and process
      try {
        await loadMathJax();
        
        if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
          await window.MathJax.typesetPromise([containerRef.current]);
        } else if (window.MathJax && window.MathJax.Hub) {
          // Legacy MathJax 2.x support
          window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, containerRef.current]);
        } else {
          // MathJax not available, show plain text
          containerRef.current.textContent = children;
        }
      } catch (error) {
        console.error('MathJax processing error:', error);
        // Fallback to plain text on error
        if (containerRef.current) {
          containerRef.current.textContent = children;
        }
      }
    };
    
    processContent();
  }, [children, className]);

  return (
    <div 
      ref={containerRef}
      className={`mathjax-container ${inline ? 'inline' : 'block'} ${className}`}
      style={{ 
        display: inline ? 'inline' : 'block',
        minHeight: inline ? 'auto' : '1.5em'
      }}
    >
      {children}
    </div>
  );
};

// Hook for processing text with LaTeX
export const useMathJax = () => {
  const processLatex = (text: string): string => {
    if (!text) return '';
    
    // Ensure proper LaTeX delimiters are preserved
    return text
      .replace(/\\\(/g, '\\(')
      .replace(/\\\)/g, '\\)')
      .replace(/\\\[/g, '\\[')
      .replace(/\\\]/g, '\\]');
  };

  return { processLatex };
};

export default MathJaxComponent;