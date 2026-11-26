"""Exportación PDF de planes y resultados ya calculados, sin acceso a la BD."""

import io
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from html import escape
from pathlib import Path
from zoneinfo import ZoneInfo

import reportlab
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    LongTable,
    TableStyle,
    CondPageBreak,
)

FONT_DIR = Path(reportlab.__file__).parent / "fonts"
pdfmetrics.registerFont(TTFont("ReportVera", str(FONT_DIR / "Vera.ttf")))
pdfmetrics.registerFont(TTFont("ReportVeraBold", str(FONT_DIR / "VeraBd.ttf")))
pdfmetrics.registerFontFamily("ReportVera", normal="ReportVera", bold="ReportVeraBold")


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
        self.styles = {
            "title": ParagraphStyle(
                "title",
                fontName="ReportVeraBold",
                fontSize=21,
                leading=27,
                spaceAfter=13,
                textColor=colors.HexColor("#3F4B2C"),
            ),
            "heading": ParagraphStyle(
                "heading",
                fontName="ReportVeraBold",
                fontSize=11,
                leading=15,
                spaceBefore=15,
                spaceAfter=8,
                keepWithNext=False,
            ),
            "body": ParagraphStyle(
                "body", fontName="ReportVera", fontSize=9, leading=13, spaceAfter=7
            ),
            "small": ParagraphStyle(
                "small",
                fontName="ReportVera",
                fontSize=8,
                leading=11,
                spaceAfter=7,
                textColor=colors.HexColor("#555555"),
            ),
            "cell": ParagraphStyle(
                "cell", fontName="ReportVera", fontSize=8, leading=11
            ),
            "head": ParagraphStyle(
                "head", fontName="ReportVeraBold", fontSize=8, leading=11
            ),
            "number": ParagraphStyle(
                "number",
                fontName="ReportVera",
                fontSize=8,
                leading=11,
                alignment=TA_RIGHT,
            ),
        }

    def _p(self, value, style="body"):
        return Paragraph(escape(str(value)).replace("\n", "<br/>"), self.styles[style])

    def _table(self, headers, rows, widths, numeric=()):
        data = [[self._p(v, "head") for v in headers]]
        data.extend(
            [
                [
                    self._p(v, "number" if index in numeric else "cell")
                    for index, v in enumerate(row)
                ]
                for row in rows
            ]
        )
        table = LongTable(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E9E5D8")),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.HexColor("#FAF8F2")],
                    ),
                    ("LINEBELOW", (0, 0), (-1, 0), 0.6, colors.HexColor("#9EAA80")),
                    ("LINEBELOW", (0, 1), (-1, -1), 0.25, colors.HexColor("#DDD7CB")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            )
        )
        return table

    def _build(self, title, story):
        output = io.BytesIO()
        issued = datetime.now(ZoneInfo("America/Lima")).strftime("%d/%m/%Y %H:%M")

        def footer(canvas, document):
            canvas.saveState()
            canvas.setFont("ReportVera", 7)
            canvas.setFillColor(colors.HexColor("#666666"))
            canvas.drawString(40, 25, f"Menú Rentable AQP | Generado: {issued} (Lima)")
            canvas.drawRightString(A4[0] - 40, 25, f"Página {document.page}")
            canvas.restoreState()

        document = SimpleDocTemplate(
            output,
            pagesize=A4,
            leftMargin=40,
            rightMargin=40,
            topMargin=38,
            bottomMargin=45,
            title=title,
            author="Menú Rentable AQP",
        )
        flow = []
        for item in story:
            if isinstance(item, Paragraph) and item.style.name == "heading":
                flow.append(CondPageBreak(160))
            flow.append(item)
        document.build(
            [self._p("MENÚ RENTABLE AQP", "small"), self._p(title, "title"), *flow],
            onFirstPage=footer,
            onLaterPages=footer,
        )
        return output.getvalue()

    def results(self, report):
        money = self._money
        story = [
            self._p(
                f"Periodo: {self._date(report['desde'])} al {self._date(report['hasta'])}"
            ),
            self._p(
                f"Días cerrados: {report['dias_cerrados']} | Menús preparados: {report['preparadas']} | Vendidos: {report['vendidas']} | Sobrantes: {report['sobrantes']}"
            ),
            self._table(
                ["Resumen del periodo", "Importe"],
                [
                    ["Ingresos reales", money(report["ingreso_real"])],
                    [
                        "Costo de ingredientes preparados",
                        money(report["costo_ingredientes_real"]),
                    ],
                    ["Otros gastos declarados", money(report["gastos_adicionales"])],
                    ["Margen del periodo", money(report["margen_real"])],
                ],
                [350, 165],
                numeric=(1,),
            ),
            Spacer(1, 9),
            self._p(report["nota"], "small"),
            self._p(
                "Solo incluye días cerrados. Las mermas de ingredientes se registran por separado en inventario y no se descuentan automáticamente de este margen.",
                "small",
            ),
        ]
        if not report["detalle"]:
            story.append(
                self._p(
                    "No hay cierres registrados en el periodo seleccionado. No se han sustituido por datos de ejemplo."
                )
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
            self._p(
                f"Plan N.º {plan['id']} | Fecha: {self._date(plan['fecha'])} | Estado: {status}"
            ),
            self._p(plan["menu"]["nombre"], "heading"),
            self._p(
                f"Cantidad: {plan['cantidad']} menús | Precio único: {money(plan['menu']['precio_menu'])}"
            ),
            self._p("Composición del menú", "heading"),
            self._table(
                ["Componente", "Receta"],
                [
                    [r["categoria"].capitalize(), r["nombre"]]
                    for r in sorted(
                        plan["componentes"],
                        key=lambda r: ["caldo", "segundo", "refresco"].index(
                            r["categoria"]
                        ),
                    )
                ],
                [100, 415],
            ),
            self._p("Resumen de planificación", "heading"),
            self._table(
                ["Concepto", "Importe"],
                [
                    ["Presupuesto para compras", money(plan["presupuesto"])],
                    ["Compra estimada", money(plan["compra"])],
                    [
                        "Costo de ingredientes consumidos estimado",
                        money(plan["costo_ingredientes"]),
                    ],
                    ["Ingreso estimado", money(plan["ingreso_estimado"])],
                    [
                        "Margen estimado sobre ingredientes",
                        money(plan["margen_estimado"]),
                    ],
                ],
                [350, 165],
                numeric=(1,),
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
            Spacer(1, 10),
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
