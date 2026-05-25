# JobAbility deployment

This directory contains the Docker and Kubernetes configuration used by the
GitLab CI/CD pipeline for the final project.

## Architecture

- `frontend`: Nginx container serving the React/Vite build and proxying API paths.
- `backend`: Django/Gunicorn container running migrations at startup.
- `postgres`: PostgreSQL pod with a persistent volume.
- `redis`: persistent Redis cache used for Django sessions.
- `minio`: S3-compatible media storage with a persistent volume; legacy
  `/app/media` files are copied to its `jobability` bucket on bootstrap.
- `prometheus` and `grafana`: monitoring for Django `/metrics/`, with the
  JobAbility dashboard provisioned automatically.
- `adminer`: browser UI for inspecting PostgreSQL during demonstration.
- `ingress`: Traefik ingress exposed by k3s.

The single-node k3s VM uses one persistent MinIO instance instead of the
four-node local Docker Compose example. Uploaded images and video are exposed
through the frontend `/media/` proxy while their files are stored in MinIO.

## One-time VM preparation

The GitLab Runner must use a shell executor on the same VM as k3s and Docker.
Register it with the tag `jobability`, then give it access to Docker and the
k3s image import command:

```bash
sudo usermod -aG docker gitlab-runner
echo 'gitlab-runner ALL=(root) NOPASSWD: /usr/local/bin/k3s' | sudo tee /etc/sudoers.d/gitlab-runner-k3s
sudo chmod 440 /etc/sudoers.d/gitlab-runner-k3s
sudo visudo -cf /etc/sudoers.d/gitlab-runner-k3s
sudo systemctl restart gitlab-runner
```

In GitLab create a protected CI/CD variable named `KUBECONFIG` with type
`File`. Its value is the content of:

```bash
sudo cat /etc/rancher/k3s/k3s.yaml
```

Before the first pipeline run, create the application secret in k3s:

```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
kubectl apply -f deploy/k8s/namespace.yaml
kubectl -n jobability create secret generic jobability-secrets \
  --from-literal=DJANGO_SECRET_KEY="$(openssl rand -hex 32)" \
  --from-literal=POSTGRES_PASSWORD="$(openssl rand -hex 24)" \
  --from-literal=MINIO_ROOT_USER="jobability" \
  --from-literal=MINIO_ROOT_PASSWORD="$(openssl rand -hex 24)"

kubectl -n jobability create secret generic jobability-monitoring-secrets \
  --from-literal=GRAFANA_ADMIN_PASSWORD="$(openssl rand -hex 24)"
```

If the base deployment already exists, extend its existing secrets before
running the expanded pipeline:

```bash
MINIO_PASSWORD="$(openssl rand -hex 24)"
GRAFANA_PASSWORD="$(openssl rand -hex 24)"
kubectl -n jobability patch secret jobability-secrets --type merge \
  -p "{\"stringData\":{\"MINIO_ROOT_USER\":\"jobability\",\"MINIO_ROOT_PASSWORD\":\"${MINIO_PASSWORD}\"}}"
kubectl -n jobability create secret generic jobability-monitoring-secrets \
  --from-literal=GRAFANA_ADMIN_PASSWORD="${GRAFANA_PASSWORD}"
unset MINIO_PASSWORD GRAFANA_PASSWORD
```

Do not commit generated secret values. The example Secret manifests document
the required keys only.

## Pipeline

Commits to the default branch execute three required stages:

1. `build`: build backend and frontend Docker images tagged with the short commit SHA.
2. `upload`: import the image archives into the local k3s containerd store.
3. `deploy`: bootstrap MinIO and Redis, provision monitoring, apply all
   Kubernetes manifests, and update application deployments to the new images.

When the pipeline finishes, verify from the VM:

```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
kubectl -n jobability get pods,svc,ingress,configmap
curl -I -H 'Host: jobability.local' http://127.0.0.1/
```

From the host computer the exposed UIs are available at:

- Application: `http://192.168.56.19/`
- MinIO console: `http://192.168.56.19:30901/`
- Prometheus: `http://192.168.56.19:30900/`
- Grafana: `http://192.168.56.19:30300/`
- Adminer: `http://192.168.56.19:30092/`
