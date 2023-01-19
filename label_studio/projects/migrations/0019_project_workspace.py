# Generated by Django 3.2.16 on 2023-01-19 22:17

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('workspaces', '__first__'),
        ('projects', '0018_alter_project_control_weights'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='workspace',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='projects', to='workspaces.workspace'),
        ),
    ]
