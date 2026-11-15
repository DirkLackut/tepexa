"""Spec 003: motor de rutas. Grillas sintéticas con respuesta conocida (CE-1..CE-4)."""
import math
import time

import numpy as np
import pytest

from app.contract import RouteParams, RouteProfile, WarningCode
from app.errors import ApiError
from app.routing import walking
from app.routing.engine import plan_routes
from app.routing.synthetic import example_terrain
from app.routing.terrain import Terrain

ALL = [RouteProfile.shortest, RouteProfile.fastest, RouteProfile.safest]


def params(**kw) -> RouteParams:
    base = dict(max_slope_deg=20, eva_time_limit_min=360, profiles=ALL, include_return=False,
                soft_soil_penalty=2.0, walking_model="tobler-eva-v1")
    base.update(kw)
    return RouteParams(**base)


def flat(n=21, cell=1.0, z=0.0) -> Terrain:
    return Terrain(z=np.full((n, n), z, dtype=float), cell_m=cell, dataset_version="test", is_example=True)


def route(routes, profile):
    return next(r for r in routes if r.profile == profile)


def path_xy(seg):
    return [(round(p[0], 6), round(p[1], 6)) for p in seg.polyline]


# ---------------------------------------------------------------- modelo de caminata
def test_walking_speed_is_two_kmh_on_flat_ground():
    assert walking.speed_kmh(0.0) == pytest.approx(2.0, abs=1e-3)


def test_walking_speed_peaks_on_gentle_downhill():
    peak = walking.speed_kmh(-0.05)
    assert peak > walking.speed_kmh(0.0) > walking.speed_kmh(0.2)
    assert peak > walking.speed_kmh(-0.2)


def test_defaults_cite_sources():
    assert walking.DEFAULT_MAX_SLOPE_DEG == 20
    assert walking.DEFAULT_EVA_TIME_LIMIT_MIN == 360
    assert all(s.startswith("https://") for s in walking.SOURCES.values())


# ---------------------------------------------------------------- CE-1: óptimo conocido
def test_straight_line_on_flat_ground():
    t = flat()
    r = route(plan_routes(t, (0, 0), [(20, 0)], params(profiles=[RouteProfile.shortest])), RouteProfile.shortest)
    assert r.outbound.metrics.distance_m == pytest.approx(20.0)
    assert path_xy(r.outbound)[0] == (0, 0) and path_xy(r.outbound)[-1] == (20, 0)


def test_diagonal_on_flat_ground():
    t = flat()
    r = plan_routes(t, (0, 0), [(10, 10)], params(profiles=[RouteProfile.shortest]))[0]
    assert r.outbound.metrics.distance_m == pytest.approx(10 * math.sqrt(2), abs=0.01)


def test_detours_around_nodata_through_the_gap():
    t = flat()
    t.z[:, 10] = np.nan          # muro de NoData en x = 10 …
    t.z[20, 10] = 0.0            # … con un hueco arriba (y = 20)
    r = plan_routes(t, (0, 0), [(20, 0)], params(profiles=[RouteProfile.shortest]))[0]
    pts = path_xy(r.outbound)
    assert (10, 20) in pts
    assert all(not (x == 10 and y != 20) for x, y in pts)
    # óptimo: dos tramos de (0,0)→(10,20)→(20,0), cada uno 10 diagonales + 10 rectos
    assert r.outbound.metrics.distance_m == pytest.approx(2 * (10 * math.sqrt(2) + 10), abs=0.01)


# ---------------------------------------------------------------- CE-3: pendiente máxima
def ridge_terrain(gap: bool) -> Terrain:
    t = flat(n=21, cell=10.0)
    t.z[:, 10] = 50.0            # cresta: subir 50 m en 10 m (78°) es intransitable
    if gap:
        t.z[18, 10] = 0.0
    return t


def test_route_respects_max_slope():
    t = ridge_terrain(gap=True)
    r = plan_routes(t, (0, 0), [(200, 0)], params())[0]
    assert r.outbound.metrics.max_slope_deg <= 20.0 + 1e-9
    assert (100.0, 180.0) in path_xy(r.outbound)


def test_no_route_when_ridge_is_closed():
    with pytest.raises(ApiError) as e:
        plan_routes(ridge_terrain(gap=False), (0, 0), [(200, 0)], params())
    assert e.value.status == 422 and e.value.body.error.code.value == "NO_ROUTE"


def test_nodata_point_is_rejected():
    t = flat()
    t.z[5, 5] = np.nan
    with pytest.raises(ApiError) as e:
        plan_routes(t, (5, 5), [(20, 0)], params())
    assert e.value.body.error.code.value == "NODATA"


def test_steep_but_allowed_segment_is_flagged():
    t = flat(n=11, cell=10.0)
    t.z = np.tile(np.arange(11, dtype=float) * 10 * math.tan(math.radians(17)), (11, 1))  # rampa de 17° al este
    r = plan_routes(t, (0, 0), [(100, 0)], params(profiles=[RouteProfile.shortest]))[0]
    assert r.outbound.metrics.max_slope_deg == pytest.approx(17.0, abs=0.01)
    assert WarningCode.STEEP_SEGMENT in [w.code for w in r.warnings]


# ---------------------------------------------------------------- CE-2: perfiles sobre el terreno de ejemplo
@pytest.fixture(scope="module")
def example_routes():
    t = example_terrain()
    return t, plan_routes(t, (400, 600), [(1400, 900), (2100, 1500), (3300, 1700)], params(include_return=True))


def test_profiles_keep_their_promise(example_routes):
    _, routes = example_routes
    s, f, a = (route(routes, p).outbound.metrics for p in ALL)
    assert s.distance_m <= f.distance_m + 1e-6 and s.distance_m <= a.distance_m + 1e-6
    assert f.est_duration_min <= s.est_duration_min + 1e-6 and f.est_duration_min <= a.est_duration_min + 1e-6
    assert a.soft_soil_m <= s.soft_soil_m + 1e-6 and a.soft_soil_m <= f.soft_soil_m + 1e-6


def test_profiles_differ_on_example_terrain(example_routes):
    _, routes = example_routes
    shapes = {tuple(path_xy(r.outbound)) for r in routes}
    assert len(shapes) >= 2


def test_legs_stop_at_each_target_in_order(example_routes):
    _, routes = example_routes
    stops = [(400, 600), (1400, 900), (2100, 1500), (3300, 1700)]
    for r in routes:
        pts = path_xy(r.outbound)
        assert [(l.from_index, l.to_index) for l in r.outbound.legs] == [(0, 1), (1, 2), (2, 3)]
        for leg in r.outbound.legs:
            assert pts[leg.vertex_start] == stops[leg.from_index]
            assert pts[leg.vertex_end] == stops[leg.to_index]
        assert r.outbound.legs[-1].vertex_end == len(pts) - 1
        assert sum(l.metrics.distance_m for l in r.outbound.legs) == pytest.approx(r.outbound.metrics.distance_m, abs=0.05)


def test_return_trip_goes_back_to_base(example_routes):
    _, routes = example_routes
    for r in routes:
        back = path_xy(r.return_trip)
        assert back[0] == (3300, 1700) and back[-1] == (400, 600)
        assert [(l.from_index, l.to_index) for l in r.return_trip.legs] == [(3, 0)]
        assert r.total.distance_m == pytest.approx(r.outbound.metrics.distance_m + r.return_trip.metrics.distance_m, abs=0.05)
        assert r.total.est_duration_min == pytest.approx(
            r.outbound.metrics.est_duration_min + r.return_trip.metrics.est_duration_min, abs=0.2)


def test_polyline_heights_come_from_the_terrain(example_routes):
    t, routes = example_routes
    for x, y, z in route(routes, RouteProfile.fastest).outbound.polyline:
        assert z == pytest.approx(t.height_at(x, y), abs=0.01)


def test_elevation_profile_matches_polyline(example_routes):
    _, routes = example_routes
    seg = route(routes, RouteProfile.safest).outbound
    assert len(seg.elevation_profile) == len(seg.polyline)
    assert seg.elevation_profile[0].s_m == 0
    assert seg.elevation_profile[-1].s_m == pytest.approx(seg.metrics.distance_m, abs=0.05)


def test_eva_limit_flag_and_warning():
    t = example_terrain()
    r = plan_routes(t, (400, 600), [(3300, 1700)],
                    params(profiles=[RouteProfile.fastest], include_return=True, eva_time_limit_min=10))[0]
    assert r.within_eva_limit is False
    assert WarningCode.EVA_LIMIT_EXCEEDED in [w.code for w in r.warnings]


def test_example_terrain_routes_are_labelled_as_example(example_routes):
    _, routes = example_routes
    for r in routes:
        codes = [w.code for w in r.warnings]
        assert WarningCode.EXAMPLE_DATA in codes and WarningCode.CONCEPTUAL_ONLY in codes


# ---------------------------------------------------------------- CE-4: tiempo
def test_three_profiles_with_return_in_under_three_seconds():
    t = example_terrain()
    t0 = time.perf_counter()
    plan_routes(t, (400, 600), [(1400, 900), (2100, 1500), (3300, 1700), (3500, 2600)], params(include_return=True))
    assert time.perf_counter() - t0 < 3.0


def test_graphs_are_reused_between_requests():
    t = example_terrain()
    p = params(include_return=True)
    plan_routes(t, (400, 600), [(1400, 900)], p)
    n = len(t._graphs)
    t0 = time.perf_counter()
    plan_routes(t, (500, 500), [(3000, 2500)], p)
    assert len(t._graphs) == n  # mismos parámetros: no se reconstruye ningún grafo
    assert time.perf_counter() - t0 < 1.0


def test_window_search_falls_back_to_full_grid_for_long_detours():
    """D-35: si la única ruta sale de la ventana de búsqueda, se usa toda la región."""
    from app.routing import engine

    t = flat(n=201, cell=10.0)
    t.z[:, 100] = np.nan          # muro de NoData en x = 1000 m …
    t.z[195, 100] = 0.0           # … con el único paso arriba, en y = 1950 m (fuera del margen de 400 m)
    r = plan_routes(t, (900, 0), [(1100, 0)], params(profiles=[RouteProfile.shortest]))[0]
    assert (1000.0, 1950.0) in path_xy(r.outbound)
    assert engine._window(t, [t.node(900, 0), t.node(1100, 0)]) is not None  # sí se intentó la ventana


def test_window_gives_same_route_as_full_search_on_example_terrain():
    from app.routing import engine

    t = example_terrain()
    p = params(include_return=True)
    stops = [t.node(400, 600), t.node(1400, 900), t.node(2100, 1500)]
    pairs = [(0, 1), (1, 2), (2, 0)]
    for prof in ALL:
        g = engine._graph(t, p, prof)
        full, _ = engine._dijkstra_paths(g, stops, pairs)
        assert engine._paths(t, g, stops, pairs, prof, p) == full
