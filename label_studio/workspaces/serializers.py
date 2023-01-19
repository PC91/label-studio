"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from rest_framework import serializers
from rest_flex_fields import FlexFieldsModelSerializer

from workspaces.models import Workspace, WorkspaceOnboarding

class WorkspaceSerializer(FlexFieldsModelSerializer):
    """ Serializer get numbers from workspace queryset annotation,
        make sure, that you use correct one(Workspace.objects.with_counts())
    """

    def to_internal_value(self, data):
        # FIXME: remake this logic with start_training_on_annotation_update
        data = super().to_internal_value(data)
        return data

    class Meta:
        model = Workspace
        extra_kwargs = {'title': {'required': False}}
        fields = ['id', 'title', 'color', 'is_draft',]


class WorkspaceOnboardingSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceOnboarding
        fields = '__all__'


class GetFieldsSerializer(serializers.Serializer):
    include = serializers.CharField(required=False)
    filter = serializers.CharField(required=False, default='all')

    def validate_include(self, value):
        if value is not None:
            value = value.split(',')
        return value

    def validate_filter(self, value):
        if value in ['all', 'pinned_only', 'exclude_pinned']:
            return value
