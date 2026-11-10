"""FastAPI routes for EDVR Nerfstudio / Gaussian Splatting reconstruction."""
from __future__ import annotations

import io
import os
import secrets
import zipfile
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

from services.reconstruction_service import (
    GENERATED_DIR,
    MAX_GAUSSIAN_PLY_BYTES,
    UPLOAD_DIR,
    complete_gaussian_job,
    create_reconstruction_job,
    get_job,
    get_room_images,
    mark_job_processing,
)

router = APIRouter(prefix="/reconstruction", tags=["3D Reconstruction"])


def verify_worker(x_worker_key: str = Header(default="")) -> None:
    """Require a worker key when configured; configure it before exposing the API."""
    expected = os.getenv("EDVR_WORKER_KEY", "").strip()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="EDVR_WORKER_KEY is not configured. Set it before enabling worker callbacks.",
        )
    if not secrets.compare_digest(x_worker_key, expected):
        raise HTTPException(status_code=403, detail="Invalid worker key")


@router.post("/start/{room_id}")
def start_reconstruction(room_id: UUID):
    """Create a job; GPU training is started from the free Colab notebook."""
    job = create_reconstruction_job(str(room_id))
    return {
        "success": True,
        **job,
        "next_step": (
            "Start the EDVR free-GPU notebook in Google Colab, enter this job_id, "
            "the public HTTPS API URL, and EDVR_WORKER_KEY. The notebook will fetch "
            "the dataset, train Splatfacto, and upload the resulting PLY."
        ),
    }


@router.get("/status/{job_id}")
def reconstruction_status(job_id: UUID):
    return get_job(str(job_id))


@router.get("/dataset/{room_id}")
def download_reconstruction_dataset(room_id: UUID):
    """Download original uploaded photos as a ZIP for the Colab notebook."""
    normalized = str(UUID(str(room_id)))
    images = get_room_images(UPLOAD_DIR / normalized)
    if len(images) < 2:
        raise HTTPException(status_code=400, detail="At least two room photos are required.")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for index, path in enumerate(images, start=1):
            archive.write(path, arcname=f"images/image_{index:04d}{path.suffix.lower()}")
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="edvr_{normalized}_photos.zip"'},
    )


@router.post("/worker/start/{job_id}", dependencies=[Depends(verify_worker)])
def worker_start(job_id: UUID):
    """Mark a job as processing when the user starts the Colab notebook."""
    return {"success": True, **mark_job_processing(str(job_id))}


@router.post("/result/{job_id}")
async def upload_gaussian_result(
    job_id: UUID,
    model: UploadFile = File(...),
    _: None = Depends(verify_worker),
):
    """Upload the room_gaussian.ply exported by Nerfstudio."""
    if not model.filename or Path(model.filename).suffix.lower() != ".ply":
        raise HTTPException(status_code=415, detail="Upload the Nerfstudio Gaussian .ply file.")
    content = await model.read(MAX_GAUSSIAN_PLY_BYTES + 1)
    await model.close()
    if len(content) > MAX_GAUSSIAN_PLY_BYTES:
        raise HTTPException(status_code=413, detail="Gaussian PLY exceeds the configured upload limit.")
    result = complete_gaussian_job(str(job_id), content)
    return {"success": True, **result}


@router.get("/model/{room_id}")
def get_generated_model(room_id: UUID):
    normalized = str(UUID(str(room_id)))
    model_path = Path(GENERATED_DIR).resolve() / normalized / "room_gaussian.ply"
    if not model_path.is_file():
        raise HTTPException(
            status_code=404,
            detail={
                "message": "Gaussian PLY was not found. Run the EDVR Colab workflow and upload the result.",
                "room_id": normalized,
                "expected_path": str(model_path),
            },
        )
    return FileResponse(
        path=str(model_path),
        media_type="application/octet-stream",
        filename="room_gaussian.ply",
        content_disposition_type="inline",
        headers={"Cache-Control": "no-store"},
    )
