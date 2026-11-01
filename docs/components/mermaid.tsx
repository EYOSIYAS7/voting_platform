'use client';

import { useEffect, useId, useState } from 'react';

export function Mermaid({
  chart: chartProp,
  children,
}: {
  chart?: string;
  children?: any;
}) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const chart = (chartProp || (typeof children === 'string' ? children : '')).trim();

  useEffect(() => {
    if (!chart) return;
    let isMounted = true;
    const isDark =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark');

    import('mermaid')
      .then((m) => {
        const mermaid = m.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          fontFamily: 'inherit',
          theme: isDark ? 'dark' : 'neutral',
          themeVariables: isDark
            ? {
                primaryColor: '#059669',
                primaryTextColor: '#f8fafc',
                primaryBorderColor: '#10b981',
                lineColor: '#64748b',
                secondaryColor: '#1e293b',
                tertiaryColor: '#0f172a',
              }
            : {
                primaryColor: '#e0f2fe',
                primaryTextColor: '#0f172a',
                primaryBorderColor: '#0284c7',
                lineColor: '#94a3b8',
              },
        });

        return mermaid.render(id, chart);
      })
      .then((res) => {
        if (isMounted) {
          setSvg(res.svg);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Mermaid render error:', err);
          setError(err?.message || 'Failed to render diagram');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [chart, id]);

  if (!chart) return null;

  if (error) {
    return (
      <div className="p-4 my-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
        Failed to render diagram: {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center p-8 my-4 rounded-lg bg-fd-muted/30 text-fd-muted-foreground text-sm animate-pulse">
        Rendering diagram...
      </div>
    );
  }

  return (
    <div
      className="mermaid-wrapper my-6 p-4 rounded-xl border border-fd-border bg-fd-card/50 flex justify-center overflow-x-auto shadow-sm"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
