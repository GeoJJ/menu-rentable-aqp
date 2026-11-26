"""Errores recuperables de fuentes, diferenciados de fallos del programa."""


class SourceError(Exception):
    """Identifica una lectura no fiable para conservar el último dato válido."""
