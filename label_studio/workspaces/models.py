"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging

from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinLengthValidator, MaxLengthValidator
from django.db import models

from core.utils.common import load_func


logger = logging.getLogger(__name__)


class WorkspaceManager(models.Manager):
    def for_user(self, user):
        return self.filter()

    def with_counts(self, fields=None):
        return self.with_counts_annotate(self, fields=fields)

    @staticmethod
    def with_counts_annotate(queryset, fields=None):
        available_fields = {}
        if fields is None:
            to_annotate = available_fields
        else:
            to_annotate = {field: available_fields[field] for field in fields if field in available_fields}

        for _, annotate_func in to_annotate.items():
            queryset = annotate_func(queryset)

        return queryset


WorkspaceMixin = load_func(settings.WORKSPACE_MIXIN)


class Workspace(WorkspaceMixin, models.Model):

    objects = WorkspaceManager()

    title = models.CharField(
        _('title'),
        null=True,
        blank=True,
        default='',
        max_length=settings.WORKSPACE_TITLE_MAX_LEN,
        help_text=f'Workspace name. Must be between {settings.WORKSPACE_TITLE_MIN_LEN} and {settings.WORKSPACE_TITLE_MAX_LEN} characters long.',
        validators=[
            MinLengthValidator(settings.WORKSPACE_TITLE_MIN_LEN),
            MaxLengthValidator(settings.WORKSPACE_TITLE_MAX_LEN),
        ],
    )

    color = models.CharField(_('color'), max_length=16, default='#FFFFFF', null=True, blank=True)

    is_draft = models.BooleanField(
        _('is draft'), default=False, help_text='Whether or not the workspace is in the middle of being created'
    )

    def __init__(self, *args, **kwargs):
        super(Workspace, self).__init__(*args, **kwargs)

    @property
    def is_private(self):
        return None

    @property
    def secure_mode(self):
        return False

    def save(self, *args, **kwargs):
        super(Workspace, self).save(*args, **kwargs)

    @staticmethod
    def django_settings():
        return settings

    def __str__(self):
        return f'{self.title} (id={self.id})' or _("Business number %d") % self.pk

    class Meta:
        db_table = 'workspace'


class WorkspaceOnboardingSteps(models.Model):
    """ """

    CONF_SETTINGS = "CF"

    STEPS_CHOICES = (
        (CONF_SETTINGS, "Configure settings"),
    )

    code = models.CharField(max_length=2, choices=STEPS_CHOICES, null=True)

    title = models.CharField(_('title'), max_length=1000, null=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']


class WorkspaceOnboarding(models.Model):
    """ """

    step = models.ForeignKey(WorkspaceOnboardingSteps, on_delete=models.CASCADE, related_name="wo_through")
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)

    finished = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        super(WorkspaceOnboarding, self).save(*args, **kwargs)
        if WorkspaceOnboarding.objects.filter(workspace=self.workspace, finished=True).count() == 4:
            self.workspace.skip_onboarding = True
            self.workspace.save()