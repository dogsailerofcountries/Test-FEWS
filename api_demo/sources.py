from dataclasses import dataclass


@dataclass(frozen=True)
class DataSource:
    key: str
    url: str
    source_type: str


SOURCES = {
    "stations": DataSource(
        "stations",
        "https://fews.ideam.gov.co/visorfews/descargas/ReporteTablaEstaciones.json",
        "geojson",
    ),
    "alerts_subzones": DataSource(
        "alerts_subzones",
        "https://fews.ideam.gov.co/visorfews/descargas/SZH_Alertas_Pobs.json",
        "geojson",
    ),
    "forecast_hq": DataSource(
        "forecast_hq",
        "https://fews.ideam.gov.co/visorfews/descargas/SeriesPronosticoHQ.csv",
        "csv",
    ),
    "reservoirs": DataSource(
        "reservoirs",
        "https://fews.ideam.gov.co/visorfews/descargas/SeriesEmbalses.csv",
        "csv",
    ),
}
