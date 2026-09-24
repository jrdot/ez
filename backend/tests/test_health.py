from fastapi.testclient import TestClient

from backend.app import create_app


def test_health_returns_ok() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_contract_is_published_in_openapi() -> None:
    with TestClient(create_app()) as client:
        document = client.get("/openapi.json").json()

    operation = document["paths"]["/api/health"]["get"]
    assert operation["tags"] == ["system"]
    assert operation["responses"]["200"]["content"]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/HealthResponse"
    }
