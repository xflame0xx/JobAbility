# JobAbility deployment

This directory contains the Docker and Kubernetes configuration used by the
GitLab CI/CD pipeline for the final project.

## Architecture

- `frontend`: Nginx container serving the React/Vite build and proxying API paths.
- `backend`: Django/Gunicorn container running migrations at startup.
- `postgres`: PostgreSQL pod with a persistent volume.
- `ingress`: Traefik ingress exposed by k3s.

Uploads are kept on the backend media PVC in this educational deployment.
Local development MinIO and Redis containers are not required in Kubernetes.

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
  --from-literal=POSTGRES_PASSWORD="$(openssl rand -hex 24)"
```

Do not commit generated secret values. `secret.example.yaml` documents the
required keys only.

## Pipeline

Commits to the default branch execute three required stages:

1. `build`: build backend and frontend Docker images tagged with the short commit SHA.
2. `upload`: import the image archives into the local k3s containerd store.
3. `deploy`: apply the Kubernetes manifests and update deployments to the new images.

When the pipeline finishes, verify from the VM:

```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
kubectl -n jobability get pods,svc,ingress,configmap
curl -I -H 'Host: jobability.local' http://127.0.0.1/
```
