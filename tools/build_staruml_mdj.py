import json
from pathlib import Path


OUT = Path("docs/staruml/JobAbility_Diagrams.mdj")

counter = 0


def gid(prefix="JBA"):
    global counter
    counter += 1
    return f"{prefix}{counter:06d}"


def ref(value):
    return {"$ref": value}


def model_element(element_type, parent_id, name, **extra):
    return {
        "_type": element_type,
        "_id": gid("M"),
        "_parent": ref(parent_id),
        "name": name,
        "visibility": "public",
        **extra,
    }


def operation(parent_id, name):
    return {
        "_type": "UMLOperation",
        "_id": gid("OP"),
        "_parent": ref(parent_id),
        "name": name,
        "visibility": "public",
        "isStatic": False,
        "isLeaf": False,
        "isAbstract": False,
        "isQuery": False,
        "parameters": [],
    }


def uml_class(parent_id, name, operations, stereotype=None):
    class_id = gid("C")
    return {
        "_type": "UMLClass",
        "_id": class_id,
        "_parent": ref(parent_id),
        "name": name,
        "visibility": "public",
        "stereotype": stereotype,
        "attributes": [],
        "operations": [operation(class_id, op) for op in operations],
        "isAbstract": False,
        "isFinalSpecialization": False,
        "isLeaf": False,
        "isActive": False,
    }


def dependency(parent_id, source_id, target_id, name="uses"):
    return {
        "_type": "UMLDependency",
        "_id": gid("DEP"),
        "_parent": ref(parent_id),
        "name": name,
        "visibility": "public",
        "source": ref(source_id),
        "target": ref(target_id),
        "mapping": "",
    }


def base_view(view_type, parent_id, model_id, x, y, w, h, fill="#FFFFFF", line="#334155", font="#0F172A"):
    view = {
        "_type": view_type,
        "_id": gid("V"),
        "_parent": ref(parent_id),
        "visible": True,
        "enabled": True,
        "lineColor": line,
        "fillColor": fill,
        "fontColor": font,
        "font": "Arial;13;0",
        "parentStyle": False,
        "showShadow": False,
        "containerChangeable": False,
        "containerExtending": True,
        "left": x,
        "top": y,
        "width": w,
        "height": h,
        "autoResize": False,
        "subViews": [],
    }
    if model_id:
        view["model"] = ref(model_id)
    return view


def label(parent_id, model_id, text, x, y, w, h, visible=True, bold=False):
    return {
        "_type": "LabelView",
        "_id": gid("LBL"),
        "_parent": ref(parent_id),
        "model": ref(model_id) if model_id else None,
        "visible": visible,
        "enabled": True,
        "lineColor": "#FFFFFF",
        "fillColor": "#FFFFFF",
        "fontColor": "#0F172A",
        "font": f"Arial;13;{1 if bold else 0}",
        "parentStyle": True,
        "showShadow": False,
        "containerChangeable": False,
        "containerExtending": True,
        "left": x,
        "top": y,
        "width": w,
        "height": h,
        "autoResize": False,
        "text": text,
        "horizontalAlignment": 2,
        "verticalAlignment": 5,
    }


def note_view(parent_id, text, x, y, w, h, fill="#FFFFFF", line="#334155", font="#0F172A"):
    view = base_view("UMLNoteView", parent_id, None, x, y, w, h, fill, line, font)
    view["text"] = text
    view["wordWrap"] = True
    return view


def text_view(parent_id, text, x, y, w, h, font="#334155", bold=False):
    view = base_view("UMLTextView", parent_id, None, x, y, w, h, "#FFFFFF", "#FFFFFF", font)
    view["text"] = text
    view["wordWrap"] = True
    view["font"] = f"Arial;13;{1 if bold else 0}"
    return view


def class_view(parent_id, cls, x, y, w, fill="#FFFFFF", line="#2563EB"):
    ops = cls.get("operations", [])
    op_h = max(24, len(ops) * 18 + 10)
    h = 42 + op_h
    view_id = gid("CV")
    name_comp_id = gid("NC")
    attr_comp_id = gid("AC")
    op_comp_id = gid("OC")
    tpl_comp_id = gid("TC")

    stereotype_text = f"<<{cls['stereotype']}>>" if cls.get("stereotype") else ""
    stereotype_label = label(name_comp_id, cls["_id"], stereotype_text, x + 8, y + 6, w - 16, 14, bool(stereotype_text), False)
    name_label = label(name_comp_id, cls["_id"], cls["name"], x + 8, y + (20 if stereotype_text else 12), w - 16, 18, True, True)
    namespace_label = label(name_comp_id, cls["_id"], "", -300, -300, 0, 13, False)
    property_label = label(name_comp_id, cls["_id"], "", -300, -300, 0, 13, False)

    name_comp = {
        "_type": "UMLNameCompartmentView",
        "_id": name_comp_id,
        "_parent": ref(view_id),
        "model": ref(cls["_id"]),
        "subViews": [stereotype_label, name_label, namespace_label, property_label],
        "visible": True,
        "enabled": True,
        "lineColor": line,
        "fillColor": fill,
        "fontColor": "#0F172A",
        "font": "Arial;13;0",
        "parentStyle": True,
        "showShadow": False,
        "containerChangeable": False,
        "containerExtending": True,
        "left": x,
        "top": y,
        "width": w,
        "height": 42,
        "autoResize": False,
        "stereotypeLabel": ref(stereotype_label["_id"]),
        "nameLabel": ref(name_label["_id"]),
        "namespaceLabel": ref(namespace_label["_id"]),
        "propertyLabel": ref(property_label["_id"]),
    }

    attr_comp = {
        "_type": "UMLAttributeCompartmentView",
        "_id": attr_comp_id,
        "_parent": ref(view_id),
        "model": ref(cls["_id"]),
        "visible": False,
        "enabled": True,
        "lineColor": line,
        "fillColor": fill,
        "fontColor": "#0F172A",
        "font": "Arial;13;0",
        "parentStyle": True,
        "showShadow": False,
        "containerChangeable": False,
        "containerExtending": True,
        "left": x,
        "top": y + 42,
        "width": w,
        "height": 0,
        "autoResize": False,
    }

    op_views = []
    top = y + 48
    for op in ops:
        op_views.append(
            {
                "_type": "UMLOperationView",
                "_id": gid("OV"),
                "_parent": ref(op_comp_id),
                "model": ref(op["_id"]),
                "visible": True,
                "enabled": True,
                "lineColor": line,
                "fillColor": fill,
                "fontColor": "#0F172A",
                "font": "Arial;11;0",
                "parentStyle": True,
                "showShadow": False,
                "containerChangeable": False,
                "containerExtending": True,
                "left": x + 8,
                "top": top,
                "width": w - 16,
                "height": 15,
                "autoResize": False,
                "underline": False,
                "text": f"+ {op['name']}",
                "horizontalAlignment": 0,
                "verticalAlignment": 5,
            }
        )
        top += 18

    op_comp = {
        "_type": "UMLOperationCompartmentView",
        "_id": op_comp_id,
        "_parent": ref(view_id),
        "model": ref(cls["_id"]),
        "subViews": op_views,
        "visible": True,
        "enabled": True,
        "lineColor": line,
        "fillColor": fill,
        "fontColor": "#0F172A",
        "font": "Arial;11;0",
        "parentStyle": True,
        "showShadow": False,
        "containerChangeable": False,
        "containerExtending": True,
        "left": x,
        "top": y + 42,
        "width": w,
        "height": op_h,
        "autoResize": False,
    }

    tpl_comp = {
        "_type": "UMLTemplateParameterCompartmentView",
        "_id": tpl_comp_id,
        "_parent": ref(view_id),
        "model": ref(cls["_id"]),
        "visible": False,
        "enabled": True,
        "lineColor": line,
        "fillColor": fill,
        "fontColor": "#0F172A",
        "font": "Arial;11;0",
        "parentStyle": True,
        "showShadow": False,
        "containerChangeable": False,
        "containerExtending": True,
        "left": -300,
        "top": -300,
        "width": 10,
        "height": 10,
        "autoResize": False,
    }

    view = base_view("UMLClassView", parent_id, cls["_id"], x, y, w, h, fill, line)
    view["_id"] = view_id
    view["subViews"] = [name_comp, attr_comp, op_comp, tpl_comp]
    view["stereotypeDisplay"] = "label"
    view["showVisibility"] = True
    view["showNamespace"] = False
    view["showProperty"] = False
    view["showType"] = True
    view["nameCompartment"] = ref(name_comp_id)
    view["wordWrap"] = True
    view["suppressAttributes"] = True
    view["suppressOperations"] = False
    view["showMultiplicity"] = True
    view["showOperationSignature"] = True
    view["attributeCompartment"] = ref(attr_comp_id)
    view["operationCompartment"] = ref(op_comp_id)
    view["templateParameterCompartment"] = ref(tpl_comp_id)
    return view


def edge_label(parent_id, model_id, edge_id, text, x, y):
    return {
        "_type": "EdgeLabelView",
        "_id": gid("EL"),
        "_parent": ref(parent_id),
        "model": ref(model_id),
        "visible": bool(text),
        "enabled": True,
        "lineColor": "#FFFFFF",
        "fillColor": "#FFFFFF",
        "fontColor": "#334155",
        "font": "Arial;11;0",
        "parentStyle": False,
        "showShadow": False,
        "containerChangeable": False,
        "containerExtending": True,
        "left": x,
        "top": y,
        "width": 180,
        "height": 18,
        "autoResize": False,
        "alpha": 0,
        "distance": 0,
        "hostEdge": ref(edge_id),
        "edgePosition": 1,
        "text": text,
        "horizontalAlignment": 2,
        "verticalAlignment": 5,
    }


def dependency_view(parent_id, dep, tail_view, head_view, label_text, points, line="#475569"):
    edge_id = gid("EV")
    label_x = int(sum(p[0] for p in points) / len(points))
    label_y = int(sum(p[1] for p in points) / len(points)) - 16
    label_v = edge_label(edge_id, dep["_id"], edge_id, label_text, label_x, label_y)
    return {
        "_type": "UMLDependencyView",
        "_id": edge_id,
        "_parent": ref(parent_id),
        "model": ref(dep["_id"]),
        "visible": True,
        "enabled": True,
        "lineColor": line,
        "fillColor": "#FFFFFF",
        "fontColor": "#334155",
        "font": "Arial;11;0",
        "parentStyle": False,
        "showShadow": False,
        "containerChangeable": False,
        "containerExtending": True,
        "head": ref(head_view["_id"]),
        "tail": ref(tail_view["_id"]),
        "lineStyle": 1,
        "points": ";".join(f"{x}:{y}" for x, y in points),
        "subViews": [label_v],
        "stereotypeDisplay": "label",
        "showProperty": False,
        "nameLabel": ref(label_v["_id"]),
    }


def node_or_component_view(view_type, parent_id, model_id, name, x, y, w, h, fill, line):
    view = base_view(view_type, parent_id, model_id, x, y, w, h, fill, line)
    view["stereotypeDisplay"] = "label"
    view["showVisibility"] = True
    view["showNamespace"] = False
    view["showProperty"] = False
    view["showType"] = True
    name_comp_id = gid("DNC")
    stereotype_label = label(name_comp_id, model_id, "", -300, -300, 0, 13, False)
    name_label = label(name_comp_id, model_id, name, x + 8, y + 10, w - 16, 18, True, True)
    namespace_label = label(name_comp_id, model_id, "", -300, -300, 0, 13, False)
    property_label = label(name_comp_id, model_id, "", -300, -300, 0, 13, False)
    name_comp = {
        "_type": "UMLNameCompartmentView",
        "_id": name_comp_id,
        "_parent": ref(view["_id"]),
        "model": ref(model_id),
        "subViews": [stereotype_label, name_label, namespace_label, property_label],
        "visible": True,
        "enabled": True,
        "lineColor": line,
        "fillColor": fill,
        "fontColor": "#0F172A",
        "font": "Arial;13;0",
        "parentStyle": True,
        "showShadow": False,
        "containerChangeable": False,
        "containerExtending": True,
        "left": x,
        "top": y,
        "width": w,
        "height": h,
        "autoResize": False,
        "stereotypeLabel": ref(stereotype_label["_id"]),
        "nameLabel": ref(name_label["_id"]),
        "namespaceLabel": ref(namespace_label["_id"]),
        "propertyLabel": ref(property_label["_id"]),
    }
    view["subViews"] = [name_comp]
    view["nameCompartment"] = ref(name_comp_id)
    return view


def build_class_diagram(model_id):
    diagram_id = gid("DIA")
    owned_elements = []
    views = [
        text_view(diagram_id, "JobAbility class diagram: pages -> frontend API clients -> backend API domains. Database models are hidden.", 30, 20, 1120, 30, "#1E40AF", True),
        text_view(diagram_id, "Frontend pages", 40, 58, 300, 24, "#1D4ED8", True),
        text_view(diagram_id, "Frontend API clients", 1050, 58, 280, 24, "#047857", True),
        text_view(diagram_id, "Backend API domains", 1430, 58, 300, 24, "#6D28D9", True),
    ]

    class_specs = [
        ("HomePage", "frontend page", ["renderWelcome()", "navigateToVacancies()"], 40, 100, "#EFF6FF", 265),
        ("VacanciesPage", "frontend page", ["fetchVacancies(filters)", "fetchApplicationCart()", "applyFilters()"], 40, 230, "#EFF6FF", 265),
        ("VacancyDetailPage", "frontend page", ["fetchVacancyById(id)", "addVacancyToApplication(id)"], 40, 390, "#EFF6FF", 265),
        ("LoginPage", "frontend page", ["loginUser(payload)"], 360, 100, "#EFF6FF", 265),
        ("RegisterPage", "frontend page", ["registerUser(payload)", "selectRole(role)"], 360, 215, "#EFF6FF", 265),
        ("ApplicationsPage", "frontend page", ["fetchApplications(filters)", "moderateApplication(id, action)"], 360, 365, "#EFF6FF", 265),
        ("ApplicationDetailPage", "frontend page", ["fetchApplicationById(id)", "updateApplication(id)", "updateApplicationLine(payload)", "deleteApplicationLine(vacancyId)", "formApplication(id)", "deleteApplication(id)"], 360, 525, "#EFF6FF", 300),
        ("ApplicantCabinetPage", "frontend page", ["fetchApplicantProfile()", "updateApplicantProfile(profile)", "changePassword(payload)"], 700, 100, "#EFF6FF", 285),
        ("EmployerCabinetPage", "frontend page", ["fetchEmployerCabinet()", "createEmployerVacancy(formData)"], 700, 280, "#EFF6FF", 285),
        ("EmployerResponsesPage", "frontend page", ["fetchEmployerResponses()"], 700, 430, "#EFF6FF", 285),
        ("ModeratorCabinetPage", "frontend page", ["fetchModeratorCabinet()", "moderateVacancy(id, action)", "moderateApplication(id, action)"], 700, 545, "#EFF6FF", 285),
        ("AuthApi", "frontend API client", ["getCurrentUser()", "loginUser()", "registerUser()", "logoutUser()", "changePassword()"], 1050, 100, "#ECFDF5", 290),
        ("VacancyApi", "frontend API client", ["fetchVacancies(filters)", "fetchVacancyById(id)"], 1050, 290, "#ECFDF5", 290),
        ("ApplicationApi", "frontend API client", ["fetchApplicationCart()", "addVacancyToApplication()", "fetchApplications()", "updateApplication()", "formApplication()", "moderateApplication()"], 1050, 450, "#ECFDF5", 290),
        ("CabinetApi", "frontend API client", ["fetchApplicantProfile()", "updateApplicantProfile()", "fetchEmployerCabinet()", "createEmployerVacancy()", "fetchModeratorCabinet()"], 1050, 700, "#ECFDF5", 290),
        ("AuthDomain", "backend API domain", ["POST /api/users/register/", "POST /api/users/login/", "POST /api/users/logout/", "GET /api/users/me/", "PUT /api/users/password/"], 1430, 100, "#F5F3FF", 315),
        ("VacancyDomain", "backend API domain", ["GET /api/vacancies/", "POST /api/vacancies/", "GET /api/vacancies/{id}/", "GET /api/vacancies/mine/", "GET /api/vacancies/pending/", "PUT /api/vacancies/{id}/moderate/"], 1430, 290, "#F5F3FF", 315),
        ("ApplicationDomain", "backend API domain", ["GET /api/applications/cart/", "GET /api/applications/", "GET /api/applications/{id}/", "PUT /api/applications/{id}/", "PUT /api/applications/{id}/form/", "PUT /api/applications/{id}/moderate/", "DELETE /api/applications/{id}/delete/"], 1430, 530, "#F5F3FF", 315),
        ("ProfileCabinetDomain", "backend API domain", ["GET /api/users/profile/", "PUT /api/users/profile/", "GET /api/applications/employer-responses/"], 1430, 820, "#F5F3FF", 315),
        ("SystemDomain", "backend API domain", ["GET /swagger/", "GET /api/schema/", "GET /metrics/", "GET /admin/"], 1430, 980, "#F5F3FF", 315),
    ]

    classes = {}
    class_views = {}
    for name, stereotype, ops, x, y, fill, width in class_specs:
        cls = uml_class(model_id, name, ops, stereotype)
        classes[name] = cls
        owned_elements.append(cls)
        line = "#2563EB" if "frontend" in stereotype else "#7C3AED"
        class_views[name] = class_view(diagram_id, cls, x, y, width, fill, line)
        views.append(class_views[name])

    dep_specs = [
        ("VacanciesPage", "VacancyApi", ""),
        ("VacanciesPage", "ApplicationApi", ""),
        ("VacancyDetailPage", "VacancyApi", ""),
        ("VacancyDetailPage", "ApplicationApi", ""),
        ("LoginPage", "AuthApi", ""),
        ("RegisterPage", "AuthApi", ""),
        ("ApplicationsPage", "ApplicationApi", ""),
        ("ApplicationDetailPage", "ApplicationApi", ""),
        ("ApplicantCabinetPage", "CabinetApi", ""),
        ("ApplicantCabinetPage", "AuthApi", ""),
        ("EmployerCabinetPage", "CabinetApi", ""),
        ("EmployerResponsesPage", "CabinetApi", ""),
        ("ModeratorCabinetPage", "CabinetApi", ""),
        ("ModeratorCabinetPage", "ApplicationApi", ""),
        ("AuthApi", "AuthDomain", "HTTP JSON"),
        ("VacancyApi", "VacancyDomain", "HTTP JSON"),
        ("ApplicationApi", "ApplicationDomain", "HTTP JSON"),
        ("CabinetApi", "ProfileCabinetDomain", "HTTP JSON"),
        ("CabinetApi", "VacancyDomain", "HTTP multipart"),
    ]

    bus_x = 1015
    for source, target, label_text in dep_specs:
        dep = dependency(model_id, classes[source]["_id"], classes[target]["_id"], label_text or "uses")
        owned_elements.append(dep)
        sv = class_views[source]
        tv = class_views[target]
        sy = sv["top"] + sv["height"] // 2
        ty = tv["top"] + tv["height"] // 2
        if source.endswith("Api"):
            points = [(sv["left"] + sv["width"], sy), (tv["left"], ty)]
        else:
            points = [(sv["left"] + sv["width"], sy), (bus_x, sy), (bus_x, ty), (tv["left"], ty)]
        views.append(dependency_view(diagram_id, dep, sv, tv, label_text, points))

    note = (
        "Frontend pages are grouped by scenario: public catalog, authentication, applicant cabinet, "
        "employer cabinet and moderation. Backend is shown as API domains only; database models are intentionally omitted."
    )
    views.append(note_view(diagram_id, note, 40, 900, 640, 86, "#F8FAFC", "#94A3B8", "#334155"))

    return {
        "diagram": {
            "_type": "UMLClassDiagram",
            "_id": diagram_id,
            "_parent": ref(model_id),
            "name": "01 Class Diagram - Frontend Backend API",
            "visible": True,
            "defaultDiagram": True,
            "ownedViews": views,
        },
        "elements": owned_elements,
    }


def build_deployment_diagram(model_id):
    diagram_id = gid("DIA")
    owned_elements = []
    views = [
        text_view(diagram_id, "JobAbility deployment diagram: public entry, k3s application pods, data services, monitoring and CI/CD.", 30, 20, 1120, 30, "#1E40AF", True)
    ]

    nodes = {}
    node_views = {}
    node_specs = [
        ("User device", "device", 40, 120, 230, 120, "#FFFFFF"),
        ("GitLab SaaS", "cloud node", 40, 700, 260, 140, "#FFF7ED"),
        ("Ubuntu VM 192.168.56.19", "execution environment", 340, 80, 1320, 780, "#F8FAFC"),
        ("k3s cluster: namespace jobability", "execution environment", 380, 145, 1215, 625, "#EEF2FF"),
        ("Entry layer", "node", 420, 210, 230, 120, "#FFFFFF"),
        ("frontend pod", "node", 720, 195, 250, 150, "#FFFFFF"),
        ("backend pod", "node", 1040, 190, 315, 160, "#FFFFFF"),
        ("MinIO pod", "node", 455, 425, 255, 145, "#ECFDF5"),
        ("PostgreSQL pod", "node", 785, 425, 250, 125, "#ECFDF5"),
        ("Redis pod", "node", 1105, 425, 220, 125, "#ECFDF5"),
        ("Monitoring", "node", 455, 620, 420, 110, "#FEF2F2"),
        ("Admin tools", "node", 940, 620, 230, 110, "#F1F5F9"),
        ("Configuration and volumes", "node", 1235, 600, 285, 140, "#FFFFFF"),
    ]
    for name, stereotype, x, y, w, h, fill in node_specs:
        node = model_element("UMLNode", model_id, name, stereotype=stereotype)
        nodes[name] = node
        owned_elements.append(node)
        nv = node_or_component_view("UMLNodeView", diagram_id, node["_id"], name, x, y, w, h, fill, "#475569")
        node_views[name] = nv
        views.append(nv)

    comps = {}
    comp_views = {}
    comp_specs = [
        ("Browser", "component", 75, 170, 160, 42, "#F8FAFC"),
        ("Repository + CI/CD pipeline", "component", 70, 750, 200, 46, "#FFEDD5"),
        ("GitLab Runner + Docker", "component", 375, 790, 230, 46, "#FFEDD5"),
        ("Traefik Ingress :80/:443", "component", 445, 260, 180, 42, "#E0F2FE"),
        ("Nginx static web server", "component", 745, 240, 200, 42, "#DBEAFE"),
        ("React SPA bundle", "artifact", 745, 292, 200, 38, "#DBEAFE"),
        ("Django REST API", "component", 1070, 235, 245, 42, "#DBEAFE"),
        ("Auth / Vacancy / Application API", "component", 1070, 290, 245, 42, "#DBEAFE"),
        ("MinIO S3 API :9000", "component", 480, 470, 205, 38, "#DCFCE7"),
        ("MinIO Console :30901", "component", 480, 515, 205, 36, "#DCFCE7"),
        ("PostgreSQL Service :5432", "component", 810, 470, 200, 42, "#DCFCE7"),
        ("Redis Service :6379", "component", 1130, 470, 170, 42, "#DCFCE7"),
        ("Prometheus :30900", "component", 485, 665, 160, 38, "#FEE2E2"),
        ("Grafana :30300", "component", 680, 665, 160, 38, "#FEE2E2"),
        ("Adminer :30092", "component", 970, 665, 170, 38, "#E2E8F0"),
        ("ConfigMap + Secrets", "artifact", 1265, 630, 220, 42, "#FFFFFF"),
        ("PVC: postgres, redis, minio, monitoring", "artifact", 1265, 690, 220, 42, "#FFFFFF"),
    ]
    for name, stereotype, x, y, w, h, fill in comp_specs:
        element_type = "UMLArtifact" if stereotype == "artifact" else "UMLComponent"
        comp = model_element(element_type, model_id, name, stereotype=stereotype)
        comps[name] = comp
        owned_elements.append(comp)
        view_type = "UMLArtifactView" if element_type == "UMLArtifact" else "UMLComponentView"
        cv = node_or_component_view(view_type, diagram_id, comp["_id"], name, x, y, w, h, fill, "#2563EB")
        comp_views[name] = cv
        views.append(cv)

    def midpoint(view, side):
        if side == "left":
            return (view["left"], view["top"] + view["height"] // 2)
        if side == "right":
            return (view["left"] + view["width"], view["top"] + view["height"] // 2)
        if side == "top":
            return (view["left"] + view["width"] // 2, view["top"])
        if side == "bottom":
            return (view["left"] + view["width"] // 2, view["top"] + view["height"])
        return (view["left"] + view["width"] // 2, view["top"] + view["height"] // 2)

    def add_connection(source, target, label_text, source_side="right", target_side="left", via=None):
        s_model = comps.get(source) or nodes.get(source)
        t_model = comps.get(target) or nodes.get(target)
        dep = dependency(model_id, s_model["_id"], t_model["_id"], label_text)
        owned_elements.append(dep)
        sv = comp_views.get(source) or node_views[source]
        tv = comp_views.get(target) or node_views[target]
        points = [midpoint(sv, source_side), *(via or []), midpoint(tv, target_side)]
        views.append(dependency_view(diagram_id, dep, sv, tv, label_text, points))

    add_connection("Browser", "Traefik Ingress :80/:443", "HTTP :80 / Cloudflare HTTPS tunnel")
    add_connection("Traefik Ingress :80/:443", "Nginx static web server", "HTTP Service frontend:80")
    add_connection("Nginx static web server", "React SPA bundle", "serves static files", "bottom", "top")
    add_connection("React SPA bundle", "Django REST API", "HTTP /api JSON", "right", "left", [(1000, 311)])
    add_connection("Nginx static web server", "MinIO S3 API :9000", "HTTP /media proxy", "bottom", "top", [(845, 390), (582, 390)])
    add_connection("Django REST API", "PostgreSQL Service :5432", "TCP PostgreSQL", "bottom", "top", [(1192, 395), (910, 395)])
    add_connection("Django REST API", "Redis Service :6379", "TCP Redis", "bottom", "top", [(1192, 395), (1215, 395)])
    add_connection("Django REST API", "MinIO S3 API :9000", "HTTPS S3 API", "bottom", "top", [(1192, 385), (582, 385)])
    add_connection("Django REST API", "ConfigMap + Secrets", "envFrom", "right", "left")
    add_connection("PostgreSQL Service :5432", "PVC: postgres, redis, minio, monitoring", "persistent volume", "right", "left", [(1120, 491), (1120, 711)])
    add_connection("Redis Service :6379", "PVC: postgres, redis, minio, monitoring", "persistent volume", "right", "left", [(1365, 491), (1365, 711)])
    add_connection("MinIO S3 API :9000", "PVC: postgres, redis, minio, monitoring", "persistent volume", "right", "left", [(1130, 489), (1130, 711)])
    add_connection("Prometheus :30900", "Django REST API", "GET /metrics", "top", "bottom", [(565, 590), (1192, 590)])
    add_connection("Grafana :30300", "Prometheus :30900", "HTTP datasource", "left", "right")
    add_connection("Adminer :30092", "PostgreSQL Service :5432", "TCP PostgreSQL", "top", "bottom")
    add_connection("Repository + CI/CD pipeline", "GitLab Runner + Docker", "GitLab job HTTPS")
    add_connection("GitLab Runner + Docker", "k3s cluster: namespace jobability", "kubectl apply / set image", "top", "bottom", [(490, 770)])

    note = (
        "Traffic path: browser -> Traefik -> frontend Nginx -> Django API. "
        "The backend works with PostgreSQL, Redis and MinIO; monitoring is separated from user traffic."
    )
    views.append(note_view(diagram_id, note, 40, 270, 250, 105, "#F8FAFC", "#94A3B8", "#334155"))

    return {
        "diagram": {
            "_type": "UMLDeploymentDiagram",
            "_id": diagram_id,
            "_parent": ref(model_id),
            "name": "03 Deployment Diagram - Kubernetes",
            "visible": True,
            "defaultDiagram": False,
            "ownedViews": views,
        },
        "elements": owned_elements,
    }


def build_project():
    project_id = gid("PROJ")
    model_id = gid("MODEL")
    class_part = build_class_diagram(model_id)
    deploy_part = build_deployment_diagram(model_id)
    model = {
        "_type": "UMLModel",
        "_id": model_id,
        "_parent": ref(project_id),
        "name": "JobAbility",
        "ownedElements": [
            class_part["diagram"],
            deploy_part["diagram"],
            *class_part["elements"],
            *deploy_part["elements"],
        ],
        "visibility": "public",
    }
    return {
        "_type": "Project",
        "_id": project_id,
        "name": "JobAbility Diagrams",
        "ownedElements": [model],
    }


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(build_project(), ensure_ascii=False, indent=2), encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
