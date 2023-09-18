# vim: set ft=py
#
# NOTE: This Tiltfile does not deploy the resources, this is on purpose.
#       This file is supposed to be loaded by a parent Tiltfile.
#       See git:northerntechhq/alvaldi-helm/develop/Tiltfile


def build(name="gui", dir=".", labels=[]):
    local_resource(
        name,
        # Initial build if dist does not exist
        cmd="test -d dist || npm run build",
        dir=dir,
        # Command to run in the background
        serve_cmd="npm run watch",
        serve_dir=dir,
        labels=labels,
    )
    custom_build(
        name,
        "docker build -t $EXPECTED_REF --target unprivileged %s" % dir,
        deps=[os.path.join(dir, "Dockerfile"), os.path.join(dir, "dist")],
        live_update=[sync(os.path.join(dir, "dist"), "/var/www/mender-gui/dist")],
    )
