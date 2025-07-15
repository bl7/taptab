import { createContext } from 'react';

export const SidebarContext = createContext<{ expanded: boolean; setExpanded: (v: boolean) => void }>({ expanded: true, setExpanded: () => {} }); 