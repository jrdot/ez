"""Compatibility entrypoint for `uvicorn main:app` from this directory."""

from backend.app import app

__all__ = ["app"]
