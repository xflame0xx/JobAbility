from __future__ import annotations

import math
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUT = Path("docs/diagram_images")

COLORS = {
    "bg": "#F7F9FD",
    "ink": "#0F172A",
    "muted": "#475569",
    "line": "#64748B",
    "soft": "#CBD5E1",
    "white": "#FFFFFF",
    "blue": "#2563EB",
    "blue_soft": "#EFF6FF",
    "green": "#059669",
    "green_soft": "#ECFDF5",
    "violet": "#7C3AED",
    "violet_soft": "#F5F3FF",
    "orange": "#EA580C",
    "orange_soft": "#FFF7ED",
    "red": "#DC2626",
    "red_soft": "#FEF2F2",
    "slate_soft": "#F8FAFC",
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            pass
    return ImageFont.load_default()


F_TITLE = font(38, True)
F_H1 = font(24, True)
F_H2 = font(18, True)
F_BODY = font(16)
F_SMALL = font(14)
F_TINY = font(12)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def wrap(text: str, width: int) -> list[str]:
    lines: list[str] = []
    for line in text.splitlines() or [""]:
        lines.extend(textwrap.wrap(line, width=width, break_long_words=False) or [""])
    return lines


def draw_multiline(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    lines: list[str],
    fnt: ImageFont.FreeTypeFont,
    fill: str = COLORS["ink"],
    gap: int = 5,
):
    x, y = xy
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += text_size(draw, line, fnt)[1] + gap


def rounded_box(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    fill: str,
    outline: str,
    radius: int = 18,
    width: int = 2,
    shadow: bool = True,
):
    x1, y1, x2, y2 = box
    if shadow:
        draw.rounded_rectangle((x1 + 7, y1 + 9, x2 + 7, y2 + 9), radius=radius, fill="#DCE5F3")
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def container(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    title: str,
    subtitle: str = "",
    fill: str = COLORS["white"],
    outline: str = COLORS["soft"],
    title_color: str = COLORS["ink"],
):
    rounded_box(draw, box, fill, outline, 24, 2, shadow=False)
    x1, y1, _x2, _y2 = box
    draw.text((x1 + 24, y1 + 18), title, font=F_H1, fill=title_color)
    if subtitle:
        draw.text((x1 + 24, y1 + 50), subtitle, font=F_SMALL, fill=COLORS["muted"])


def card(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    size: tuple[int, int],
    title: str,
    body: str,
    fill: str = COLORS["white"],
    border: str = COLORS["line"],
    accent: str | None = None,
    header: str | None = None,
):
    x, y = xy
    w, h = size
    rounded_box(draw, (x, y, x + w, y + h), fill, border, 14, 2, True)
    if accent:
        draw.rounded_rectangle((x, y, x + 9, y + h), radius=14, fill=accent)
    if header:
        draw.text((x + 18, y + 11), header, font=F_TINY, fill=COLORS["muted"])
        draw.text((x + 18, y + 31), title, font=F_H2, fill=COLORS["ink"])
        body_y = y + 60
    else:
        draw.text((x + 18, y + 14), title, font=F_H2, fill=COLORS["ink"])
        body_y = y + 45
    draw_multiline(draw, (x + 18, body_y), wrap(body, max(18, (w - 36) // 8)), F_SMALL, COLORS["muted"], 4)


def class_card(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    size: tuple[int, int],
    title: str,
    stereotype: str,
    methods: list[str],
    fill: str,
    border: str,
):
    body = "\n".join(f"+ {method}" for method in methods)
    card(draw, xy, size, title, body, fill, border, border, f"<<{stereotype}>>")


def arrow_head(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], color: str, size: int = 12):
    sx, sy = start
    ex, ey = end
    angle = math.atan2(ey - sy, ex - sx)
    left = (ex - size * math.cos(angle - math.pi / 6), ey - size * math.sin(angle - math.pi / 6))
    right = (ex - size * math.cos(angle + math.pi / 6), ey - size * math.sin(angle + math.pi / 6))
    draw.polygon([end, left, right], fill=color)


def path(
    draw: ImageDraw.ImageDraw,
    points: list[tuple[int, int]],
    color: str,
    width: int = 3,
    label: str = "",
    label_at: tuple[int, int] | None = None,
):
    draw.line(points, fill=color, width=width, joint="curve")
    arrow_head(draw, points[-2], points[-1], color, 13)
    if not label:
        return
    x, y = label_at or (sum(p[0] for p in points) // len(points), sum(p[1] for p in points) // len(points))
    lines = label.split("\n")
    pad = 7
    w = max(text_size(draw, line, F_TINY)[0] for line in lines) + pad * 2
    h = len(lines) * 16 + pad
    draw.rounded_rectangle((x - w // 2, y - h // 2, x + w // 2, y + h // 2), radius=7, fill=COLORS["white"], outline="#E2E8F0")
    draw_multiline(draw, (x - w // 2 + pad, y - h // 2 + 4), lines, F_TINY, COLORS["muted"], 1)


def save(img: Image.Image, path_out: Path):
    path_out.parent.mkdir(parents=True, exist_ok=True)
    img.save(path_out, quality=96)
    print(path_out)


def render_class_diagram():
    img = Image.new("RGB", (3000, 1700), COLORS["bg"])
    draw = ImageDraw.Draw(img)

    draw.text((1100, 34), "JobAbility - Class diagram", font=F_TITLE, fill=COLORS["ink"])
    draw.text(
        (890, 86),
        "Frontend pages, API clients and backend API domains. Database models and tables are intentionally hidden.",
        font=F_BODY,
        fill=COLORS["muted"],
    )

    container(draw, (60, 150, 930, 1590), "Frontend SPA (React)", "Pages are grouped by user scenario", COLORS["white"])
    container(draw, (1165, 150, 1720, 1590), "Frontend API clients", "Single HTTP layer for pages", COLORS["green_soft"], "#BBF7D0", COLORS["green"])
    container(draw, (1960, 150, 2880, 1590), "Backend API domains", "Django REST Framework endpoints", COLORS["violet_soft"], "#DDD6FE", COLORS["violet"])

    # Frontend groups and pages.
    container(draw, (95, 220, 895, 560), "Public and auth pages", "guest access", "#FFFFFF")
    class_card(draw, (125, 285), (230, 92), "HomePage", "Page", ["route: /", "renderWelcome()"], COLORS["blue_soft"], COLORS["blue"])
    class_card(draw, (385, 285), (230, 92), "VacanciesPage", "Page", ["route: /vacancies", "applyFilters()"], COLORS["blue_soft"], COLORS["blue"])
    class_card(draw, (645, 285), (220, 92), "VacancyDetailPage", "Page", ["route: /vacancies/:id", "addToApplication()"], COLORS["blue_soft"], COLORS["blue"])
    class_card(draw, (210, 420), (245, 92), "LoginPage", "Page", ["route: /login", "loginUser()"], COLORS["blue_soft"], COLORS["blue"])
    class_card(draw, (505, 420), (245, 92), "RegisterPage", "Page", ["route: /register", "registerUser()"], COLORS["blue_soft"], COLORS["blue"])

    container(draw, (95, 610, 895, 890), "Applicant pages", "candidate cabinet and responses", "#FFFFFF")
    class_card(draw, (125, 680), (230, 120), "ApplicantCabinetPage", "Page", ["profile()", "updateProfile()", "changePassword()"], COLORS["blue_soft"], COLORS["blue"])
    class_card(draw, (385, 680), (230, 120), "ApplicationsPage", "Page", ["fetchApplications()", "moderateApplication()"], COLORS["blue_soft"], COLORS["blue"])
    class_card(draw, (645, 680), (220, 120), "ApplicationDetailPage", "Page", ["fetchById()", "formApplication()", "deleteApplication()"], COLORS["blue_soft"], COLORS["blue"])

    container(draw, (95, 940, 895, 1165), "Employer pages", "employer cabinet and candidate responses", "#FFFFFF")
    class_card(draw, (185, 1010), (285, 112), "EmployerCabinetPage", "Page", ["fetchCabinet()", "createVacancy()"], COLORS["blue_soft"], COLORS["blue"])
    class_card(draw, (520, 1010), (285, 112), "EmployerResponsesPage", "Page", ["route: /responses", "fetchResponses()"], COLORS["blue_soft"], COLORS["blue"])

    container(draw, (95, 1215, 895, 1438), "Moderator pages and routing", "role protection and moderation", "#FFFFFF")
    class_card(draw, (125, 1285), (260, 112), "ModeratorCabinetPage", "Page", ["fetchCabinet()", "moderateVacancy()", "moderateApplication()"], COLORS["blue_soft"], COLORS["blue"])
    class_card(draw, (435, 1270), (190, 118), "AppLayout", "Layout", ["renderNavigation()", "showCurrentUser()"], "#EEF2FF", "#4F46E5")
    class_card(draw, (665, 1270), (190, 118), "ProtectedRoute", "Guard", ["checkAuth()", "checkRole()", "redirectToLogin()"], "#EEF2FF", "#4F46E5")

    # API clients.
    class_card(draw, (1270, 240), (340, 168), "AuthApi", "Client", ["getCurrentUser()", "loginUser()", "registerUser()", "logoutUser()", "changePassword()"], COLORS["green_soft"], COLORS["green"])
    class_card(draw, (1270, 485), (340, 116), "VacancyApi", "Client", ["fetchVacancies(filters)", "fetchVacancyById(id)"], COLORS["green_soft"], COLORS["green"])
    class_card(draw, (1270, 675), (340, 210), "ApplicationApi", "Client", ["fetchApplicationCart()", "addVacancyToApplication()", "fetchApplications()", "fetchApplicationById()", "updateApplication()", "formApplication()", "moderateApplication()"], COLORS["green_soft"], COLORS["green"])
    class_card(draw, (1270, 960), (340, 188), "CabinetApi", "Client", ["fetchApplicantProfile()", "updateApplicantProfile()", "fetchEmployerCabinet()", "createEmployerVacancy()", "fetchEmployerResponses()", "fetchModeratorCabinet()"], COLORS["green_soft"], COLORS["green"])
    class_card(draw, (1270, 1240), (340, 140), "ApiClient", "BaseClient", ["getApiBaseUrl()", "apiRequest()", "sendCredentials()"], COLORS["green_soft"], COLORS["green"])

    # Backend domains.
    class_card(draw, (2020, 240), (360, 168), "AuthDomain", "BackendDomain", ["GET /api/users/me/", "POST /api/users/register/", "POST /api/users/login/", "POST /api/users/logout/", "PUT /api/users/password/"], COLORS["violet_soft"], COLORS["violet"])
    class_card(draw, (2450, 240), (360, 188), "VacancyDomain", "BackendDomain", ["GET /api/vacancies/", "POST /api/vacancies/", "GET /api/vacancies/{id}/", "GET /api/vacancies/mine/", "GET /api/vacancies/pending/", "PUT /api/vacancies/{id}/moderate/"], COLORS["violet_soft"], COLORS["violet"])
    class_card(draw, (2020, 535), (360, 220), "ApplicationDomain", "BackendDomain", ["GET /api/applications/cart/", "GET /api/applications/", "GET /api/applications/{id}/", "PUT /api/applications/{id}/", "PUT /api/applications/{id}/form/", "PUT /api/applications/{id}/moderate/", "DELETE /api/applications/{id}/delete/"], COLORS["violet_soft"], COLORS["violet"])
    class_card(draw, (2450, 555), (360, 132), "ApplicationLineDomain", "BackendDomain", ["POST /api/application-lines/", "PUT /api/application-lines/", "DELETE /api/application-lines/"], COLORS["violet_soft"], COLORS["violet"])
    class_card(draw, (2020, 850), (360, 116), "ProfileDomain", "BackendDomain", ["GET /api/users/profile/", "PUT /api/users/profile/"], COLORS["violet_soft"], COLORS["violet"])
    class_card(draw, (2450, 850), (360, 96), "EmployerResponsesDomain", "BackendDomain", ["GET /api/applications/employer-responses/"], COLORS["violet_soft"], COLORS["violet"])
    class_card(draw, (2020, 1100), (360, 140), "SystemDomain", "BackendDomain", ["GET /swagger/", "GET /api/schema/", "GET /metrics/", "GET /admin/"], COLORS["violet_soft"], COLORS["violet"])

    # Clean dependency buses.
    path(draw, [(895, 392), (1045, 392), (1045, 535), (1270, 535)], COLORS["blue"], 3, "catalog")
    path(draw, [(895, 455), (1025, 455), (1025, 324), (1270, 324)], COLORS["blue"], 3, "auth")
    path(draw, [(895, 750), (1045, 750), (1045, 780), (1270, 780)], COLORS["blue"], 3, "applications")
    path(draw, [(895, 1052), (1045, 1052), (1270, 1052)], COLORS["blue"], 3, "cabinet")
    path(draw, [(895, 1328), (1025, 1328), (1025, 780), (1270, 780)], COLORS["blue"], 3, "moderation")

    # API clients share the same base client. The inheritance bus is routed outside cards.
    path(draw, [(1270, 1310), (1215, 1310), (1215, 324), (1270, 324)], COLORS["green"], 2, "extends ApiClient", (1215, 1185))
    for y in (535, 780, 1052):
        path(draw, [(1215, y), (1270, y)], COLORS["green"], 2)

    # Backend mapping is intentionally short and horizontal to keep the diagram readable.
    path(draw, [(1610, 324), (2020, 324)], COLORS["violet"], 3, "Auth HTTP JSON", (1810, 300))
    path(draw, [(1610, 535), (1760, 535), (1760, 455), (2450, 455), (2450, 334)], COLORS["violet"], 3, "Vacancy HTTP JSON", (2110, 455))
    path(draw, [(1610, 745), (1815, 745), (1815, 645), (2020, 645)], COLORS["violet"], 3, "Application HTTP JSON", (1815, 705))
    path(draw, [(1610, 820), (1845, 820), (1845, 520), (2430, 520), (2430, 620), (2450, 620)], COLORS["violet"], 3, "Application lines", (2180, 520))
    path(draw, [(1610, 1035), (1875, 1035), (1875, 908), (2020, 908)], COLORS["violet"], 3, "Profile", (1875, 985))
    path(draw, [(1610, 1110), (1935, 1110), (1935, 790), (2630, 790), (2630, 850)], COLORS["violet"], 3, "Employer responses", (2255, 790))

    save(img, OUT / "jobability_class_diagram.png")


def render_deployment_diagram():
    img = Image.new("RGB", (3000, 1900), COLORS["bg"])
    draw = ImageDraw.Draw(img)

    draw.text((1180, 34), "JobAbility - Deployment diagram", font=F_TITLE, fill=COLORS["ink"])
    draw.text((950, 86), "VM, k3s cluster, web server with static files, API service, storages, monitoring and CI/CD path.", font=F_BODY, fill=COLORS["muted"])

    container(draw, (70, 210, 360, 360), "User device", "", "#FFFFFF")
    card(draw, (110, 265), (220, 82), "Browser", "Chrome / mobile browser", "#FFFFFF", COLORS["line"])

    container(draw, (70, 480, 360, 635), "Cloudflare tunnel", "temporary public URL", COLORS["orange_soft"], "#FDBA74", COLORS["orange"])
    card(draw, (110, 540), (220, 82), "cloudflared", "trycloudflare.com -> VM:80", "#FFFFFF", "#FDBA74")

    container(draw, (2385, 120, 2800, 330), "GitLab SaaS", "", COLORS["orange_soft"], "#FDBA74", COLORS["orange"])
    card(draw, (2435, 170), (310, 72), "Repository", "xflame0xx1/jobability", "#FFFFFF", "#FDBA74")
    card(draw, (2435, 258), (310, 76), "CI/CD pipeline", "build -> test -> upload -> deploy", "#FFFFFF", "#FDBA74")

    container(draw, (430, 360, 2760, 1635), "Virtual machine", "Ubuntu 22.04 / 192.168.56.19", "#FFFFFF", COLORS["line"])
    card(draw, (2400, 480), (240, 80), "GitLab Runner", "shell executor", "#FFFFFF", COLORS["line"])
    card(draw, (2400, 650), (240, 80), "Docker Engine", "build and save images", "#FFFFFF", COLORS["line"])

    container(draw, (650, 470, 2235, 1510), "k3s Kubernetes cluster", "namespace: jobability", "#F8FAFC", COLORS["line"])

    container(draw, (735, 570, 1000, 740), "Ingress", "kube-system", "#FFFFFF", COLORS["line"])
    card(draw, (775, 622), (190, 88), "Traefik", "LoadBalancer :80/:443", "#FFFFFF", COLORS["line"])

    container(draw, (1175, 570, 1505, 810), "frontend Pod", "Deployment/frontend", "#FFFFFF", COLORS["line"])
    card(draw, (1215, 620), (250, 82), "Nginx web server", "serves /usr/share/nginx/html", "#FFFFFF", COLORS["line"])
    card(draw, (1215, 720), (250, 82), "React SPA bundle", "Home, Vacancies, Cabinets, Auth pages", "#FFFFFF", COLORS["line"])

    container(draw, (1695, 570, 2045, 835), "backend Pod", "Deployment/backend", "#FFFFFF", COLORS["line"])
    card(draw, (1735, 620), (270, 84), "Django REST API", "Gunicorn / app port 8000", "#FFFFFF", COLORS["line"])
    card(draw, (1735, 730), (270, 84), "API domains", "Auth, Vacancy, Application, Profile, Metrics", "#FFFFFF", COLORS["line"])

    container(draw, (735, 930, 1060, 1125), "MinIO Pod", "object storage", COLORS["green_soft"], "#86EFAC", COLORS["green"])
    card(draw, (775, 995), (245, 72), "MinIO S3 API", "service minio:9000 / bucket jobability", "#FFFFFF", "#86EFAC")

    card(draw, (1230, 955), (270, 92), "PostgreSQL Pod", "service postgres:5432\nPVC postgres-data", COLORS["green_soft"], "#86EFAC", COLORS["green"])
    card(draw, (1695, 955), (245, 92), "Redis Pod", "service redis:6379\nPVC redis-data", COLORS["green_soft"], "#86EFAC", COLORS["green"])

    container(draw, (1975, 930, 2210, 1090), "DB admin", "", "#FFFFFF", COLORS["line"])
    card(draw, (2010, 990), (170, 72), "Adminer", "NodePort 30092", "#FFFFFF", COLORS["line"])

    container(draw, (735, 1235, 1100, 1430), "Monitoring", "", COLORS["red_soft"], "#FCA5A5", COLORS["red"])
    card(draw, (780, 1292), (280, 64), "Prometheus", "NodePort 30900 / GET /metrics", "#FFFFFF", "#FCA5A5")
    card(draw, (780, 1368), (280, 64), "Grafana", "NodePort 30300 / Prometheus datasource", "#FFFFFF", "#FCA5A5")

    card(draw, (1230, 1260), (285, 88), "Secrets", "jobability-secrets\njobability-monitoring-secrets", "#FFFFFF", COLORS["line"])
    card(draw, (1620, 1260), (245, 88), "ConfigMap", "jobability-config", "#FFFFFF", COLORS["line"])
    card(draw, (1975, 1260), (255, 88), "PVC volumes", "postgres, redis, minio,\nbackend-media, monitoring", "#FFFFFF", COLORS["line"])
    card(draw, (2070, 565), (135, 70), "k3s API", "apply manifests\nset image", "#FFFFFF", COLORS["line"])
    card(draw, (2070, 680), (135, 70), "containerd", "image store", "#FFFFFF", COLORS["line"])

    # Public traffic.
    path(draw, [(215, 332), (215, 480)], COLORS["blue"], 3, "HTTPS", (265, 420))
    path(draw, [(360, 576), (610, 576), (610, 655), (775, 655)], COLORS["blue"], 3, "HTTP :80", (565, 540))

    # Inside cluster request path.
    path(draw, [(965, 655), (1215, 655)], COLORS["blue"], 3, "Service frontend:80", (1090, 622))
    path(draw, [(1465, 655), (1735, 655)], COLORS["blue"], 3, "/api HTTP:8000", (1600, 622))
    path(draw, [(1340, 702), (1340, 720)], COLORS["line"], 3, "static files", (1405, 707))

    # Backend data integrations, routed around boxes.
    path(draw, [(1840, 814), (1840, 925), (1365, 925), (1365, 955)], COLORS["green"], 3, "PostgreSQL TCP 5432", (1515, 865))
    path(draw, [(1910, 814), (1910, 955)], COLORS["green"], 3, "Redis TCP 6379", (1998, 875))
    path(draw, [(1695, 760), (1600, 760), (1600, 835), (900, 835), (900, 995)], COLORS["green"], 3, "S3 HTTP :9000", (1260, 785))
    path(draw, [(1060, 1324), (1135, 1324), (1135, 1190), (1690, 1190), (1690, 835)], COLORS["red"], 3, "GET /metrics", (1265, 1162))
    path(draw, [(2010, 1024), (2010, 1135), (1365, 1135), (1365, 1047)], COLORS["green"], 3, "Adminer -> PostgreSQL", (1705, 1105))

    # Config and storage.
    path(draw, [(1830, 814), (1830, 1232), (1370, 1232), (1370, 1260)], COLORS["line"], 3, "envFrom secrets", (1530, 1208))
    path(draw, [(1940, 814), (1940, 1210), (1745, 1210), (1745, 1260)], COLORS["line"], 3, "envFrom config", (1835, 1238))
    path(draw, [(895, 1067), (895, 1138), (2105, 1138), (2105, 1260)], COLORS["line"], 3, "PVC: object storage", (1110, 1112))
    path(draw, [(1365, 1047), (1365, 1166), (2105, 1166)], COLORS["line"], 3, "PVC: database", (1580, 1144))
    path(draw, [(1818, 1047), (1818, 1194), (2105, 1194)], COLORS["line"], 3, "PVC: cache", (1940, 1174))

    # CI/CD, kept outside the application traffic.
    path(draw, [(2595, 308), (2595, 480)], COLORS["orange"], 3, "GitLab job over HTTPS", (2665, 400))
    path(draw, [(2520, 560), (2520, 650)], COLORS["orange"], 3, "docker build/save", (2610, 610))
    path(draw, [(2400, 520), (2290, 520), (2290, 600), (2205, 600)], COLORS["orange"], 3, "kubectl apply / set image", (2295, 555))
    path(draw, [(2400, 690), (2250, 690), (2250, 715), (2205, 715)], COLORS["orange"], 3, "image import", (2310, 740))

    save(img, OUT / "jobability_deployment_diagram.png")


def main():
    render_class_diagram()
    render_deployment_diagram()


if __name__ == "__main__":
    main()
