import { createContext, useContext, useMemo, useState } from 'react';

export const ConfigContext = createContext(window.APP_SETTINGS);
ConfigContext.displayName = "ConfigContext";

export const ConfigConsumer = ConfigContext.Consumer;

export const ConfigProvider = ({children}) => {
  const [config, setConfig] = useState(window.APP_SETTINGS ?? {});

  const update = (newConfig) => {
    if (!newConfig) return;

    setConfig(newConfig);
  };

  const contextValue = useMemo(() => {
    return {
      ...config,
      update,
    };
  }, [config]);

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  return useContext(ConfigContext);
};

export const ActiveWorkspaceContext = createContext({
  activeWorkspace: 1,
  setActiveWorkspace: () => {}
});

export const ActiveWorkspaceProvider = ({children}) => {
  const [activeWorkspace, setActiveWorkspace] = useState(1);

  const contextValue = useMemo(() => (
    { activeWorkspace, setActiveWorkspace }
  ), [activeWorkspace]);

  return (
    <ActiveWorkspaceContext.Provider value={contextValue}>
      {children}
    </ActiveWorkspaceContext.Provider>
  );
};

export const useActiveWorkspace = () => {
  return useContext(ActiveWorkspaceContext);
};