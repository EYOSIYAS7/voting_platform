'use client';
import { createOpenAPIPage } from 'fumadocs-openapi/ui';

const BaseOpenAPIPage = createOpenAPIPage({
  async loadDocument(id) {
    if (typeof window === 'undefined') {
      const { openapi } = await import('@/lib/openapi');
      const schema = await openapi.getSchema(id || 'api');
      return schema?.bundled;
    }
    return (await fetch(`/api/openapi/${id || 'api'}`)).json();
  },
});

export function OpenAPIPage(props: any) {
  return <BaseOpenAPIPage payload={{}} {...props} />;
}
