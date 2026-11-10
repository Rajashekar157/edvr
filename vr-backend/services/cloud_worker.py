"""Compatibility shim: EDVR reconstruction is processed in the free Colab notebook.

The previous local COLMAP/OpenMVS worker is intentionally not started by the
Nerfstudio routes. Free Colab is a manually started, temporary GPU session.
"""
from __future__ import annotations

from services.reconstruction_service import get_job, fail_job


def process_job(job_id: str) -> dict:
    job = get_job(job_id)
    message = (
        "This job uses Nerfstudio Gaussian Splatting. Download its dataset ZIP, "
        "run the EDVR Colab notebook, and upload the exported PLY through "
        "POST /api/reconstruction/result/{job_id}."
    )
    return fail_job(job_id, message)
