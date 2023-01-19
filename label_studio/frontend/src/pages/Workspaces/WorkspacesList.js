import React from 'react';
import { Button, Menu } from '../../components';
import { cn } from '../../utils/bem';
import { IconFolder } from '../../assets/icons';

export const WorkspacesList = ({
    workspaces, openWorkspaceModal,
    handlerToFetchProjectsInWorkspace, activeWorkspace
}) => {
  const sidebarClass = cn('sidebar');
  return (
    <>
      <div
        visible={true}
        className={[sidebarClass, sidebarClass.mod({floating: false})].join(" ")}
        style={{backgroundColor: "rgb(255,255,255)"}}
      >
        <Menu>
          <Button 
            onClick={openWorkspaceModal}
            look="primary"
            style={{marginBottom: 8}}>New Workspace</Button>
          {workspaces.map(workspace => (
            <WorkspaceCard
              handler={handlerToFetchProjectsInWorkspace}
              workspace={workspace}
              activeWorkspace={activeWorkspace}/>
          ))}
        </Menu>
      </div>
    </>
  );
};

const WorkspaceCard = ({ handler, workspace, activeWorkspace }) => {
  return (
    <Menu.Item
      key={`workspace-${workspace.id}`}
      label={workspace.title}
      icon={<IconFolder/>}
      data-external
      exact
      active={workspace.id==activeWorkspace}
      onClick={async () => {await handler(workspace.id)}}
    />
  );
};