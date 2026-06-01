from pathlib import Path
from xml.sax.saxutils import escape


OUT = Path("docs/staruml/jobability_business_process.bpmn")

NS = {
    "bpmn": "http://www.omg.org/spec/BPMN/20100524/MODEL",
    "bpmndi": "http://www.omg.org/spec/BPMN/20100524/DI",
    "dc": "http://www.omg.org/spec/DD/20100524/DC",
    "di": "http://www.omg.org/spec/DD/20100524/DI",
}


def attrs(**kwargs):
    return " ".join(f'{k}="{escape(str(v))}"' for k, v in kwargs.items() if v is not None)


def bounds(x, y, w, h):
    return f'<dc:Bounds x="{x}" y="{y}" width="{w}" height="{h}"/>'


def shape(bpmn_id, x, y, w, h, is_horizontal=None):
    extra = "" if is_horizontal is None else f' isHorizontal="{str(is_horizontal).lower()}"'
    return (
        f'<bpmndi:BPMNShape id="{bpmn_id}_di" bpmnElement="{bpmn_id}"{extra}>'
        f"{bounds(x, y, w, h)}</bpmndi:BPMNShape>"
    )


def edge(flow_id, points):
    pts = "".join(f'<di:waypoint x="{x}" y="{y}"/>' for x, y in points)
    return f'<bpmndi:BPMNEdge id="{flow_id}_di" bpmnElement="{flow_id}">{pts}</bpmndi:BPMNEdge>'


def bpmn_node(node_type, node_id, name, incoming, outgoing):
    inc = "".join(f"<bpmn:incoming>{flow_id}</bpmn:incoming>" for flow_id in incoming)
    out = "".join(f"<bpmn:outgoing>{flow_id}</bpmn:outgoing>" for flow_id in outgoing)
    return f'<bpmn:{node_type} id="{node_id}" name="{escape(name)}">{inc}{out}</bpmn:{node_type}>'


def main():
    nodes = [
        ("Start_Process", "startEvent", "Нужно разместить вакансию", "Employer", 160, 170, 36, 36),
        ("Task_EmployerAuth", "userTask", "Регистрация / вход работодателя", "Employer", 255, 145, 165, 86),
        ("Task_OpenEmployerCabinet", "userTask", "Открыть кабинет работодателя", "Employer", 470, 145, 165, 86),
        ("Task_CreateVacancy", "userTask", "Заполнить вакансию и материалы", "Employer", 685, 145, 185, 86),
        ("Task_SubmitVacancy", "userTask", "Отправить вакансию на публикацию", "Employer", 925, 145, 180, 86),
        ("Task_ReadRejectReason", "userTask", "Получить причину отклонения", "Employer", 1530, 145, 175, 76),
        ("Task_ViewResponses", "userTask", "Открыть отклики на вакансии", "Employer", 3320, 145, 175, 86),
        ("Task_ReviewCandidate", "userTask", "Изучить заявку кандидата", "Employer", 3545, 145, 175, 86),
        ("Task_DecideCandidate", "userTask", "Принять решение по кандидату", "Employer", 3770, 145, 175, 86),

        ("Task_CheckEmployerRole", "serviceTask", "Проверить авторизацию и роль employer", "Service", 925, 350, 185, 82),
        ("Task_SavePendingVacancy", "serviceTask", "Сохранить вакансию со статусом PENDING", "Service", 1160, 350, 195, 82),
        ("Gateway_VacancyApproved", "exclusiveGateway", "Вакансия корректна?", "Service", 1425, 364, 54, 54),
        ("Task_RejectVacancy", "serviceTask", "Отклонить вакансию и записать причину", "Service", 1530, 455, 200, 76),
        ("End_RejectedVacancy", "endEvent", "Вакансия отклонена", "Service", 1810, 475, 36, 36),
        ("Task_PublishVacancy", "serviceTask", "Опубликовать вакансию APPROVED", "Service", 1530, 350, 185, 82),
        ("Task_ResetVacancyCache", "serviceTask", "Сбросить кеш каталога Redis", "Service", 1765, 350, 180, 82),
        ("Task_CheckApplicantRole", "serviceTask", "Проверить авторизацию и роль applicant", "Service", 2890, 350, 190, 82),
        ("Task_SaveApplicationDraft", "serviceTask", "Сохранить строки заявки и пересчитать сумму", "Service", 3130, 350, 210, 82),
        ("Task_FormApplication", "serviceTask", "Перевести заявку в статус FORMED", "Service", 3385, 350, 195, 82),
        ("Gateway_ResponseAccepted", "exclusiveGateway", "Кандидат подходит?", "Service", 4015, 364, 54, 54),
        ("Task_FinishApplication", "serviceTask", "Установить статус FINISHED", "Service", 4160, 320, 170, 72),
        ("Task_RejectApplication", "serviceTask", "Установить статус REJECTED", "Service", 4160, 435, 170, 72),
        ("Task_SaveFinalStatus", "serviceTask", "Сохранить итоговый статус заявки", "Service", 4380, 350, 190, 82),

        ("Task_BrowseVacancies", "userTask", "Открыть каталог вакансий", "Applicant", 1765, 610, 165, 82),
        ("Task_FilterVacancies", "userTask", "Найти и отфильтровать вакансии", "Applicant", 1980, 610, 180, 82),
        ("Task_OpenVacancy", "userTask", "Открыть карточку вакансии", "Applicant", 2210, 610, 170, 82),
        ("Task_ApplicantAuth", "userTask", "Регистрация / вход соискателя", "Applicant", 2430, 610, 175, 82),
        ("Task_AddVacancyToDraft", "userTask", "Добавить вакансию в черновик заявки", "Applicant", 2655, 610, 195, 82),
        ("Task_FillApplication", "userTask", "Заполнить профиль, контакты и письмо", "Applicant", 2895, 610, 200, 82),
        ("Task_SubmitApplication", "userTask", "Сформировать заявку", "Applicant", 3145, 610, 170, 82),
        ("Task_ViewFinalStatus", "userTask", "Посмотреть итоговый статус в кабинете", "Applicant", 4380, 610, 190, 82),
        ("End_Process", "endEvent", "Процесс завершен", "Applicant", 4625, 628, 36, 36),
    ]

    flows = [
        ("Flow_01", "Start_Process", "Task_EmployerAuth", ""),
        ("Flow_02", "Task_EmployerAuth", "Task_OpenEmployerCabinet", ""),
        ("Flow_03", "Task_OpenEmployerCabinet", "Task_CreateVacancy", ""),
        ("Flow_04", "Task_CreateVacancy", "Task_SubmitVacancy", ""),
        ("Flow_05", "Task_SubmitVacancy", "Task_CheckEmployerRole", ""),
        ("Flow_06", "Task_CheckEmployerRole", "Task_SavePendingVacancy", ""),
        ("Flow_07", "Task_SavePendingVacancy", "Gateway_VacancyApproved", ""),
        ("Flow_08", "Gateway_VacancyApproved", "Task_RejectVacancy", "нет"),
        ("Flow_09", "Task_RejectVacancy", "Task_ReadRejectReason", ""),
        ("Flow_10", "Task_ReadRejectReason", "End_RejectedVacancy", ""),
        ("Flow_11", "Gateway_VacancyApproved", "Task_PublishVacancy", "да"),
        ("Flow_12", "Task_PublishVacancy", "Task_ResetVacancyCache", ""),
        ("Flow_13", "Task_ResetVacancyCache", "Task_BrowseVacancies", "вакансия опубликована"),
        ("Flow_14", "Task_BrowseVacancies", "Task_FilterVacancies", ""),
        ("Flow_15", "Task_FilterVacancies", "Task_OpenVacancy", ""),
        ("Flow_16", "Task_OpenVacancy", "Task_ApplicantAuth", ""),
        ("Flow_17", "Task_ApplicantAuth", "Task_AddVacancyToDraft", ""),
        ("Flow_18", "Task_AddVacancyToDraft", "Task_FillApplication", ""),
        ("Flow_19", "Task_FillApplication", "Task_SubmitApplication", ""),
        ("Flow_20", "Task_SubmitApplication", "Task_CheckApplicantRole", ""),
        ("Flow_21", "Task_CheckApplicantRole", "Task_SaveApplicationDraft", ""),
        ("Flow_22", "Task_SaveApplicationDraft", "Task_FormApplication", ""),
        ("Flow_23", "Task_FormApplication", "Task_ViewResponses", "заявка сформирована"),
        ("Flow_24", "Task_ViewResponses", "Task_ReviewCandidate", ""),
        ("Flow_25", "Task_ReviewCandidate", "Task_DecideCandidate", ""),
        ("Flow_26", "Task_DecideCandidate", "Gateway_ResponseAccepted", ""),
        ("Flow_27", "Gateway_ResponseAccepted", "Task_FinishApplication", "да"),
        ("Flow_28", "Gateway_ResponseAccepted", "Task_RejectApplication", "нет"),
        ("Flow_29", "Task_FinishApplication", "Task_SaveFinalStatus", ""),
        ("Flow_30", "Task_RejectApplication", "Task_SaveFinalStatus", ""),
        ("Flow_31", "Task_SaveFinalStatus", "Task_ViewFinalStatus", ""),
        ("Flow_32", "Task_ViewFinalStatus", "End_Process", ""),
    ]

    lane_refs = {"Employer": [], "Service": [], "Applicant": []}
    for node_id, _node_type, _name, lane, *_ in nodes:
        lane_refs[lane].append(node_id)

    incoming = {node_id: [] for node_id, *_ in nodes}
    outgoing = {node_id: [] for node_id, *_ in nodes}
    for flow_id, src, dst, _name in flows:
        outgoing[src].append(flow_id)
        incoming[dst].append(flow_id)

    lanes = [
        ("Lane_Employer", "Работодатель", "Employer"),
        ("Lane_Service", "Сервис JobAbility", "Service"),
        ("Lane_Applicant", "Соискатель", "Applicant"),
    ]
    lane_xml = []
    for lane_id, lane_name, lane_key in lanes:
        refs = "".join(f"<bpmn:flowNodeRef>{node_id}</bpmn:flowNodeRef>" for node_id in lane_refs[lane_key])
        lane_xml.append(f'<bpmn:lane id="{lane_id}" name="{escape(lane_name)}">{refs}</bpmn:lane>')

    process_parts = [f'<bpmn:laneSet id="LaneSet_JobAbility">{"".join(lane_xml)}</bpmn:laneSet>']
    for node_id, node_type, name, _lane, *_ in nodes:
        process_parts.append(bpmn_node(node_type, node_id, name, incoming[node_id], outgoing[node_id]))
    for flow_id, src, dst, name in flows:
        process_parts.append(
            f'<bpmn:sequenceFlow id="{flow_id}" name="{escape(name)}" sourceRef="{src}" targetRef="{dst}"/>'
        )
    process_parts.append(
        '<bpmn:textAnnotation id="TextAnnotation_Description">'
        '<bpmn:text>Итоговый процесс JobAbility: работодатель публикует вакансию, сервис проверяет и размещает ее, '
        'соискатель выбирает вакансию и формирует заявку, работодатель рассматривает отклик, сервис фиксирует итоговый статус.</bpmn:text>'
        '</bpmn:textAnnotation>'
    )

    node_pos = {node_id: (x, y, w, h) for node_id, _type, _name, _lane, x, y, w, h in nodes}

    def right(node_id):
        x, y, w, h = node_pos[node_id]
        return x + w, y + h // 2

    def left(node_id):
        x, y, _w, h = node_pos[node_id]
        return x, y + h // 2

    def route(src, dst):
        sx, sy = right(src)
        dx, dy = left(dst)
        if abs(sy - dy) < 20:
            return [(sx, sy), (dx, dy)]
        mid_x = max(sx + 35, min(dx - 35, (sx + dx) // 2))
        return [(sx, sy), (mid_x, sy), (mid_x, dy), (dx, dy)]

    di_parts = [
        shape("Participant_JobAbility", 80, 90, 4620, 700),
        shape("Lane_Employer", 110, 90, 4590, 205, True),
        shape("Lane_Service", 110, 295, 4590, 285, True),
        shape("Lane_Applicant", 110, 580, 4590, 210, True),
        shape("TextAnnotation_Description", 155, 24, 980, 48),
    ]
    for node_id, _node_type, _name, _lane, x, y, w, h in nodes:
        di_parts.append(shape(node_id, x, y, w, h))
    for flow_id, src, dst, _name in flows:
        di_parts.append(edge(flow_id, route(src, dst)))

    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="{NS["bpmn"]}"
                  xmlns:bpmndi="{NS["bpmndi"]}"
                  xmlns:dc="{NS["dc"]}"
                  xmlns:di="{NS["di"]}"
                  id="Definitions_JobAbility"
                  targetNamespace="http://jobability.local/bpmn">
  <bpmn:collaboration id="Collaboration_JobAbility">
    <bpmn:participant id="Participant_JobAbility" name="JobAbility: трудоустройство людей с ограниченными возможностями" processRef="Process_JobAbilityEmployment"/>
  </bpmn:collaboration>
  <bpmn:process id="Process_JobAbilityEmployment" name="Итоговый бизнес-процесс JobAbility" isExecutable="false">
    <bpmn:documentation>Три дорожки: Работодатель, Сервис JobAbility, Соискатель. Процесс отражает реальные операции сайта: регистрация, вход, создание и модерация вакансии, поиск вакансии, формирование заявки, просмотр откликов и фиксация итогового статуса.</bpmn:documentation>
    {"".join(process_parts)}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_JobAbility">
    <bpmndi:BPMNPlane id="BPMNPlane_JobAbility" bpmnElement="Collaboration_JobAbility">
      {"".join(di_parts)}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
'''
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(xml, encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
