import logos from '@iconify-json/logos';
import mdi from '@iconify-json/mdi';
import elkLayouts from '@mermaid-js/layout-elk';
import tidyTreeLayouts from '@mermaid-js/layout-tidy-tree';
import zenuml from '@mermaid-js/mermaid-zenuml';
import mermaid from 'mermaid';

mermaid.registerLayoutLoaders(elkLayouts);
mermaid.registerLayoutLoaders(tidyTreeLayouts);
mermaid.registerIconPacks([
	{ name: 'logos', loader: () => logos.icons },
	{ name: 'mdi', loader: () => mdi.icons },
]);

export const mermaidPluginsReady = mermaid.registerExternalDiagrams([zenuml]);
