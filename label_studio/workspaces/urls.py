"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from django.urls import include, path

from . import api, views

app_name = 'workspaces'

# reverse for workspaces:name
_urlpatterns = [
    path('', views.workspace_list, name='workspace-index'),
    path('<int:pk>/settings/', views.workspace_settings, name='workspace-settings', kwargs={'sub_path': ''}),
]

# reverse for workspaces:api:name
_api_urlpatterns = [
    # CRUD
    path('', api.WorkspaceListAPI.as_view(), name='workspace-list'),
    path('<int:pk>/', api.WorkspaceAPI.as_view(), name='workspace-detail'),
]

urlpatterns = [
    path('workspaces/', include(_urlpatterns)),
    path('api/workspaces/', include((_api_urlpatterns, app_name), namespace='api')),
]