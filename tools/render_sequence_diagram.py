from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path("docs/diagram_images")
PART_1_OUT = OUT_DIR / "jobability_sequence_diagram_part_1.png"
PART_2_OUT = OUT_DIR / "jobability_sequence_diagram_part_2.png"
COMBINED_OUT = OUT_DIR / "jobability_sequence_diagram.png"

WIDTH = 3600
BG = "#FFFFFF"
INK = "#111111"
LIFELINE = "#111111"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            pass
    return ImageFont.load_default()


F_FRAME = font(34)
F_FRAME_BOLD = font(34, True)
F_PARTICIPANT = font(34, True)
F_MESSAGE = font(30)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def dashed_line(
    draw: ImageDraw.ImageDraw,
    start: tuple[int, int],
    end: tuple[int, int],
    *,
    width: int = 3,
    dash: int = 15,
    gap: int = 12,
):
    x1, y1 = start
    x2, y2 = end
    length = math.hypot(x2 - x1, y2 - y1)
    if not length:
        return
    offset = 0.0
    while offset < length:
        segment_end = min(offset + dash, length)
        ax = x1 + (x2 - x1) * offset / length
        ay = y1 + (y2 - y1) * offset / length
        bx = x1 + (x2 - x1) * segment_end / length
        by = y1 + (y2 - y1) * segment_end / length
        draw.line((ax, ay, bx, by), fill=INK, width=width)
        offset += dash + gap


def arrow_head(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], *, filled: bool):
    sx, sy = start
    ex, ey = end
    angle = math.atan2(ey - sy, ex - sx)
    size = 23
    left = (ex - size * math.cos(angle - math.pi / 7), ey - size * math.sin(angle - math.pi / 7))
    right = (ex - size * math.cos(angle + math.pi / 7), ey - size * math.sin(angle + math.pi / 7))
    if filled:
        draw.polygon([end, left, right], fill=INK)
    else:
        draw.line((left, end, right), fill=INK, width=3)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, max_width: int) -> list[str]:
    lines: list[str] = []
    for raw_line in text.splitlines() or [""]:
        words = raw_line.split()
        if not words:
            lines.append("")
            continue
        current = words[0]
        for word in words[1:]:
            candidate = f"{current} {word}"
            if text_size(draw, candidate, F_MESSAGE)[0] <= max_width:
                current = candidate
            else:
                lines.append(current)
                current = word
        lines.append(current)
    return lines


def draw_centered_lines(
    draw: ImageDraw.ImageDraw,
    center_x: int,
    bottom_y: int,
    lines: list[str],
    *,
    fnt: ImageFont.FreeTypeFont = F_MESSAGE,
):
    line_gap = 5
    line_height = text_size(draw, "Ag", fnt)[1]
    total_height = len(lines) * line_height + max(0, len(lines) - 1) * line_gap
    max_width = max(text_size(draw, line, fnt)[0] for line in lines)
    x1 = max(8, center_x - max_width // 2 - 8)
    x2 = min(WIDTH - 8, center_x + max_width // 2 + 8)
    y1 = bottom_y - total_height - 4
    draw.rectangle((x1, y1, x2, bottom_y + 3), fill=BG)
    y = bottom_y - total_height
    for line in lines:
        width, _height = text_size(draw, line, fnt)
        x = min(max(12, center_x - width // 2), WIDTH - width - 12)
        draw.text((x, y), line, font=fnt, fill=INK)
        y += line_height + line_gap


def draw_frame(draw: ImageDraw.ImageDraw, height: int, title: str):
    draw.rectangle((4, 4, WIDTH - 5, height - 5), outline=INK, width=4)
    interaction_width = text_size(draw, "interaction", F_FRAME_BOLD)[0]
    title_width = text_size(draw, title, F_FRAME)[0]
    tab_width = interaction_width + title_width + 58
    tab_height = 104
    draw.polygon(
        [(4, 4), (tab_width, 4), (tab_width, tab_height - 32), (tab_width - 32, tab_height), (4, tab_height)],
        fill=BG,
        outline=INK,
    )
    draw.line(
        [(4, 4), (tab_width, 4), (tab_width, tab_height - 32), (tab_width - 32, tab_height), (4, tab_height)],
        fill=INK,
        width=4,
    )
    draw.text((18, 21), "interaction", font=F_FRAME_BOLD, fill=INK)
    draw.text((28 + interaction_width, 21), title, font=F_FRAME, fill=INK)


def draw_participants(
    draw: ImageDraw.ImageDraw,
    participants: list[dict[str, int | str]],
    lifeline_bottom: int,
):
    header_y = 155
    header_height = 118
    for participant in participants:
        x = int(participant["x"])
        lines = str(participant["label"]).split("\n")
        half_width = max(155, max(text_size(draw, line, F_PARTICIPANT)[0] for line in lines) // 2 + 26)
        draw.rectangle((x - half_width, header_y, x + half_width, header_y + header_height), fill=BG, outline=INK, width=3)
        line_height = text_size(draw, "Ag", F_PARTICIPANT)[1]
        y = header_y + (header_height - len(lines) * line_height - max(0, len(lines) - 1) * 4) // 2
        for line in lines:
            width, _height = text_size(draw, line, F_PARTICIPANT)
            draw.text((x - width // 2, y), line, font=F_PARTICIPANT, fill=INK)
            y += line_height + 4
        dashed_line(draw, (x, header_y + header_height), (x, lifeline_bottom), width=3, dash=14, gap=13)


def message_width(source_x: int, target_x: int) -> int:
    return max(310, min(920, abs(target_x - source_x) - 52))


def layout_messages(
    draw: ImageDraw.ImageDraw,
    participants: dict[str, int],
    messages: list[dict[str, object]],
) -> tuple[list[dict[str, object]], int]:
    y = 390
    layout: list[dict[str, object]] = []
    line_height = text_size(draw, "Ag", F_MESSAGE)[1]
    for number, message in enumerate(messages, 1):
        source_x = participants[str(message["source"])]
        target_x = participants[str(message["target"])]
        label = f"{number} : {message['label']}"
        lines = wrap_text(draw, label, message_width(source_x, target_x))
        label_height = len(lines) * line_height + max(0, len(lines) - 1) * 5
        y += max(112, label_height + 46)
        layout.append({**message, "number": number, "y": y, "lines": lines})
    return layout, y


def list_value(value: object | None) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    return [str(item) for item in value]


def draw_activations(
    draw: ImageDraw.ImageDraw,
    participants: dict[str, int],
    layout: list[dict[str, object]],
):
    starts: dict[str, tuple[str, int]] = {}
    spans: list[tuple[str, int, int]] = []
    for message in layout:
        y = int(message["y"])
        for activation in list_value(message.get("start")):
            starts[activation] = (str(message["target"]), y - 8)
        for activation in list_value(message.get("end")):
            participant, start_y = starts.pop(activation)
            spans.append((participant, start_y, y + 8))
    for participant, start_y in starts.values():
        spans.append((participant, start_y, int(layout[-1]["y"]) + 8))
    for participant, start_y, end_y in spans:
        x = participants[participant]
        draw.rectangle((x - 18, start_y, x + 18, end_y), fill=BG, outline=INK, width=3)


def draw_messages(
    draw: ImageDraw.ImageDraw,
    participants: dict[str, int],
    layout: list[dict[str, object]],
):
    for message in layout:
        source_x = participants[str(message["source"])]
        target_x = participants[str(message["target"])]
        y = int(message["y"])
        if message.get("kind") == "return":
            dashed_line(draw, (source_x, y), (target_x, y), width=3, dash=14, gap=11)
            arrow_head(draw, (source_x, y), (target_x, y), filled=False)
        else:
            draw.line((source_x, y, target_x, y), fill=INK, width=3)
            arrow_head(draw, (source_x, y), (target_x, y), filled=True)
        draw_centered_lines(draw, (source_x + target_x) // 2, y - 12, list(message["lines"]))


def render_part(title: str, participants: list[dict[str, int | str]], messages: list[dict[str, object]]) -> Image.Image:
    positions = {str(participant["id"]): int(participant["x"]) for participant in participants}
    scratch = Image.new("RGB", (WIDTH, 200), BG)
    scratch_draw = ImageDraw.Draw(scratch)
    layout, final_y = layout_messages(scratch_draw, positions, messages)
    height = final_y + 180

    img = Image.new("RGB", (WIDTH, height), BG)
    draw = ImageDraw.Draw(img)
    draw_frame(draw, height, title)
    draw_participants(draw, participants, height - 80)
    draw_activations(draw, positions, layout)
    draw_messages(draw, positions, layout)
    return img


def part_1() -> Image.Image:
    participants: list[dict[str, int | str]] = [
        {"id": "applicant", "label": "Соискатель", "x": 190},
        {"id": "applicant_frontend", "label": "Frontend\nсоискателя", "x": 720},
        {"id": "auth", "label": "Домен\nаутентификации", "x": 1310},
        {"id": "vacancy", "label": "Домен\nвакансий", "x": 1930},
        {"id": "application", "label": "Домен\nзаявок", "x": 2540},
        {"id": "line", "label": "Домен\nстрок заявки", "x": 3260},
    ]
    messages: list[dict[str, object]] = [
        {"source": "applicant", "target": "applicant_frontend", "label": "openLoginPage()", "start": "frontend_login"},
        {"source": "applicant_frontend", "target": "auth", "label": "POST /api/users/login/ (username, password)", "start": "auth_login"},
        {"source": "auth", "target": "applicant_frontend", "label": "200 OK (session, userId, role=applicant)", "kind": "return", "end": "auth_login"},
        {"source": "applicant_frontend", "target": "auth", "label": "GET /api/users/me/ (session)", "start": "auth_me"},
        {"source": "auth", "target": "applicant_frontend", "label": "200 OK (currentUser)", "kind": "return", "end": ["auth_me", "frontend_login"]},
        {"source": "applicant", "target": "applicant_frontend", "label": "openServicesList(filters)", "start": "frontend_catalog"},
        {"source": "applicant_frontend", "target": "vacancy", "label": "GET /api/vacancies/ (filters, page)", "start": "vacancy_list"},
        {"source": "vacancy", "target": "applicant_frontend", "label": "200 OK (vacancies[])", "kind": "return", "end": "vacancy_list"},
        {"source": "applicant_frontend", "target": "application", "label": "GET /api/applications/cart/ (userId)", "start": "application_cart_empty"},
        {"source": "application", "target": "applicant_frontend", "label": "200 OK (draft=null, cartIcon=empty, linesCount=0)", "kind": "return", "end": ["application_cart_empty", "frontend_catalog"]},
        {"source": "applicant", "target": "applicant_frontend", "label": "addServiceToApplication(vacancyId)", "start": "frontend_add"},
        {"source": "applicant_frontend", "target": "line", "label": "POST /api/application-lines/ (vacancyId)", "start": "line_add"},
        {"source": "line", "target": "applicant_frontend", "label": "201 Created (applicationId, lineId, vacancyId)", "kind": "return", "end": "line_add"},
        {"source": "applicant_frontend", "target": "application", "label": "GET /api/applications/cart/ (userId)", "start": "application_cart_draft"},
        {"source": "application", "target": "applicant_frontend", "label": "200 OK (draftApplicationId, status=draft, lines[])", "kind": "return", "end": ["application_cart_draft", "frontend_add"]},
        {"source": "applicant", "target": "applicant_frontend", "label": "editDraftApplication(formData)", "start": "frontend_edit"},
        {"source": "applicant_frontend", "target": "application", "label": "PUT /api/applications/{id}/ (applicationId, applicantProfile, comment)", "start": "application_update"},
        {"source": "application", "target": "applicant_frontend", "label": "200 OK (applicationId, status=draft, updatedFields)", "kind": "return", "end": ["application_update", "frontend_edit"]},
        {"source": "applicant", "target": "applicant_frontend", "label": "formApplication(applicationId)", "start": "frontend_form"},
        {"source": "applicant_frontend", "target": "application", "label": "PUT /api/applications/{id}/form/ (applicationId)", "start": "application_form"},
        {"source": "application", "target": "applicant_frontend", "label": "200 OK (applicationId, status=pendingModeration)", "kind": "return", "end": ["application_form", "frontend_form"]},
    ]
    return render_part("Заявка соискателя. Часть 1", participants, messages)


def part_2() -> Image.Image:
    participants: list[dict[str, int | str]] = [
        {"id": "applicant", "label": "Соискатель", "x": 210},
        {"id": "applicant_frontend", "label": "Frontend\nсоискателя", "x": 790},
        {"id": "auth", "label": "Домен\nаутентификации", "x": 1450},
        {"id": "application", "label": "Домен\nзаявок", "x": 2130},
        {"id": "moderator_frontend", "label": "Frontend\nмодератора", "x": 2820},
        {"id": "moderator", "label": "Модератор", "x": 3380},
    ]
    messages: list[dict[str, object]] = [
        {"source": "applicant", "target": "applicant_frontend", "label": "openApplicationsPage()", "start": "frontend_list"},
        {"source": "applicant_frontend", "target": "application", "label": "GET /api/applications/ (owner=me, page)", "start": "application_list"},
        {"source": "application", "target": "applicant_frontend", "label": "200 OK (applications[], statusCounters)", "kind": "return", "end": ["application_list", "frontend_list"]},
        {"source": "moderator", "target": "moderator_frontend", "label": "openModeratorCabinet()", "start": "frontend_moderator_open"},
        {"source": "moderator_frontend", "target": "auth", "label": "POST /api/users/login/ (username, password)", "start": "auth_moderator"},
        {"source": "auth", "target": "moderator_frontend", "label": "200 OK (session, userId, role=moderator)", "kind": "return", "end": "auth_moderator"},
        {"source": "moderator_frontend", "target": "application", "label": "GET /api/applications/ (status=pendingModeration)", "start": "application_pending"},
        {"source": "application", "target": "moderator_frontend", "label": "200 OK (pendingApplications[])", "kind": "return", "end": ["application_pending", "frontend_moderator_open"]},
        {"source": "moderator", "target": "moderator_frontend", "label": "completeModeration(applicationId, decision)", "start": "frontend_moderator_complete"},
        {"source": "moderator_frontend", "target": "application", "label": "PUT /api/applications/{id}/moderate/ (applicationId, decision=approved, moderatorId)", "start": "application_moderate"},
        {"source": "application", "target": "moderator_frontend", "label": "200 OK (applicationId, status=completed, moderationResult)", "kind": "return", "end": ["application_moderate", "frontend_moderator_complete"]},
        {"source": "applicant", "target": "applicant_frontend", "label": "refreshApplications()", "start": "frontend_refresh"},
        {"source": "applicant_frontend", "target": "application", "label": "GET /api/applications/ (owner=me, includeCalculated=true)", "start": "application_calculated"},
        {"source": "application", "target": "applicant_frontend", "label": "200 OK (applications[], calculatedStatusCounters, totals)", "kind": "return", "end": ["application_calculated", "frontend_refresh"]},
    ]
    return render_part("Модерация и итоговый список. Часть 2", participants, messages)


def save(img: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)
    print(path)


def render():
    first = part_1()
    second = part_2()
    save(first, PART_1_OUT)
    save(second, PART_2_OUT)

    gap = 36
    combined = Image.new("RGB", (WIDTH, first.height + gap + second.height), BG)
    combined.paste(first, (0, 0))
    combined.paste(second, (0, first.height + gap))
    save(combined, COMBINED_OUT)


if __name__ == "__main__":
    render()
