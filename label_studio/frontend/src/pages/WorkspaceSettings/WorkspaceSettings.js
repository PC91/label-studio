import React, { useMemo, useState, useCallback, useContext } from 'react';
import { useHistory } from 'react-router';
import { Button } from '../../components';
import { Modal, confirm } from '../../components/Modal/Modal';
import { Space } from '../../components/Space/Space';
import { Form, Input } from '../../components/Form';
import { WorkspaceContext } from '../../providers/WorkspaceProvider';
import { ApiContext } from '../../providers/ApiProvider';
import { cn } from '../../utils/bem';
import "./WorkspaceSettings.styl";

const WorkspaceName = ({
  name, setName, onSubmit,
  error, show = true
}) => !show ? null :(
<form className={cn("workspace-name")} onSubmit={e => { e.preventDefault(); onSubmit(); }}>
  <div className="field field--wide">
    <label htmlFor="workspace_name">Name</label>
    <input
      name="name"
      id="workspace_name"
      value={name}
      onChange={e => setName(e.target.value)} />
    {error && <span className="error">{error}</span>}
  </div>
</form>
);

export const WorkspaceSettings = ({
    workspace, projects,
    onClose, handlerToFetchWorkspaces
}) => {
  const rootClass = cn("workspace-settings");

  const api = useContext(ApiContext);
  const history = useHistory();
  const [waiting, setWaitingStatus] = useState(false);
  const [name, setName] = React.useState(workspace.title);
  const [error, setError] = React.useState();

  React.useEffect(() => { setError(null); }, [name]);

  const workspaceBody = React.useMemo(() => ({
    title: name,
  }), [name]);

  const onSave = useCallback(async () => {
    if (error) return;
    const res = await api.callApi('updateWorkspace', {
      params: {
        pk: workspace.id,
      },
      body: {
        title: name,
      },
    });
    if (res.ok) return;
    onClose();
    handlerToFetchWorkspaces();
  }, [workspace, workspaceBody]);

  const onDelete = useCallback(() => {
    confirm({
      title: "Action confirmation",
      body: "You're about to delete this workspace. This action cannot be undone.",
      okText: "Proceed",
      buttonLook: "destructive",
      onOk: async () => {
        setWaitingStatus(true);
        await api.callApi('deleteWorkspace', {
          params: {
            pk: workspace.id,
          },
        });
        history.replace('/projects');
        setWaitingStatus(false);
        onClose();
        handlerToFetchWorkspaces();
      },
    });
  }, [workspace]);

  return (
    <Modal
      name={"modal-workspace-modification"}
      visible bare
      closeOnClickOutside={false}
      allowClose={false}
    >
      <div className={rootClass}>
        <Modal.Header>
          <h1>Workspace Settings</h1>
        </Modal.Header>
        <WorkspaceName
          name={name}
          setName={setName}
          error={error}
          onSubmit={onSave}
        />
        <Modal.Footer>
          <Space>
            <Button
              look="destructive"
              size="compact"
              onClick={onDelete}
              waiting={waiting}
              disabled={projects.length>0}>Delete</Button>
            <Button
              look="danger"
              size="compact"
              onClick={onClose}
              waiting={waiting}>Cancel</Button>
            <Button
              look="primary"
              size="compact"
              onClick={onSave}
              waiting={waiting}>Save</Button>
          </Space>
        </Modal.Footer>
      </div>
    </Modal>
  );
};