"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging

from django.db import IntegrityError
from django.conf import settings
from drf_yasg.utils import swagger_auto_schema
from django.utils.decorators import method_decorator
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.pagination import PageNumberPagination

from core.utils.common import temporary_disconnect_all_signals
from workspaces.models import (
    Workspace, WorkspaceManager
)
from workspaces.serializers import (
    WorkspaceSerializer, GetFieldsSerializer
)
from webhooks.utils import api_webhook, api_webhook_for_delete
from webhooks.models import WebhookAction

from core.permissions import all_permissions, ViewClassPermission
from core.utils.exceptions import LabelStudioDatabaseException

logger = logging.getLogger(__name__)


class WorkspaceListPagination(PageNumberPagination):
    page_size = 10000
    page_size_query_param = 'page_size'


@method_decorator(name='get', decorator=swagger_auto_schema(
    tags=['Workspaces'],
    operation_summary='List your workspaces',
    operation_description="""
    Return a list of the workspaces that you've created.
    To perform most tasks with the Label Studio API, you must specify the workspace ID, sometimes referred to as the `pk`.
    To retrieve a list of your Label Studio workspaces, update the following command to match your own environment.
    Replace the domain name, port, and authorization token, then run the following from the command line:
    ```bash
    curl -X GET {}/api/workspaces/ -H 'Authorization: Token abc123'
    ```
    """.format(settings.HOSTNAME or 'https://localhost:8080')
))
@method_decorator(name='post', decorator=swagger_auto_schema(
    tags=['Workspaces'],
    operation_summary='Create new workspace',
    operation_description="""
    Create a workspace and set up the labeling interface in Label Studio using the API.
    
    ```bash
    curl -H Content-Type:application/json -H 'Authorization: Token abc123' -X POST '{}/api/workspaces' \
    --data "{{\"label_config\": \"<View>[...]</View>\"}}"
    ```
    """.format(settings.HOSTNAME or 'https://localhost:8080')
))
class WorkspaceListAPI(generics.ListCreateAPIView):
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    serializer_class = WorkspaceSerializer
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    permission_required = ViewClassPermission(
        GET=all_permissions.workspaces_view,
        POST=all_permissions.workspaces_create,
    )
    pagination_class = WorkspaceListPagination

    def get_queryset(self):
        serializer = GetFieldsSerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        fields = serializer.validated_data.get('include')
        workspaces = Workspace.objects.all()
        return WorkspaceManager.with_counts_annotate(workspaces, fields=fields)

    def get_serializer_context(self):
        context = super(WorkspaceListAPI, self).get_serializer_context()
        context['created_by'] = self.request.user
        return context

    def perform_create(self, ser):
        try:
            workspace = ser.save()
        except IntegrityError as e:
            raise LabelStudioDatabaseException('Database error during workspace creation. Try again.')

    def get(self, request, *args, **kwargs):
        return super(WorkspaceListAPI, self).get(request, *args, **kwargs)

    @api_webhook(WebhookAction.WORKSPACE_CREATED)
    def post(self, request, *args, **kwargs):
        return super(WorkspaceListAPI, self).post(request, *args, **kwargs)


@method_decorator(name='get', decorator=swagger_auto_schema(
        tags=['Workspaces'],
        operation_summary='Get workspace by ID',
        operation_description='Retrieve information about a workspace by workspace ID.'
    ))
@method_decorator(name='delete', decorator=swagger_auto_schema(
        tags=['Workspaces'],
        operation_summary='Delete workspace',
        operation_description='Delete a workspace by specified workspace ID.'
    ))
@method_decorator(name='patch', decorator=swagger_auto_schema(
        tags=['Workspaces'],
        operation_summary='Update workspace',
        operation_description='Update the workspace settings for a specific workspace.',
        request_body=WorkspaceSerializer
    ))
class WorkspaceAPI(generics.RetrieveUpdateDestroyAPIView):

    parser_classes = (JSONParser, FormParser, MultiPartParser)
    queryset = Workspace.objects.with_counts()
    permission_required = ViewClassPermission(
        GET=all_permissions.workspaces_view,
        DELETE=all_permissions.workspaces_delete,
        PATCH=all_permissions.workspaces_change,
        PUT=all_permissions.workspaces_change,
        POST=all_permissions.workspaces_create,
    )
    serializer_class = WorkspaceSerializer

    redirect_route = 'workspaces:workspace-detail'
    redirect_kwarg = 'pk'

    def get_queryset(self):
        serializer = GetFieldsSerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        fields = serializer.validated_data.get('include')
        return Workspace.objects.with_counts(fields=fields)

    def get(self, request, *args, **kwargs):
        return super(WorkspaceAPI, self).get(request, *args, **kwargs)

    @api_webhook_for_delete(WebhookAction.WORKSPACE_DELETED)
    def delete(self, request, *args, **kwargs):
        return super(WorkspaceAPI, self).delete(request, *args, **kwargs)

    @api_webhook(WebhookAction.WORKSPACE_UPDATED)
    def patch(self, request, *args, **kwargs):
        return super(WorkspaceAPI, self).patch(request, *args, **kwargs)

    def perform_destroy(self, instance):
        # we don't need to relaculate counters if we delete whole workspace
        with temporary_disconnect_all_signals():
            instance.delete()

    @swagger_auto_schema(auto_schema=None)
    @api_webhook(WebhookAction.PROJECT_UPDATED)
    def put(self, request, *args, **kwargs):
        return super(WorkspaceAPI, self).put(request, *args, **kwargs)