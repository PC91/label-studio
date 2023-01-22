import React from 'react';
import { Button, Menu } from '../../components';
import { cn } from '../../utils/bem';
import { IconFolder } from '../../assets/icons';

export const WorkspacesList = ({
    workspaces, activeWorkspace, setActiveWorkspace, openWorkspaceModal
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
              workspace={workspace}
              activeWorkspace={activeWorkspace}
              setActiveWorkspace={setActiveWorkspace}/>
          ))}
        </Menu>
      </div>
    </>
  );
};

const WorkspaceCard = ({ workspace, activeWorkspace, setActiveWorkspace }) => {
  return (
    <Menu.Item
      key={`workspace-${workspace.id}`}
      label={workspace.title}
      icon={<IconFolder/>}
      data-external
      exact
      active={workspace.id==activeWorkspace}
      onClick={() => {setActiveWorkspace(workspace.id)}}
    />
  );
};