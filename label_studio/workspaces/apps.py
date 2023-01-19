"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from django.apps import AppConfig
from django.db.models.signals import post_migrate

def create_default_workspace(sender, **kwargs):
    """after migrations"""
    from workspaces.models import Workspace

    # Create a default workspace that has ID=1
    if not Workspace.objects.exists():
        Workspace.objects.create(title="Default Workspace")

class WorkspacesConfig(AppConfig):
    name = 'workspaces'

    def ready(self):
        post_migrate.connect(create_default_workspace, sender=self)