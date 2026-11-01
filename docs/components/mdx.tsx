import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { OpenAPIPage } from './api-page';
import { Mermaid } from './mermaid';

function extractText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node.props?.children) return extractText(node.props.children);
  return '';
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    OpenAPIPage,
    Mermaid,
    pre: (props: any) => {
      const isMermaid =
        props['data-language'] === 'mermaid' ||
        props.className?.includes('language-mermaid') ||
        props.children?.props?.className?.includes('language-mermaid') ||
        props.children?.props?.['data-language'] === 'mermaid';

      if (isMermaid) {
        const chart = extractText(props.children);
        if (chart.trim()) {
          return <Mermaid chart={chart} />;
        }
      }

      return <defaultMdxComponents.pre {...props} />;
    },
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
