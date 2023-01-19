import React from 'react';
import { useAPI } from '../../../providers/ApiProvider';

export const useDraftWorkspace = () => {
  const api = useAPI();
  const [workspace, setWorkspace] = React.useState();

  const fetchDraftWorkspace = React.useCallback(async () => {
    const response = await api.callApi('workspaces');

    // always create the new one
    const workspaces = response?.results ?? [];
    const lastIndex = workspaces.length;
    let workspaceNumber = lastIndex + 1;
    let workspaceName = `New Workspace #${workspaceNumber}`;

    // dirty hack to get proper non-duplicate name
    while(workspaces.find(({ title }) => title === workspaceName)) {
      workspaceNumber++;
      workspaceName = `New Workspace #${workspaceNumber}`;
    }

    const draft = await api.callApi('createWorkspace', {
      body: {
        title: workspaceName,
      },
    });

    if (draft) setWorkspace(draft);
  }, []);

  React.useEffect(() => {
    fetchDraftWorkspace();
  }, []);

  return workspace;
};