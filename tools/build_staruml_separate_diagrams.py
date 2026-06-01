import json
from pathlib import Path

from build_staruml_mdj import (
    class_view,
    dependency,
    dependency_view,
    gid,
    model_element,
    node_or_component_view,
    note_view,
    ref,
    text_view,
    uml_class,
)


OUT_DIR = Path("docs/staruml")
CLASS_OUT = OUT_DIR / "JobAbility_Class_Diagram.mdj"
DEPLOY_OUT = OUT_DIR / "JobAbility_Deployment_Diagram.mdj"


def center(view):
    return view["left"] + view["width"] // 2, view["top"] + view["height"] // 2


def point(view, side):
    if side == "left":
        return view["left"], view["top"] + view["height"] // 2
    if side == "right":
        return view["left"] + view["width"], view["top"] + view["height"] // 2
    if side == "top":
        return view["left"] + view["width"] // 2, view["top"]
    if side == "bottom":
        return view["left"] + view["width"] // 2, view["top"] + view["height"]
    return center(view)


def make_project(name, diagram, elements):
    project_id = gid("PROJ")
    model_id = diagram["_parent"]["$ref"]
    model = {
        "_type": "UMLModel",
        "_id": model_id,
        "_parent": ref(project_id),
        "name": name,
        "ownedElements": [diagram, *elements],
        "visibility": "public",
    }
    return {
        "_type": "Project",
        "_id": project_id,
        "name": name,
        "ownedElements": [model],
    }


def add_class(model_id, diagram_id, elements, views, name, stereotype, operations, x, y, w=270, fill="#FFFFFF", line="#2563EB"):
    cls = uml_class(model_id, name, operations, stereotype)
    elements.append(cls)
    view = class_view(diagram_id, cls, x, y, w, fill, line)
    views.append(view)
    return cls, view


def add_node(model_id, diagram_id, elements, views, name, stereotype, x, y, w, h, fill="#FFFFFF", line="#475569"):
    node = model_element("UMLNode", model_id, name, stereotype=stereotype)
    elements.append(node)
    view = node_or_component_view("UMLNodeView", diagram_id, node["_id"], name, x, y, w, h, fill, line)
    views.append(view)
    return node, view


def add_component(model_id, diagram_id, elements, views, name, stereotype, x, y, w, h, fill="#F8FAFC", line="#64748B", artifact=False):
    element_type = "UMLArtifact" if artifact else "UMLComponent"
    view_type = "UMLArtifactView" if artifact else "UMLComponentView"
    component = model_element(element_type, model_id, name, stereotype=stereotype)
    elements.append(component)
    view = node_or_component_view(view_type, diagram_id, component["_id"], name, x, y, w, h, fill, line)
    views.append(view)
    return component, view


def add_dep(model_id, diagram_id, elements, views, source, target, source_view, target_view, label="", points=None, line="#475569"):
    dep = dependency(model_id, source["_id"], target["_id"], label or "uses")
    elements.append(dep)
    if points is None:
        points = [point(source_view, "right"), point(target_view, "left")]
    views.append(dependency_view(diagram_id, dep, source_view, target_view, label, points, line))


def build_class_project():
    model_id = gid("MODEL")
    diagram_id = gid("DIA")
    elements = []
    views = [
        text_view(
            diagram_id,
            "JobAbility - class diagram: frontend pages, API clients and backend API domains",
            40,
            20,
            1020,
            30,
            "#111827",
            True,
        )
    ]

    classes = {}
    class_views = {}

    def cls(name, stereotype, ops, x, y, w=260, fill="#EFF6FF", line="#2563EB"):
        c, v = add_class(model_id, diagram_id, elements, views, name, stereotype, ops, x, y, w, fill, line)
        classes[name] = c
        class_views[name] = v

    views.append(note_view(diagram_id, "Frontend pages", 45, 70, 720, 42, "#F8FAFC", "#CBD5E1"))
    views.append(note_view(diagram_id, "Frontend API clients", 820, 70, 300, 42, "#ECFDF5", "#86EFAC"))
    views.append(note_view(diagram_id, "Backend API domains", 1180, 70, 620, 42, "#F5F3FF", "#C4B5FD"))

    cls("AppLayout", "layout", ["renderNavigation()", "renderOutlet()", "showCurrentUser()"], 430, 135, 250, "#EEF2FF")
    cls("ProtectedRoute", "guard", ["checkAuthentication()", "checkRole(roles)", "redirectToLogin()"], 430, 285, 250, "#EEF2FF")

    cls("HomePage", "page", ["route: /", "renderWelcome()", "navigateToVacancies()"], 70, 135)
    cls("VacanciesPage", "page", ["route: /vacancies", "fetchVacancies(filters)", "applyFilters()"], 70, 285)
    cls("VacancyDetailPage", "page", ["route: /vacancies/:id", "fetchVacancyById(id)", "addVacancyToApplication(id)"], 70, 460)
    cls("LoginPage", "page", ["route: /login", "loginUser(payload)"], 70, 640)
    cls("RegisterPage", "page", ["route: /register", "registerUser(payload)", "selectRole(role)"], 70, 770)

    cls("ApplicantCabinetPage", "page", ["route: /cabinet/applicant", "fetchApplicantProfile()", "updateApplicantProfile(profile)", "changePassword(payload)"], 430, 460, 285)
    cls("ApplicationsPage", "page", ["route: /applications", "fetchApplications(filters)", "moderateApplication(id, action)"], 430, 660, 285)
    cls("ApplicationDetailPage", "page", ["route: /applications/:id", "fetchApplicationById(id)", "updateApplication(id)", "formApplication(id)", "deleteApplication(id)"], 430, 835, 285)

    cls("EmployerCabinetPage", "page", ["route: /cabinet/employer", "fetchEmployerCabinet()", "createEmployerVacancy(formData)"], 720, 135, 285)
    cls("EmployerResponsesPage", "page", ["route: /cabinet/employer/responses", "fetchEmployerResponses()"], 720, 310, 285)
    cls("ModeratorCabinetPage", "page", ["route: /cabinet/moderator", "fetchModeratorCabinet()", "moderateVacancy(id, action)", "moderateApplication(id, action)"], 720, 460, 285)

    cls("AuthApi", "frontend API client", ["getCurrentUser()", "loginUser()", "registerUser()", "logoutUser()", "changePassword()"], 850, 135, 250, "#ECFDF5", "#059669")
    cls("VacancyApi", "frontend API client", ["fetchVacancies(filters)", "fetchVacancyById(id)"], 850, 330, 250, "#ECFDF5", "#059669")
    cls("ApplicationApi", "frontend API client", ["fetchApplicationCart()", "addVacancyToApplication()", "fetchApplications()", "fetchApplicationById()", "updateApplication()", "formApplication()", "moderateApplication()"], 850, 490, 250, "#ECFDF5", "#059669")
    cls("CabinetApi", "frontend API client", ["fetchApplicantProfile()", "updateApplicantProfile()", "fetchEmployerCabinet()", "createEmployerVacancy()", "fetchEmployerResponses()", "fetchModeratorCabinet()"], 850, 760, 250, "#ECFDF5", "#059669")
    cls("ApiClient", "base client", ["getApiBaseUrl()", "buildApiUrl(path)", "apiRequest(path, options)", "sendCredentials()"], 850, 1030, 250, "#ECFDF5", "#059669")

    cls("AuthDomain", "backend API domain", ["GET /api/users/me/", "POST /api/users/register/", "POST /api/users/login/", "POST /api/users/logout/", "PUT /api/users/password/"], 1200, 135, 295, "#F5F3FF", "#7C3AED")
    cls("VacancyDomain", "backend API domain", ["GET /api/vacancies/", "POST /api/vacancies/", "GET /api/vacancies/{id}/", "GET /api/vacancies/mine/", "GET /api/vacancies/pending/", "PUT /api/vacancies/{id}/moderate/"], 1510, 135, 315, "#F5F3FF", "#7C3AED")
    cls("ApplicationDomain", "backend API domain", ["GET /api/applications/cart/", "GET /api/applications/", "GET /api/applications/{id}/", "PUT /api/applications/{id}/", "PUT /api/applications/{id}/form/", "PUT /api/applications/{id}/moderate/", "DELETE /api/applications/{id}/delete/"], 1200, 420, 315, "#F5F3FF", "#7C3AED")
    cls("ApplicationLineDomain", "backend API domain", ["POST /api/application-lines/", "PUT /api/application-lines/", "DELETE /api/application-lines/"], 1530, 460, 295, "#F5F3FF", "#7C3AED")
    cls("ProfileDomain", "backend API domain", ["GET /api/users/profile/", "PUT /api/users/profile/"], 1200, 720, 295, "#F5F3FF", "#7C3AED")
    cls("EmployerResponsesDomain", "backend API domain", ["GET /api/applications/employer-responses/"], 1530, 720, 295, "#F5F3FF", "#7C3AED")
    cls("SystemDomain", "backend API domain", ["GET /swagger/", "GET /api/schema/", "GET /metrics/", "GET /admin/"], 1200, 900, 295, "#F5F3FF", "#7C3AED")

    # Minimal page dependencies: one or two meaningful API links per page, routed through tidy vertical lanes.
    page_links = [
        ("AppLayout", "AuthApi", 775),
        ("LoginPage", "AuthApi", 745),
        ("RegisterPage", "AuthApi", 730),
        ("VacanciesPage", "VacancyApi", 760),
        ("VacancyDetailPage", "VacancyApi", 775),
        ("VacancyDetailPage", "ApplicationApi", 790),
        ("ApplicantCabinetPage", "CabinetApi", 765),
        ("ApplicantCabinetPage", "AuthApi", 735),
        ("ApplicationsPage", "ApplicationApi", 775),
        ("ApplicationDetailPage", "ApplicationApi", 790),
        ("EmployerCabinetPage", "CabinetApi", 795),
        ("EmployerResponsesPage", "CabinetApi", 780),
        ("ModeratorCabinetPage", "CabinetApi", 765),
        ("ModeratorCabinetPage", "ApplicationApi", 750),
    ]
    for source, target, bus_x in page_links:
        sv = class_views[source]
        tv = class_views[target]
        sy = point(sv, "right")[1]
        ty = point(tv, "left")[1]
        add_dep(
            model_id,
            diagram_id,
            elements,
            views,
            classes[source],
            classes[target],
            sv,
            tv,
            "",
            [point(sv, "right"), (bus_x, sy), (bus_x, ty), point(tv, "left")],
            "#94A3B8",
        )

    for source, target in [("AuthApi", "ApiClient"), ("VacancyApi", "ApiClient"), ("ApplicationApi", "ApiClient"), ("CabinetApi", "ApiClient")]:
        sv = class_views[source]
        tv = class_views[target]
        add_dep(model_id, diagram_id, elements, views, classes[source], classes[target], sv, tv, "", [point(sv, "bottom"), point(tv, "top")], "#64748B")

    api_links = [
        ("AuthApi", "AuthDomain", "HTTP JSON"),
        ("VacancyApi", "VacancyDomain", "HTTP JSON / multipart"),
        ("ApplicationApi", "ApplicationDomain", "HTTP JSON"),
        ("ApplicationApi", "ApplicationLineDomain", "HTTP JSON"),
        ("CabinetApi", "ProfileDomain", "HTTP JSON"),
        ("CabinetApi", "EmployerResponsesDomain", "HTTP JSON"),
        ("CabinetApi", "VacancyDomain", "HTTP JSON / multipart"),
        ("CabinetApi", "ApplicationDomain", "HTTP JSON"),
    ]
    for source, target, label in api_links:
        sv = class_views[source]
        tv = class_views[target]
        sy = point(sv, "right")[1]
        ty = point(tv, "left")[1]
        add_dep(model_id, diagram_id, elements, views, classes[source], classes[target], sv, tv, label, [point(sv, "right"), (1150, sy), (1150, ty), point(tv, "left")])

    views.append(
        note_view(
            diagram_id,
            "Scope: frontend pages, frontend API clients and backend API domains. Database models are not shown.",
            1310,
            1040,
            430,
            70,
            "#FFFFFF",
            "#334155",
        )
    )

    diagram = {
        "_type": "UMLClassDiagram",
        "_id": diagram_id,
        "_parent": ref(model_id),
        "name": "01 Class Diagram - Frontend Backend API",
        "visible": True,
        "defaultDiagram": True,
        "ownedViews": views,
    }
    return make_project("JobAbility Class Diagram", diagram, elements)


def build_deployment_project():
    model_id = gid("MODEL")
    diagram_id = gid("DIA")
    elements = []
    views = [
        text_view(diagram_id, "JobAbility - Deployment diagram", 640, 20, 520, 30, "#111827", True)
    ]

    nodes = {}
    nviews = {}
    comps = {}
    cviews = {}

    def node(name, stereotype, x, y, w, h, fill="#FFFFFF"):
        nodes[name], nviews[name] = add_node(model_id, diagram_id, elements, views, name, stereotype, x, y, w, h, fill)

    def comp(name, stereotype, x, y, w, h, fill="#F8FAFC", artifact=False):
        comps[name], cviews[name] = add_component(model_id, diagram_id, elements, views, name, stereotype, x, y, w, h, fill, artifact=artifact)

    node("User device", "device", 70, 175, 240, 110, "#FFFFFF")
    comp("Browser\nChrome / mobile browser", "artifact", 95, 220, 190, 50, artifact=True)

    node("Temporary public access\nCloudflare Quick Tunnel", "cloud node", 80, 380, 240, 115, "#FFF7ED")
    comp("cloudflared tunnel\nfor demo URL", "component", 120, 425, 160, 45, "#FFFBEB")

    node("GitLab SaaS", "cloud node", 1390, 70, 260, 230, "#FFF7ED")
    comp("Repository\nxflame0xx1/jobability", "component", 1425, 115, 190, 52, "#FFFBEB")
    comp("GitLab CI/CD\nbuild -> test -> upload -> deploy", "component", 1410, 210, 220, 58, "#FFFBEB")

    node("Virtual machine\nUbuntu 22.04\n192.168.56.19", "execution environment", 350, 330, 1430, 1210, "#F8FAFC")
    comp("GitLab Runner\nshell executor", "component", 1420, 385, 150, 52, "#F1F5F9")
    comp("Docker Engine\nbuild images", "component", 1640, 640, 125, 52, "#F1F5F9")

    node("k3s Kubernetes cluster\nnamespace: jobability", "execution environment", 380, 520, 1260, 950, "#EEF2FF")

    node("Traefik ingress controller\nkube-system", "node", 625, 590, 245, 110, "#FFFFFF")
    comp("Ingress: jobability\npath / -> frontend:80", "artifact", 650, 640, 190, 42, artifact=True)

    node("frontend Pod\nDeployment/frontend", "node", 1160, 750, 260, 265, "#FFFFFF")
    comp("Nginx web server\nserves /usr/share/nginx/html", "component", 1185, 810, 210, 50)
    comp("React SPA static bundle\nHome, Vacancies, Cabinets,\nApplications, Auth pages", "artifact", 1185, 930, 210, 62, artifact=True)

    node("backend Pod\nDeployment/backend", "node", 910, 990, 250, 285, "#FFFFFF")
    comp("Django REST API\nGunicorn / Django app\nport 8000", "component", 935, 1045, 200, 62)
    comp("Auth API\nVacancy API\nApplication API\nProfile API\nMetrics", "component", 955, 1170, 160, 82)

    node("MinIO Pod\nService: minio:9000\nNodePort console: 30901", "node", 405, 1140, 310, 150, "#ECFDF5")
    comp("MinIO S3 API\nbucket: jobability", "component", 430, 1210, 130, 50, "#DCFCE7")
    comp("MinIO Console\nport 9001", "component", 585, 1210, 105, 50, "#DCFCE7")

    node("Redis Pod\nService redis:6379\nPVC redis-data", "node", 740, 1185, 140, 85, "#ECFDF5")
    node("PostgreSQL Pod\nService postgres:5432\nPVC postgres-data", "database", 1235, 1185, 210, 95, "#ECFDF5")

    node("Monitoring", "node", 410, 600, 200, 265, "#FEF2F2")
    comp("Grafana\nService NodePort 30300\nPVC grafana-data", "component", 430, 660, 160, 62, "#FEE2E2")
    comp("Prometheus\nService NodePort 30900\nPVC prometheus-data", "component", 430, 795, 160, 62, "#FEE2E2")

    node("DB administration", "node", 1410, 960, 190, 110, "#F1F5F9")
    comp("Adminer\nService NodePort 30092", "component", 1430, 1015, 150, 45, "#E2E8F0")

    comp("PVC\nbackend-media\nlegacy media mirror", "artifact", 410, 1370, 170, 70, "#FFFFFF", artifact=True)
    comp("Secret\njobability-secrets\njobability-monitoring-secrets", "artifact", 790, 1370, 220, 70, "#FFFFFF", artifact=True)
    comp("ConfigMap\njobability-config", "artifact", 1235, 1370, 155, 70, "#FFFFFF", artifact=True)

    def link(s, t, label, ss="right", ts="left", via=None):
        sm = comps.get(s) or nodes.get(s)
        tm = comps.get(t) or nodes.get(t)
        sv = cviews.get(s) or nviews.get(s)
        tv = cviews.get(t) or nviews.get(t)
        add_dep(model_id, diagram_id, elements, views, sm, tm, sv, tv, label, [point(sv, ss), *(via or []), point(tv, ts)])

    link("Browser\nChrome / mobile browser", "cloudflared tunnel\nfor demo URL", "HTTPS\ntrycloudflare.com", "bottom", "top", [(190, 330)])
    link("cloudflared tunnel\nfor demo URL", "Ingress: jobability\npath / -> frontend:80", "HTTP\n192.168.56.19:80", "right", "left", [(350, 450), (350, 660)])
    link("Browser\nChrome / mobile browser", "Ingress: jobability\npath / -> frontend:80", "HTTP\nhttp://192.168.56.19/", "left", "left", [(35, 245), (35, 540), (620, 540)])

    link("Ingress: jobability\npath / -> frontend:80", "Nginx web server\nserves /usr/share/nginx/html", "HTTP :80\nKubernetes Service frontend", "right", "left", [(930, 661), (930, 835)])
    link("Nginx web server\nserves /usr/share/nginx/html", "React SPA static bundle\nHome, Vacancies, Cabinets,\nApplications, Auth pages", "local file read\nstatic assets", "bottom", "top")
    link("Nginx web server\nserves /usr/share/nginx/html", "Django REST API\nGunicorn / Django app\nport 8000", "HTTP :8000\n/api, /admin, /swagger, /metrics\nKubernetes Service backend", "left", "right", [(1040, 835), (1040, 1076)])
    link("Nginx web server\nserves /usr/share/nginx/html", "MinIO S3 API\nbucket: jobability", "HTTP :9000\n/media/* -> /jobability/*", "left", "top", [(720, 835), (495, 1120)])

    link("Django REST API\nGunicorn / Django app\nport 8000", "Auth API\nVacancy API\nApplication API\nProfile API\nMetrics", "internal calls", "bottom", "top")
    link("Django REST API\nGunicorn / Django app\nport 8000", "PostgreSQL Pod\nService postgres:5432\nPVC postgres-data", "TCP 5432\nPostgreSQL protocol", "right", "left", [(1210, 1076), (1210, 1232)])
    link("Django REST API\nGunicorn / Django app\nport 8000", "Redis Pod\nService redis:6379\nPVC redis-data", "TCP 6379\nRedis protocol", "left", "right", [(830, 1076), (830, 1228)])
    link("Django REST API\nGunicorn / Django app\nport 8000", "MinIO S3 API\nbucket: jobability", "HTTP :9000\nS3-compatible API", "left", "right", [(760, 1076), (760, 1235)])
    link("Prometheus\nService NodePort 30900\nPVC prometheus-data", "Django REST API\nGunicorn / Django app\nport 8000", "HTTP GET /metrics", "right", "left", [(760, 826), (760, 1076)])
    link("Grafana\nService NodePort 30300\nPVC grafana-data", "Prometheus\nService NodePort 30900\nPVC prometheus-data", "HTTP :9090\nPrometheus datasource", "bottom", "top")
    link("Adminer\nService NodePort 30092", "PostgreSQL Pod\nService postgres:5432\nPVC postgres-data", "TCP 5432\nPostgreSQL protocol", "left", "right", [(1320, 1037), (1320, 1232)])

    link("MinIO S3 API\nbucket: jobability", "PVC\nbackend-media\nlegacy media mirror", "bootstrap mirror\nlegacy uploaded media", "bottom", "top")
    link("MinIO S3 API\nbucket: jobability", "Secret\njobability-secrets\njobability-monitoring-secrets", "MINIO_ROOT_USER / PASSWORD", "bottom", "left", [(495, 1345)])
    link("Django REST API\nGunicorn / Django app\nport 8000", "Secret\njobability-secrets\njobability-monitoring-secrets", "envFrom\nsecret values", "bottom", "top", [(1035, 1340)])
    link("PostgreSQL Pod\nService postgres:5432\nPVC postgres-data", "Secret\njobability-secrets\njobability-monitoring-secrets", "POSTGRES_PASSWORD", "bottom", "right", [(1340, 1345)])
    link("PostgreSQL Pod\nService postgres:5432\nPVC postgres-data", "ConfigMap\njobability-config", "POSTGRES_DB / USER", "bottom", "top")
    link("Django REST API\nGunicorn / Django app\nport 8000", "ConfigMap\njobability-config", "envFrom\nnon-secret config", "right", "top", [(1510, 1076), (1510, 1345)])

    link("Repository\nxflame0xx1/jobability", "GitLab CI/CD\nbuild -> test -> upload -> deploy", "push to main", "bottom", "top")
    link("GitLab CI/CD\nbuild -> test -> upload -> deploy", "GitLab Runner\nshell executor", "GitLab job over HTTPS", "bottom", "top")
    link("GitLab Runner\nshell executor", "Docker Engine\nbuild images", "docker build / docker save", "right", "top", [(1640, 411)])
    link("GitLab Runner\nshell executor", "k3s Kubernetes cluster\nnamespace: jobability", "kubectl apply\nkubectl set image", "bottom", "top")
    link("GitLab Runner\nshell executor", "k3s Kubernetes cluster\nnamespace: jobability", "k3s ctr images import\ncontainerd image store", "left", "top", [(1340, 430), (1340, 500)])

    views.append(note_view(diagram_id, "Deployment scope:\n- VM with k3s cluster\n- frontend web server with static files\n- backend web service\n- database and additional storages\n- monitoring and CI/CD delivery path", 1540, 1510, 240, 110, "#FFFFFF", "#334155"))

    diagram = {
        "_type": "UMLDeploymentDiagram",
        "_id": diagram_id,
        "_parent": ref(model_id),
        "name": "03 Deployment Diagram - Kubernetes",
        "visible": True,
        "defaultDiagram": True,
        "ownedViews": views,
    }
    return make_project("JobAbility Deployment Diagram", diagram, elements)


def write_project(path, project):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8")
    print(path)


def main():
    write_project(CLASS_OUT, build_class_project())
    write_project(DEPLOY_OUT, build_deployment_project())


if __name__ == "__main__":
    main()
