from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_userprofile_raw_password'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userprofile',
            name='raw_password',
        ),
    ]
