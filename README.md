# Log Viewer

Internal tool for streaming structured JSON logs from Kubernetes pods and local Docker containers in real time.

## Features

- Stream logs from K8s pods across multiple contexts/namespaces
- Stream logs from local Docker containers
- Filter by log level, search text, stdout/stderr
- Structured JSON viewer with syntax highlighting
- API request detail panel (method, status, duration, correlated jobs)
- Scheduler job timeline view
- Bookmark log entries for later reference

## Local Development

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npm run lint
npx tsc --noEmit  # type check
```

No test suite yet. The app reads `~/.kube/config` and `/var/run/docker.sock` from the machine it runs on.

---

## Server Deployment

Deploy as a shared read-only dashboard — one server, one kubeconfig, access controlled via an allowlist config.

### 1. Configure the K8s allowlist

```bash
cp k8s-allowlist.example.yaml k8s-allowlist.yaml
```

Edit `k8s-allowlist.yaml` to list the contexts/namespaces/projects to expose:

```yaml
allowed:
  - context: production
    namespace: default
    projects:           # pod name prefixes to show; omit to show all pods
      - api
      - worker
      - scheduler

  - context: staging
    namespace: staging
```

> `k8s-allowlist.yaml` is gitignored — never commit it.

### 2. Set environment variables

Copy `.env.example` to `.env.local` (or set as system env vars):

```bash
# Protect the app with HTTP Basic Auth (leave unset to disable)
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=your-strong-password

# Hide "Local Docker" source option (recommended on servers without Docker socket)
NEXT_PUBLIC_DISABLE_LOCAL_DOCKER=true
```

### 3. Ensure kubeconfig is available

The server must have `~/.kube/config` with credentials for all contexts listed in the allowlist. Test with:

```bash
kubectl --context=production get pods -n default
```

### 4. Build and run

```bash
npm install
npm run build
npm start         # runs on port 3000 by default
```

Or with Docker:

```bash
docker build -t log-viewer .
docker run -d \
  -p 3000:3000 \
  -v ~/.kube:/root/.kube:ro \
  -v $(pwd)/k8s-allowlist.yaml:/app/k8s-allowlist.yaml:ro \
  -e BASIC_AUTH_USER=admin \
  -e BASIC_AUTH_PASS=your-password \
  -e NEXT_PUBLIC_DISABLE_LOCAL_DOCKER=true \
  log-viewer
```

### Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `BASIC_AUTH_USER` | — | Enable Basic Auth with this username |
| `BASIC_AUTH_PASS` | — | Basic Auth password |
| `NEXT_PUBLIC_DISABLE_LOCAL_DOCKER` | `false` | Hide the Local Docker source option |
| `K8S_ALLOWLIST_PATH` | `./k8s-allowlist.yaml` | Custom path to allowlist config |

### Security Notes

- Basic Auth sends credentials base64-encoded — **HTTPS is required** in production
- Server admin cannot read stored kubeconfig credentials (they live in `~/.kube/config` on the server, access-controlled by the OS)
- Users can only see projects explicitly listed in the allowlist, even if the kubeconfig has access to more
- Forgot to set up HTTPS? Put Nginx or Caddy in front with TLS termination
