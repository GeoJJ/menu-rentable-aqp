"""Exportación PDF de planes y resultados ya calculados, sin acceso a la BD."""

import io
from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal
from html import escape
from pathlib import Path
from zoneinfo import ZoneInfo

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    LongTable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

FONT_DIR = Path(__file__).resolve().parents[1] / "assets" / "fonts"
for name, filename in (
    ("Archivo", "Archivo-Regular.ttf"),
    ("ArchivoBold", "Archivo-Bold.ttf"),
    ("ArchivoDisplay", "Archivo-Display.ttf"),
    ("Michroma", "Michroma-Regular.ttf"),
):
    pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / filename)))
pdfmetrics.registerFontFamily("Archivo", normal="Archivo", bold="ArchivoBold")

# Mismos colores que frontend/src/styles/theme.css. El PDF funciona sin el frontend.
PALETTE = {
    name: colors.HexColor(value)
    for name, value in {
        "background": "#f3f4f0",
        "surface": "#ffffff",
        "soft": "#f5f6f3",
        "text": "#20292a",
        "muted": "#596365",
        "line": "#dde2dd",
        "graphite": "#1b2426",
        "accent": "#b5402d",
        "accent_soft": "#fff1eb",
    }.items()
}
CONTENT_WIDTH = A4[0] - 80


class ReportPDFExporter:
    """Presenta capturas históricas y resultados; no recalcula ventas ni inventario."""

    @staticmethod
    def _money(value):
        return f"S/ {Decimal(value):,.2f}"

    @staticmethod
    def _quantity(value):
        quantity = Decimal(value)
        if 0 < quantity < Decimal("0.0001"):
            return "< 0.0001"
        quantity = quantity.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        return (
            format(quantity, "f").rstrip("0").rstrip(".")
            if quantity % 1
            else str(int(quantity))
        )

    @staticmethod
    def _date(value):
        return (
            str(value)[:10].split("-")[2]
            + "/"
            + str(value)[:10].split("-")[1]
            + "/"
            + str(value)[:10].split("-")[0]
        )

    def __init__(self):
        body = ParagraphStyle(
            "body",
            fontName="Archivo",
            fontSize=9,
            leading=13,
            spaceAfter=7,
            textColor=PALETTE["text"],
        )
        self.styles = {
            "title": ParagraphStyle(
                "title",
                parent=body,
                fontName="ArchivoDisplay",
                fontSize=24,
                leading=27,
                spaceAfter=11,
            ),
            "heading": ParagraphStyle(
                "heading",
                parent=body,
                fontName="ArchivoBold",
                fontSize=11,
                leading=15,
                spaceBefore=13,
                spaceAfter=8,
                keepWithNext=True,
            ),
            "body": body,
            "menu_title": ParagraphStyle(
                "menu_title",
                parent=body,
                fontName="ArchivoBold",
                fontSize=12,
                leading=16,
                spaceBefore=10,
                spaceAfter=4,
                keepWithNext=True,
            ),
            "small": ParagraphStyle(
                "small",
                parent=body,
                fontSize=8,
                leading=11,
                spaceAfter=7,
                textColor=PALETTE["muted"],
            ),
            "cell": ParagraphStyle(
                "cell",
                parent=body,
                fontSize=8.5,
                leading=11.5,
                spaceAfter=0,
            ),
            "head": ParagraphStyle(
                "head",
                parent=body,
                fontName="ArchivoBold",
                fontSize=8,
                leading=11,
                textColor=colors.white,
                spaceAfter=0,
            ),
            "number": ParagraphStyle(
                "number",
                parent=body,
                fontSize=8.5,
                leading=11.5,
                alignment=TA_RIGHT,
                spaceAfter=0,
            ),
            "eyebrow": ParagraphStyle(
                "eyebrow",
                parent=body,
                fontName="ArchivoBold",
                fontSize=7.5,
                leading=10,
                textColor=PALETTE["accent"],
                spaceAfter=7,
            ),
            "metric_label": ParagraphStyle(
                "metric_label",
                parent=body,
                fontSize=8,
                leading=11,
                textColor=PALETTE["muted"],
                spaceAfter=7,
            ),
            "metric_value": ParagraphStyle(
                "metric_value",
                parent=body,
                fontName="ArchivoDisplay",
                fontSize=18,
                leading=22,
                spaceAfter=0,
            ),
            "course": ParagraphStyle(
                "course",
                parent=body,
                fontName="ArchivoBold",
                fontSize=9,
                leading=12,
                spaceAfter=0,
            ),
        }
        self.styles["number_accent"] = ParagraphStyle(
            "number_accent",
            parent=self.styles["number"],
            fontName="ArchivoBold",
            textColor=PALETTE["accent"],
        )
        self.styles["metric_accent"] = ParagraphStyle(
            "metric_accent",
            parent=self.styles["metric_value"],
            textColor=PALETTE["accent"],
        )

    def _p(self, value, style="body"):
        return Paragraph(escape(str(value)).replace("\n", "<br/>"), self.styles[style])

    def _table(self, headers, rows, widths, numeric=(), emphasis=()):
        data = [[self._p(v, "head") for v in headers]]
        data.extend(
            [
                [
                    self._p(
                        v,
                        (
                            "number_accent"
                            if index in emphasis
                            else "number" if index in numeric else "cell"
                        ),
                    )
                    for index, v in enumerate(row)
                ]
                for row in rows
            ]
        )
        widths = [width * CONTENT_WIDTH / sum(widths) for width in widths]
        table = LongTable(
            data,
            colWidths=widths,
            repeatRows=1,
            hAlign="LEFT",
            cornerRadii=[5, 5, 5, 5],
        )
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), PALETTE["graphite"]),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [PALETTE["surface"], PALETTE["soft"]],
                    ),
                    ("LINEBELOW", (0, 0), (-1, 0), 1.4, PALETTE["accent"]),
                    ("LINEBELOW", (0, 1), (-1, -1), 0.3, PALETTE["line"]),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        return table

    def _cards(self, items, *, courses=False):
        """Paneles de cifras o componentes, como los del resumen de la web."""
        gap = 8
        width = (CONTENT_WIDTH - gap * (len(items) - 1)) / len(items)
        cells, widths = [], []
        for index, (label, value) in enumerate(items):
            style = (
                "course"
                if courses
                else "metric_accent" if index == len(items) - 1 else "metric_value"
            )
            card = Table(
                [[[self._p(label, "metric_label"), self._p(value, style)]]],
                colWidths=[width],
                cornerRadii=[6, 6, 6, 6],
            )
            card.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), PALETTE["surface"]),
                        ("BOX", (0, 0), (-1, -1), 0.5, PALETTE["line"]),
                        ("LEFTPADDING", (0, 0), (-1, -1), 11),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 11),
                        ("TOPPADDING", (0, 0), (-1, -1), 6 if courses else 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6 if courses else 8),
                    ]
                )
            )
            if cells:
                cells.append("")
                widths.append(gap)
            cells.append(card)
            widths.append(width)
        panel = Table([cells], colWidths=widths, hAlign="LEFT")
        panel.setStyle(
            TableStyle(
                [
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        return panel

    def _notice(self, text):
        panel = Table(
            [[self._p(text, "cell")]],
            colWidths=[CONTENT_WIDTH],
            hAlign="LEFT",
            cornerRadii=[5, 5, 5, 5],
        )
        panel.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), PALETTE["accent_soft"]),
                    ("LINEBEFORE", (0, 0), (0, -1), 2, PALETTE["accent"]),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        return panel

    @staticmethod
    def _brand(canvas):
        """Marca vectorial compartida con el símbolo de plato y cubiertos de la web."""
        canvas.saveState()
        canvas.translate(40, A4[1] - 50)
        canvas.setFillColor(PALETTE["accent"])
        canvas.roundRect(0, 0, 31, 33, 5, fill=1, stroke=0)
        canvas.translate(3, 2)
        canvas.scale(0.78, 0.78)
        canvas.setStrokeColor(colors.white)
        canvas.setLineWidth(1.7)
        canvas.setLineCap(1)
        canvas.circle(16, 16, 7.5, fill=0, stroke=1)
        for x1, y1, x2, y2 in [
            (4, 28, 4, 21),
            (7, 28, 7, 21),
            (4, 24, 7, 24),
            (5.5, 21, 5.5, 6),
            (27, 28, 27, 6),
        ]:
            canvas.line(x1, y1, x2, y2)
        blade = canvas.beginPath()
        blade.moveTo(27, 28)
        blade.curveTo(23, 24, 23, 18, 27, 18)
        canvas.drawPath(blade)
        canvas.restoreState()

    def _build(self, title, story):
        output = io.BytesIO()
        issued = datetime.now(ZoneInfo("America/Lima")).strftime("%d/%m/%Y %H:%M")

        def page_frame(canvas, document):
            canvas.saveState()
            canvas.setFillColor(PALETTE["background"])
            canvas.rect(0, 0, *A4, fill=1, stroke=0)
            canvas.setFillColor(PALETTE["graphite"])
            canvas.rect(0, A4[1] - 68, A4[0], 68, fill=1, stroke=0)
            self._brand(canvas)
            canvas.setFillColor(colors.white)
            canvas.setFont("Michroma", 10)
            canvas.drawString(82, A4[1] - 32, "MENÚRENTABLE")
            brand = canvas.beginText(83, A4[1] - 47)
            brand.setFont("Archivo", 6.5)
            brand.setCharSpace(2.6)
            brand.textOut("AREQUIPA")
            brand.setCharSpace(0)
            canvas.drawText(brand)
            canvas.setFont("Archivo", 7)
            canvas.drawRightString(A4[0] - 40, A4[1] - 35, "PLANIFICACIÓN Y RESULTADOS")
            canvas.setStrokeColor(PALETTE["line"])
            canvas.setLineWidth(0.5)
            canvas.line(40, 41, A4[0] - 40, 41)
            canvas.setFont("Archivo", 7)
            canvas.setFillColor(PALETTE["muted"])
            canvas.drawString(40, 27, f"Generado: {issued} | Hora de Perú")
            canvas.drawRightString(A4[0] - 40, 27, f"Página {document.page}")
            canvas.restoreState()

        document = SimpleDocTemplate(
            output,
            pagesize=A4,
            leftMargin=40,
            rightMargin=40,
            topMargin=84,
            bottomMargin=55,
            title=title,
            author="Menú Rentable AQP",
        )
        document.build(
            [
                self._p("DEL MENÚ A LOS RESULTADOS", "eyebrow"),
                self._p(title.upper(), "title"),
                *story,
            ],
            onFirstPage=page_frame,
            onLaterPages=page_frame,
        )
        return output.getvalue()

    def results(self, report):
        money = self._money
        story = [
            self._notice(
                f"Periodo: {self._date(report['desde'])} al {self._date(report['hasta'])}"
            ),
            Spacer(1, 10),
            self._p(
                f"Días cerrados: {report['dias_cerrados']} | Menús preparados: {report['preparadas']} | Vendidos: {report['vendidas']} | Sobrantes: {report['sobrantes']}"
            ),
            self._cards(
                [
                    ("Ingresos reales", money(report["ingreso_real"])),
                    [
                        "Ingredientes preparados",
                        money(report["costo_ingredientes_real"]),
                    ],
                    ["Margen del periodo", money(report["margen_real"])],
                ],
            ),
            Spacer(1, 9),
            self._p(f"Otros gastos declarados: {money(report['gastos_adicionales'])}."),
            self._p(report["nota"], "small"),
            self._p(
                "Solo incluye días cerrados. Las mermas de ingredientes se registran por separado en inventario y no se descuentan automáticamente de este margen.",
                "small",
            ),
        ]
        if not report["detalle"]:
            story.append(
                self._p("No hay cierres registrados en el periodo seleccionado.")
            )
        else:
            story.extend(
                [
                    self._p("Producción y ventas", "heading"),
                    self._table(
                        [
                            "Fecha",
                            "Menú",
                            "Planificados",
                            "Preparados",
                            "Vendidos",
                            "Sobrantes",
                        ],
                        [
                            [
                                self._date(r["fecha"]),
                                r["nombre_oferta"],
                                r["menus_planificados"],
                                r["preparadas"],
                                r["vendidas"],
                                r["sobrantes"],
                            ]
                            for r in report["detalle"]
                        ],
                        [70, 165, 70, 70, 70, 70],
                        numeric=(2, 3, 4, 5),
                    ),
                    self._p("Resultado económico por día", "heading"),
                    self._table(
                        [
                            "Fecha",
                            "Menú",
                            "Ingreso\nreal",
                            "Costo\ningredientes",
                            "Otros\ngastos",
                            "Margen",
                        ],
                        [
                            [
                                self._date(r["fecha"]),
                                r["nombre_oferta"],
                                money(r["ingreso_real"]),
                                money(r["costo_ingredientes_real"]),
                                money(r["gastos_adicionales"]),
                                money(r["margen_real"]),
                            ]
                            for r in report["detalle"]
                        ],
                        [70, 125, 80, 80, 80, 80],
                        numeric=(2, 3, 4, 5),
                        emphasis=(5,),
                    ),
                    self._p("Comparación con lo planificado", "heading"),
                    self._table(
                        [
                            "Fecha",
                            "Menú",
                            "Ingreso\nestimado",
                            "Ingreso\nreal",
                            "Costo\nestimado",
                            "Costo\nreal",
                        ],
                        [
                            [
                                self._date(r["fecha"]),
                                r["nombre_oferta"],
                                money(r["ingreso_estimado"]),
                                money(r["ingreso_real"]),
                                money(r["costo_estimado"]),
                                money(r["costo_ingredientes_real"]),
                            ]
                            for r in report["detalle"]
                        ],
                        [70, 125, 80, 80, 80, 80],
                        numeric=(2, 3, 4, 5),
                    ),
                ]
            )
        return self._build("Reporte de resultados", story)

    def plan(self, plan):
        money = self._money
        status = {
            "planificado": "Pendiente de cierre",
            "cerrado": "Cerrado",
            "cancelado": "Cancelado",
        }.get(plan.get("estado"), "Plan guardado")
        story = [
            self._notice(
                f"Plan N.º {plan['id']} | Versión: {plan.get('version', 1)} | Fecha: {self._date(plan['fecha'])} | Estado: {status}"
            ),
            self._p(plan["menu"]["nombre"], "menu_title"),
            self._p(
                f"Cantidad: {plan['cantidad']} menús | Precio único: {money(plan['menu']['precio_menu'])}"
            ),
            Spacer(1, 4),
            self._cards(
                [
                    ["Compra estimada", money(plan["compra"])],
                    [
                        "Costo de ingredientes",
                        money(plan["costo_ingredientes"]),
                    ],
                    [
                        "Margen estimado",
                        money(plan["margen_estimado"]),
                    ],
                ],
            ),
            Spacer(1, 9),
            self._p(
                f"Presupuesto para compras: {money(plan['presupuesto'])} | Ingreso estimado: {money(plan['ingreso_estimado'])}"
            ),
            Spacer(1, 4),
            self._cards(
                [
                    (r["categoria"].upper(), r["nombre"])
                    for r in sorted(
                        plan["componentes"],
                        key=lambda r: ["caldo", "segundo", "refresco"].index(
                            r["categoria"]
                        ),
                    )
                ],
                courses=True,
            ),
            self._p("Lista de compras e ingredientes", "heading"),
            self._table(
                [
                    "Ingrediente",
                    "Unidad",
                    "Necesario",
                    "Faltante",
                    "Unidades a\ncomprar",
                    "Compra\nestimada",
                ],
                [
                    [
                        r["nombre"],
                        r["unidad"],
                        self._quantity(r["necesario"]),
                        self._quantity(r["faltante"]),
                        r["envases"],
                        money(r["compra"]),
                    ]
                    for r in plan["insumos"]
                ],
                [140, 55, 70, 70, 85, 95],
                numeric=(2, 3, 4, 5),
            ),
            Spacer(1, 6),
            self._p(
                "Valores históricos del plan: no se reemplazan por el catálogo actual. Las compras se estiman en presentaciones de 1 kg, 1 L o 1 unidad. Las cantidades se muestran con hasta 4 decimales. No confirma compras ni ventas reales.",
                "small",
            ),
            self._p(
                "El ingreso estimado supone vender todos los menús. El margen solo descuenta ingredientes; no equivale a utilidad neta.",
                "small",
            ),
        ]
        return self._build("Plan y lista de compras", story)
