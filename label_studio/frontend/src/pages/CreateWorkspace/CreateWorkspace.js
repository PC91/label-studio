import React from 'react';
import { useHistory } from 'react-router';
import { Button, ToggleItems } from '../../components';
import { Modal } from '../../components/Modal/Modal';
import { Space } from '../../components/Space/Space';
import { useAPI } from '../../providers/ApiProvider';
import { cn } from '../../utils/bem';
import "./CreateWorkspace.styl";
import { useDraftWorkspace } from './utils/useDraftWorkspace';


const WorkspaceName = ({
    name, setName, onSaveName, onSubmit, error, show = true
}) => !show ? null :(
  <form className={cn("workspace-name")} onSubmit={e => { e.preventDefault(); onSubmit(); }}>
    <div className="field field--wide">
      <label htmlFor="workspace_name">Workspace Name</label>
      <input
        name="name"
        id="workspace_name"
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={onSaveName} />
      {error && <span className="error">{error}</span>}
    </div>
  </form>
);

export const CreateWorkspace = ({ onClose , handlerToFetchWorkspaces}) => {
  const [step, setStep] = React.useState("name"); // name | import | config
  const [waiting, setWaitingStatus] = React.useState(false);

  const workspace = useDraftWorkspace();
  const history = useHistory();
  const api = useAPI();

  const [name, setName] = React.useState("");
  const [error, setError] = React.useState();

  React.useEffect(() => { setError(null); }, [name]);

  const rootClass = cn("create-workspace");

  // name intentionally skipped from deps:
  // this should trigger only once when we got workspace loaded
  React.useEffect(() => workspace && !name && setName(workspace.title), [workspace]);

  const workspaceBody = React.useMemo(() => ({
    title: name,
  }), [name]);

  const onCreate = React.useCallback(async () => {

    setWaitingStatus(true);
    const response = await api.callApi('updateWorkspace',{
      params: {
        pk: workspace.id,
      },
      body: workspaceBody,
    });
    setWaitingStatus(false);

    onClose?.();
    await handlerToFetchWorkspaces();
  }, [workspace, workspaceBody]);

  const onSaveName = async () => {
    if (error) return;
    const res = await api.callApi('updateWorkspaceRaw', {
      params: {
        pk: workspace.id,
      },
      body: {
        title: name,
      },
    });
    if (res.ok) return;
    const err = await res.json();
    setError(err.validation_errors?.title);
  };

  const onDelete = React.useCallback(async () => {
    setWaitingStatus(true);
    if (workspace) await api.callApi('deleteWorkspace', {
      params: {
        pk: workspace.id,
      },
    });
    setWaitingStatus(false);
    history.replace("/projects");
    onClose?.();
    await handlerToFetchWorkspaces();
  }, [workspace]);

  return (
    <Modal
      name={"modal-new-workspace"}
      onHide={onDelete}
      visible bare
      closeOnClickOutside={false}
      allowClose={false}>
      <div className={rootClass}>
        <Modal.Header>
          <h1>Create Workspace</h1>
          <Space>
            <Button
              look="danger"
              size="compact"
              onClick={onDelete}
              waiting={waiting}>Delete</Button>
            <Button
              look="primary"
              size="compact"
              onClick={onCreate}
              waiting={waiting}
              disabled={!workspace || error}>Save</Button>
          </Space>
        </Modal.Header>
        <WorkspaceName
          name={name}
          setName={setName}
          error={error}
          onSaveName={onSaveName}
          onSubmit={onCreate}
          show={step === "name"}
        />
      </div>
    </Modal>
  );
};