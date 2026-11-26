"""Exportación CSV de los resultados ya calculados."""

import csv
import io


class ReportCSVExporter:
    @staticmethod
    def results(report):
        output = io.StringIO()
        keys = [
            "fecha",
            "nombre_oferta",
            "menus_planificados",
            "preparadas",
            "vendidas",
            "sobrantes",
            "ingreso_estimado",
            "ingreso_real",
            "costo_estimado",
            "costo_ingredientes_real",
            "gastos_adicionales",
            "margen_real",
        ]
        writer = csv.writer(output)
        writer.writerow(keys)
        for row in report["detalle"]:
            values = [row[k] for k in keys]
            writer.writerow(
                [
                    (
                        "'" + v
                        if isinstance(v, str)
                        and v.lstrip().startswith(("=", "+", "-", "@"))
                        else v
                    )
                    for v in values
                ]
            )
        return "\ufeff" + output.getvalue()
