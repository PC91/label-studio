import React from 'react';
import { useHistory } from 'react-router';
import { Button, ToggleItems } from '../../components';
import { Modal } from '../../components/Modal/Modal';
import { Space } from '../../components/Space/Space';
import { useAPI } from '../../providers/ApiProvider';
import { cn } from '../../utils/bem';
import { ConfigPage } from './Config/Config';
import "./CreateProject.styl";
import { ImportPage } from './Import/Import';
import { useImportPage } from './Import/useImportPage';
import { useDraftProject } from './utils/useDraftProject';



const ProjectName = ({
  name, setName,
  selectedWorkspace, setSelectedWorkspace, lstWorkspaces,
  onSaveName, onSubmit, error,
  description, setDescription,
  show = true
}) => !show ? null :(
  <form className={cn("project-name")} onSubmit={e => { e.preventDefault(); onSubmit(); }}>
    <div className="field field--wide ls-select">
      <select
        name="workspace"
        id="project_workspace"
        label="Workspace"
        class="ls-select__list"
        value={selectedWorkspace}
        onChange={e => {
          setSelectedWorkspace(e.target.value)
        }}
      >
        {lstWorkspaces.map(workspace => (
          <option value={workspace.id}>{workspace.title}</option>
        ))}
      </select>
    </div>
    <div className="field field--wide">
      <label htmlFor="project_name">Project Name</label>
      <input name="name" id="project_name" value={name} onChange={e => setName(e.target.value)} onBlur={onSaveName} />
      {error && <span className="error">{error}</span>}
    </div>
    <div className="field field--wide">
      <label htmlFor="project_description">Description</label>
      <textarea
        name="description"
        id="project_description"
        placeholder="Optional description of your project"
        rows="4"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
    </div>
  </form>
);

export const CreateProject = ({ onClose, activeWorkspace, setActiveWorkspace }) => {
  const [step, setStep] = React.useState("name"); // name | import | config
  const [waiting, setWaitingStatus] = React.useState(false);
  const project = useDraftProject(activeWorkspace);
  const history = useHistory();
  const api = useAPI();

  const [name, setName] = React.useState("");
  // Set the active workspace ID as the first choice when a project is created
  const [selectedWorkspace, setSelectedWorkspace] = React.useState(activeWorkspace);
  const [lstWorkspaces, setLstWorkspaces] = React.useState([]);
  const [error, setError] = React.useState();
  const [description, setDescription] = React.useState("");
  const [config, setConfig] = React.useState("<View></View>");

  const requestWorkspaceParams = {};
  requestWorkspaceParams.include = ['id', 'title', 'color',].join(',');

  api.callApi("workspaces", {
    params: requestWorkspaceParams,
  }).then(result => {
    setLstWorkspaces(result.results);
  })

  React.useEffect(() => { setError(null); }, [name]);

  const { columns, uploading, uploadDisabled, finishUpload, pageProps } = useImportPage(project);

  const rootClass = cn("create-project");
  const tabClass = rootClass.elem("tab");
  const steps = {
    name: <span className={tabClass.mod({ disabled: !!error })}>Project Name</span>,
    import: <span className={tabClass.mod({ disabled: uploadDisabled })}>Data Import</span>,
    config: "Labeling Setup",
  };

  // name intentionally skipped from deps:
  // this should trigger only once when we got project loaded
  React.useEffect(() => project && !name && setName(project.title), [project]);

  const projectBody = React.useMemo(() => ({
    title: name,
    workspace: selectedWorkspace,
    description,
    label_config: config,
  }), [name, selectedWorkspace, description, config]);

  const onCreate = React.useCallback(async () => {
    const imported = await finishUpload();
    if (!imported) return;

    setWaitingStatus(true);
    const response = await api.callApi('updateProject',{
      params: {
        pk: project.id,
      },
      body: projectBody,
    });
    setWaitingStatus(false);

    if (response !== null) {
      history.push(`/projects/${response.id}/data`);
      setActiveWorkspace(projectBody.workspace);
    }
  }, [project, projectBody, finishUpload]);

  const onSaveName = async () => {
    if (error) return;
    const res = await api.callApi('updateProjectRaw', {
      params: {
        pk: project.id,
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
    if (project) await api.callApi('deleteProject', {
      params: {
        pk: project.id,
      },
    });
    setWaitingStatus(false);
    history.replace("/projects");
    onClose?.();
  }, [project]);

  return (
    <Modal onHide={onDelete} fullscreen visible bare closeOnClickOutside={false}>
      <div className={rootClass}>
        <Modal.Header>
          <h1>Create Project</h1>
          <ToggleItems items={steps} active={step} onSelect={setStep} />

          <Space>
            <Button look="danger" size="compact" onClick={onDelete} waiting={waiting}>Delete</Button>
            <Button look="primary" size="compact" onClick={onCreate} waiting={waiting || uploading} disabled={!project || uploadDisabled || error}>Save</Button>
          </Space>
        </Modal.Header>
        <ProjectName
          name={name}
          setName={setName}
          onSaveName={onSaveName}
          selectedWorkspace={selectedWorkspace} 
          setSelectedWorkspace={setSelectedWorkspace}
          lstWorkspaces={lstWorkspaces}
          description={description}
          setDescription={setDescription}
          error={error}
          onSubmit={onCreate}
          show={step === "name"}
        />
        <ImportPage project={project} show={step === "import"} {...pageProps} />
        <ConfigPage project={project} onUpdate={setConfig} show={step === "config"} columns={columns} disableSaveButton={true} />
      </div>
    </Modal>
  );
};
