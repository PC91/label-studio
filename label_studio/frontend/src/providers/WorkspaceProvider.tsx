import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { shallowEqualObjects } from 'shallow-equal';
import { useAPI, WrappedResponse } from './ApiProvider';
import { useAppStore } from './AppStoreProvider';
import { useParams } from './RoutesProvider';

type Empty = Record<string, never>

type Context = {
  workspace: APIWorkspace | Empty,
  fetchWorkspace: (id?: string|number, force?: boolean) => Promise<APIWorkspace | void>,
  updateWorkspace: (fields: APIWorkspace) => Promise<WrappedResponse<APIWorkspace>>,
  invalidateCache: () => void,
}

export const WorkspaceContext = createContext<Context>({} as Context);
WorkspaceContext.displayName = 'WorkspaceContext';

const workspaceCache = new Map<number, APIWorkspace>();

export const WorkspaceProvider: React.FunctionComponent = ({children}) => {
  const api = useAPI();
  const params = useParams();
  const { update: updateStore } = useAppStore();
  // @todo use null for missed workspace data
  const [workspaceData, setWorkspaceData] = useState<APIWorkspace | Empty>(workspaceCache.get(+params.id) ?? {});

  const fetchWorkspace: Context['fetchWorkspace'] = useCallback(async (id, force = false) => {
    const finalWorkspaceId = +(id ?? params.id);

    if (isNaN(finalWorkspaceId)) return;

    if (!force && workspaceCache.has(finalWorkspaceId)) {
      setWorkspaceData({...workspaceCache.get(finalWorkspaceId)!});
    }

    const result = await api.callApi<APIWorkspace>('workspace', {
      params: { pk: finalWorkspaceId },
      errorFilter: () => false,
    });

    const workspaceInfo = result as unknown as APIWorkspace;

    if (shallowEqualObjects(workspaceData, workspaceInfo) === false) {
      setWorkspaceData(workspaceInfo);
      updateStore({workspace: workspaceInfo});
      workspaceCache.set(workspaceInfo.id, workspaceInfo);
    }

    return workspaceInfo;
  }, [params]);

  const updateWorkspace: Context['updateWorkspace'] = useCallback(async (fields: APIWorkspace) => {
    const result = await api.callApi<APIWorkspace>('updateWorkspace', {
      params: {
        pk:workspaceData.id,
      },
      body: fields,
    });

    if (result.$meta) {
      setWorkspaceData(result as unknown as APIWorkspace);
      updateStore({workspace: result});
    }

    return result;
  }, [workspaceData, setWorkspaceData, updateStore]);

  useEffect(() => {
    if (+params.id !== workspaceData?.id) {
      setWorkspaceData({});
    }
    fetchWorkspace();
  }, [params]);

  useEffect(() => {
    return () => workspaceCache.clear();
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      workspace: workspaceData,
      fetchWorkspace,
      updateWorkspace,
      invalidateCache() {
        workspaceCache.clear();
        setWorkspaceData({});
      },
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

// without this extra typing VSCode doesn't see the type after import :(
export const useWorkspace: () => Context = () => {
  return useContext(WorkspaceContext) ?? {};
};