from datetime import date
from fastapi import APIRouter
from fastapi.responses import Response
from app.api.errors import database_call
from app.repositories.operations import OperationsRepository
from app.repositories.menu_plans import MenuPlanRepository
from app.services.csv_reports import ReportCSVExporter
from app.services.pdf_reports import ReportPDFExporter
from app.schemas.operations import (
    InventoryMovementInput,
    DayClosingInput,
    CancellationInput,
)

router = APIRouter()


@router.post("/inventory/movements", status_code=201)
def inventory_movement(data: InventoryMovementInput):
    return database_call(OperationsRepository.movement, data)


@router.get("/inventory/movements")
def inventory_movements():
    return database_call(OperationsRepository.movements)


@router.post("/menu-plans/{plan_id}/close", status_code=201)
def close_day(plan_id: int, data: DayClosingInput):
    return database_call(OperationsRepository.close, plan_id, data)


@router.post("/menu-plans/{plan_id}/closing-preview")
def preview_closing(plan_id: int, data: DayClosingInput):
    return database_call(OperationsRepository.preview_closing, plan_id, data)


@router.get("/menu-plans/{plan_id}/closing")
def closing(plan_id: int):
    return database_call(OperationsRepository.closing, plan_id)


@router.post("/menu-plans/{plan_id}/cancel")
def cancel_plan(plan_id: int, data: CancellationInput):
    return database_call(OperationsRepository.cancel, plan_id, data)


@router.get("/menus/{menu_id}/forecast")
def forecast(menu_id: int, fecha: date):
    return database_call(OperationsRepository.forecast, menu_id, fecha)


@router.get("/reports/results")
def results(desde: date, hasta: date):
    return database_call(OperationsRepository.report, desde, hasta)


@router.get("/reports/results.csv")
def results_csv(desde: date, hasta: date):
    report = database_call(OperationsRepository.report, desde, hasta)
    return Response(
        ReportCSVExporter.results(report),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="resultados.csv"'},
    )


@router.get("/reports/results.pdf")
def results_pdf(desde: date, hasta: date):
    report = database_call(OperationsRepository.report, desde, hasta)
    return Response(
        ReportPDFExporter().results(report),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="resultados-{desde}-{hasta}.pdf"'
        },
    )


@router.get("/menu-plans/{plan_id}/report.pdf")
def plan_pdf(plan_id: int):
    plan = database_call(MenuPlanRepository.saved_menu_plan, plan_id)
    return Response(
        ReportPDFExporter().plan(plan),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="plan-menu-{plan["fecha"]}.pdf"'
        },
    )
