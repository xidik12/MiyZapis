/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

// `?react` suffix is handled by vite-plugin-svgr and yields a React component.
declare module '*.svg?react' {
  import { FunctionComponent, SVGProps } from 'react';
  const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement> & { title?: string }>;
  export default ReactComponent;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
