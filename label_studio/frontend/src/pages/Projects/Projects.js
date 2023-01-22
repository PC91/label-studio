import React, { useState } from 'react';
import { useParams as useRouterParams } from 'react-router';
import { Redirect } from 'react-router-dom';
import { Button } from '../../components';
import { Oneof } from '../../components/Oneof/Oneof';
import { Spinner } from '../../components/Spinner/Spinner';
import { ApiContext } from '../../providers/ApiProvider';
import { useContextProps } from '../../providers/RoutesProvider';
import { useAbortController } from "../../hooks/useAbortController";
import { useActiveWorkspace } from '../../providers/ConfigProvider';
import { Block, Elem } from '../../utils/bem';
import { FF_DEV_2575, isFF } from '../../utils/feature-flags';
import { CreateProject } from '../CreateProject/CreateProject';
import { DataManagerPage } from '../DataManager/DataManager';
import { SettingsPage } from '../Settings';
import './Projects.styl';
import { EmptyProjectsList, ProjectsList } from './ProjectsList';
import { WorkspacesList } from '../Workspaces/WorkspacesList';
import { CreateWorkspace } from '../CreateWorkspace/CreateWorkspace';
import { WorkspaceSettings } from '../WorkspaceSettings/WorkspaceSettings'

const getCurrentPage = () => {
  const pageNumberFromURL = new URLSearchParams(location.search).get("page");

  return pageNumberFromURL ? parseInt(pageNumberFromURL) : 1;
};

export const ProjectsPage = () => {
  const api = React.useContext(ApiContext);
  const abortController = useAbortController();
  const [workspacesList, setWorkspacesList] = React.useState([]);
  const [projectsList, setProjectsList] = React.useState([]);
  const [networkState, setNetworkState] = React.useState(null);
  const [currentPage, setCurrentPage] = useState(getCurrentPage());
  const [totalItems, setTotalItems] = useState(1);
  const setContextProps = useContextProps();
  const defaultPageSize = parseInt(localStorage.getItem('pages:projects-list') ?? 30);
  const {activeWorkspace, setActiveWorkspace} = useActiveWorkspace();
  const [projectModal, setProjectModal] = React.useState(false);
  const openProjectModal = setProjectModal.bind(null, true);
  const closeProjectModal = setProjectModal.bind(null, false);

  const [workspaceSettingsModal, setWorkspaceSettingsModal] = React.useState(false);
  const openWorkspaceSettingsModal = setWorkspaceSettingsModal.bind(null, true);
  const closeWorkspaceSettingsModal = setWorkspaceSettingsModal.bind(null, false);

  const [workspaceModal, setworkspaceModal] = React.useState(false);
  const openWorkspaceModal = setworkspaceModal.bind(null, true);
  const closeWorkspaceModal = setworkspaceModal.bind(null, false);

  const fetchWorkspaces = async () => {
    const requestWorkspaceParams = {};

    requestWorkspaceParams.include = [
      'id',
      'title',
      'color', 
    ].join(',');

    const dataWorkspaces = await api.callApi("workspaces", {
      params: requestWorkspaceParams,
    });
    const lstWorkspaces = dataWorkspaces.results?.sort((a, b) => (a.id > b.id) ? 1 : -1);
    setWorkspacesList(lstWorkspaces ?? []);
  }

  const fetchProjects = async (page  = currentPage, pageSize = defaultPageSize) => {
    setNetworkState('loading');
    abortController.renew(); // Cancel any in flight requests

    const requestParams = { page, page_size: pageSize };

    if (isFF(FF_DEV_2575)) {
      requestParams.include = [
        'id',
        'title',
        'created_by',
        'created_at', 
        'color', 
        'is_published', 
        'assignment_settings', 
        'workspace'
      ].join(',');
    }

    const data = await api.callApi("projects", {
      params: requestParams,
      ...(isFF(FF_DEV_2575) ? {
        signal: abortController.controller.current.signal,
        errorFilter: (e) => e.error.includes('aborted'), 
      } : null),
    });
    const lstProjects = data.results.filter(
      project => (project.workspace == activeWorkspace)
    );;
    setTotalItems(data?.count ?? 1);
    setProjectsList(lstProjects ?? []);
    setNetworkState('loaded');

    if (isFF(FF_DEV_2575) && lstProjects?.length) {
      const additionalData = await api.callApi("projects", {
        params: { ids: lstProjects?.map(({ id }) => id).join(',') },
        signal: abortController.controller.current.signal,
        errorFilter: (e) => e.error.includes('aborted'), 
      });

      if (additionalData?.results?.length) {
        setProjectsList(additionalData.results);
      }
    }
  };

  const loadNextPage = async (page, pageSize) => {
    setCurrentPage(page);
    await fetchProjects(page, pageSize);
  };

  React.useEffect(() => {
    setContextProps({
      activeWorkspaceId: activeWorkspace,
      openProjectModal,
      openWorkspaceSettingsModal
    })
  }, [activeWorkspace, workspacesList]);

  React.useEffect(() => {
    fetchProjects();
  }, [activeWorkspace]);

  React.useEffect(() => {
    fetchWorkspaces();
    setContextProps({
      openProjectModal,
      openWorkspaceSettingsModal
    });
  }, []);

  return (
    <>
      <Block name="workspaces-page">
        <Oneof value={networkState}>
          <Elem name="content" case="loaded">
            <WorkspacesList
              workspaces={workspacesList}
              activeWorkspace={activeWorkspace}
              setActiveWorkspace={setActiveWorkspace}
              openWorkspaceModal={openWorkspaceModal}
            />
          </Elem>
        </Oneof>
      </Block>
      <Block name="projects-page" style={{marginLeft: 240}}>
        <Oneof value={networkState}>
          <Elem name="loading" case="loading">
            <Spinner size={64}/>
          </Elem>
          <Elem name="content" case="loaded">
            {projectsList.length ? (
              <ProjectsList
                projects={projectsList}
                currentPage={currentPage}
                totalItems={totalItems}
                loadNextPage={loadNextPage}
                pageSize={defaultPageSize}
              />
            ) : (
              <EmptyProjectsList/>
            )}
            {projectModal &&
              <CreateProject
                activeWorkspace={activeWorkspace}
                setActiveWorkspace={setActiveWorkspace}
                onClose={closeProjectModal}/>}
            {workspaceModal &&
              <CreateWorkspace
                setActiveWorkspace={setActiveWorkspace}
                fetchWorkspaces={fetchWorkspaces}
                onClose={closeWorkspaceModal}/>}
            {workspaceSettingsModal &&
              <WorkspaceSettings
                activeWorkspaceBody={workspacesList.filter(
                  workspace => (workspace.id == activeWorkspace)
                )[0]}
                setActiveWorkspace={setActiveWorkspace}
                fetchWorkspaces={fetchWorkspaces}
                projects={projectsList}
                onClose={closeWorkspaceSettingsModal}/>}
          </Elem>
        </Oneof>
      </Block>
    </>
  );
};

ProjectsPage.title = "Projects";
ProjectsPage.path = "/projects";
ProjectsPage.exact = true;
ProjectsPage.routes = ({ store }) => [
  {
    title: () => store.project?.title,
    path: "/:id(\\d+)",
    exact: true,
    component: () => {
      const params = useRouterParams();

      return <Redirect to={`/projects/${params.id}/data`}/>;
    },
    pages: {
      DataManagerPage,
      SettingsPage,
    },
  },
];
ProjectsPage.context = ({
    activeWorkspaceId,
    openProjectModal,
    openWorkspaceSettingsModal
}) => {
  return <div style={{display: "flex"}}>
      {activeWorkspaceId != 1 &&
        <Button onClick={openWorkspaceSettingsModal} look="primary" size="compact">Settings</Button>
      }
      <div style={{width: 10}}></div>
      <Button onClick={openProjectModal} look="primary" size="compact">New Project</Button>
  </div>;
};