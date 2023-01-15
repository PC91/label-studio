def duplicate_project(project_id):
    from projects.models import Project
    project_to_duplicate = Project.objects.filter(id=project_id).first()
    return project_to_duplicate.duplicate()