"""Errores bilingües con códigos estables (RF-000-08)."""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .contract import ErrorBody, ErrorCode, ErrorResponse, LocalizedText


class ApiError(Exception):
    def __init__(self, status: int, code: ErrorCode, es: str, en: str, details: dict | None = None):
        self.status = status
        self.body = ErrorResponse(error=ErrorBody(code=code, message=LocalizedText(es=es, en=en), details=details))


def region_not_found(region_id: str) -> ApiError:
    return ApiError(404, ErrorCode.REGION_NOT_FOUND,
                    f"La región «{region_id}» no existe.", f"Region '{region_id}' does not exist.",
                    {"region_id": region_id})


def region_preview_only(region_id: str) -> ApiError:
    return ApiError(409, ErrorCode.REGION_PREVIEW_ONLY,
                    "Esta región es un avance de la próxima misión: no tiene capas, terreno 3D ni rutas.",
                    "This region is a preview of the next mission: it has no layers, 3D terrain or routes.",
                    {"region_id": region_id})


def out_of_bounds(point, bounds) -> ApiError:
    return ApiError(422, ErrorCode.OUT_OF_BOUNDS,
                    "Un punto está fuera del área con datos de la región.",
                    "A point lies outside the region's data coverage.",
                    {"point": list(point), "bounds": bounds.model_dump()})


def nodata(point) -> ApiError:
    return ApiError(422, ErrorCode.NODATA,
                    "Un punto cae donde no hay datos de elevación.",
                    "A point falls where there is no elevation data.",
                    {"point": [float(point[0]), float(point[1])]})


def no_route(profile: str, from_index: int, to_index: int, max_slope_deg: float) -> ApiError:
    return ApiError(422, ErrorCode.NO_ROUTE,
                    f"No hay ruta que respete la pendiente máxima de {max_slope_deg:g}° entre esos puntos.",
                    f"No route respects the {max_slope_deg:g}° maximum slope between those points.",
                    {"profile": profile, "from_index": from_index, "to_index": to_index,
                     "max_slope_deg": max_slope_deg})


def unknown_walking_model(name: str, supported: list[str]) -> ApiError:
    return ApiError(422, ErrorCode.BAD_REQUEST,
                    f"El modelo de caminata «{name}» no existe.", f"Walking model '{name}' does not exist.",
                    {"walking_model": name, "supported": supported})


def mission_not_found(mission_id: str) -> ApiError:
    return ApiError(404, ErrorCode.MISSION_NOT_FOUND,
                    f"La misión «{mission_id}» no existe.", f"Mission '{mission_id}' does not exist.",
                    {"mission_id": mission_id})


def dataset_unavailable() -> ApiError:
    return ApiError(503, ErrorCode.DATASET_UNAVAILABLE,
                    "Los datos reales todavía no están disponibles en este servidor.",
                    "Real data is not available on this server yet.")


def _json(status: int, body: ErrorResponse) -> JSONResponse:
    return JSONResponse(status_code=status, content=body.model_dump(mode="json"))


def install(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError):
        return _json(exc.status, exc.body)

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError):
        return _json(422, ErrorResponse(error=ErrorBody(
            code=ErrorCode.BAD_REQUEST,
            message=LocalizedText(es="La petición no tiene el formato esperado.",
                                  en="The request does not have the expected format."),
            details={"errors": [{"loc": list(e["loc"]), "msg": e["msg"]} for e in exc.errors()]},
        )))

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException):
        code = ErrorCode.BAD_REQUEST if exc.status_code < 500 else ErrorCode.INTERNAL
        return _json(exc.status_code, ErrorResponse(error=ErrorBody(
            code=code,
            message=LocalizedText(es="Recurso no disponible.", en="Resource not available."),
            details={"status": exc.status_code},
        )))
