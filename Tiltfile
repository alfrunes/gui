# vim: set ft=py
#
# NOTE: This Tiltfile does not deploy the resources, this is on purpose.
#       This file is supposed to be loaded by a parent Tiltfile.
#       See git:northerntechhq/alvaldi-helm/develop/Tiltfile

watch = local_resource(
    "alvaldi-gui watch",
    # Initial build if dist does not exist
    cmd="test -d dist || npm run build",
    # Command to run in the background
    serve_cmd="npm run watch"
)

build = custom_build(
 "alvaldi-gui",
 "docker build -t $EXPECTED_REF --target unprivileged .",
 deps=["Dockerfile", "dist"],
 live_update=[
    sync("dist", "/var/www/mender-gui/dist")
 ],
)
