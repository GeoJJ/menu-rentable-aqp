# Fuentes de los reportes PDF

Archivo se usa en contenido (400), cifras y encabezados (700 y 800). Michroma se reserva para la marca, igual que en la web. Se incluyen las licencias SIL OFL y los créditos originales.

Los TTF son versiones estáticas de los mismos archivos latinos de `frontend/public/fonts/`: Archivo se instancia con ancho 100 y pesos 400, 700 y 800; Michroma se convierte de WOFF2 a TTF sin cambiar su diseño. La conversión se hizo con FontTools durante el desarrollo. La aplicación solo requiere ReportLab para incrustarlos; no descarga ni convierte fuentes al generar un PDF.

Estos archivos pertenecen al backend para que pueda funcionar y generar reportes sin depender de la carpeta del frontend.
