"""Persistent job and model storage for EDVR Nerfstudio reconstruction."""
from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import HTTPException

CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parent.parent
APP_DIR = BACKEND_DIR / "app"
UPLOAD_DIR = APP_DIR / "uploads"
GENERATED_DIR = APP_DIR / "generated"
JOBS_DIR = APP_DIR / "jobs"

SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MINIMUM_IMAGE_COUNT = 2
MAXIMUM_IMAGE_COUNT = None
MAX_IMAGE_BYTES = 25 * 1024 * 1024
MAX_TOTAL_IMAGE_BYTES = int(os.getenv("EDVR_MAX_TOTAL_IMAGE_BYTES", str(800 * 1024 * 1024)))
MAX_GAUSSIAN_PLY_BYTES = int(os.getenv("EDVR_MAX_GAUSSIAN_PLY_BYTES", str(600 * 1024 * 1024)))

for directory in (UPLOAD_DIR, GENERATED_DIR, JOBS_DIR):
    directory.mkdir(parents=True, exist_ok=True)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_uuid(value: str, label: str) -> str:
    try:
        return str(UUID(str(value)))
    except (ValueError, TypeError, AttributeError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid {label}") from exc


def save_job(job: dict) -> None:
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    job_id = normalize_uuid(job.get("job_id"), "reconstruction job ID")
    target = JOBS_DIR / f"{job_id}.json"
    fd, temporary_name = tempfile.mkstemp(prefix=f"{job_id}_", suffix=".tmp", dir=str(JOBS_DIR))
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            json.dump(job, file, indent=2, ensure_ascii=False)
            file.flush()
            os.fsync(file.fileno())
        os.replace(temporary_path, target)
    except Exception:
        temporary_path.unlink(missing_ok=True)
        raise


def get_job(job_id: str) -> dict:
    normalized_id = normalize_uuid(job_id, "reconstruction job ID")
    job_path = JOBS_DIR / f"{normalized_id}.json"
    if not job_path.is_file():
        raise HTTPException(status_code=404, detail="Reconstruction job not found")
    try:
        job = json.loads(job_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        raise HTTPException(status_code=500, detail="Reconstruction job data could not be read") from exc
    if not isinstance(job, dict):
        raise HTTPException(status_code=500, detail="Reconstruction job data is invalid")
    return job


def get_room_images(room_folder: Path) -> list[Path]:
    if not room_folder.is_dir():
        raise HTTPException(status_code=404, detail="Uploaded room not found")
    return sorted(
        (p for p in room_folder.iterdir()
         if p.is_file() and p.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS),
        key=lambda p: p.name.lower(),
    )


def create_reconstruction_job(room_id: str) -> dict:
    room_uuid = normalize_uuid(room_id, "room ID")
    room_folder = UPLOAD_DIR / room_uuid
    images = get_room_images(room_folder)
    count = len(images)
    if count < MINIMUM_IMAGE_COUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Upload at least {MINIMUM_IMAGE_COUNT} overlapping photographs of the same room. Found {count}.",
        )

    total_bytes = 0
    for image in images:
        try:
            size = image.stat().st_size
        except OSError as exc:
            raise HTTPException(status_code=400, detail=f"Cannot read uploaded image {image.name}") from exc
        if size > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail=f"Image {image.name} exceeds 25 MB")
        total_bytes += size
    if total_bytes > MAX_TOTAL_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Total room photographs exceed the configured upload limit.")

    now = utc_now()
    job = {
        "job_id": str(uuid4()),
        "room_id": room_uuid,
        "status": "waiting_for_cloud",
        "engine": "nerfstudio_splatfacto",
        "accuracy_mode": "neural_radiance_field_gaussian_splatting",
        "output_format": "gaussian_ply",
        "image_count": count,
        "minimum_image_count": MINIMUM_IMAGE_COUNT,
        "maximum_image_count": None,
        "created_at": now,
        "updated_at": now,
        "message": "Photos validated. Start the EDVR Colab notebook to use a free GPU runtime.",
        "dataset_url": f"/api/reconstruction/dataset/{room_uuid}",
        "model_url": None,
        "error": None,
        "warnings": [
            "Gaussian PLY is a viewable 3D Gaussian scene, not a watertight mesh or editable GLB.",
            "Free Colab GPU availability and runtime duration are not guaranteed.",
            "Free Colab requires a user-started notebook session; this is not an unattended worker.",
        ],
    }
    save_job(job)
    return job


def mark_job_processing(job_id: str) -> dict:
    job = get_job(job_id)
    if job.get("status") not in {"waiting_for_cloud", "processing"}:
        raise HTTPException(status_code=409, detail=f"Job cannot start from status {job.get('status')}")
    job.update(
        status="processing",
        message="Cloud GPU notebook started. Nerfstudio is processing and training the Gaussian scene.",
        started_at=job.get("started_at") or utc_now(),
        updated_at=utc_now(),
        error=None,
    )
    save_job(job)
    return job


def complete_gaussian_job(job_id: str, content: bytes) -> dict:
    job = get_job(job_id)
    if job.get("status") not in {"waiting_for_cloud", "processing"}:
        raise HTTPException(status_code=409, detail=f"Job cannot be completed from status {job.get('status')}")
    if not isinstance(content, bytes) or len(content) < 64:
        raise HTTPException(status_code=400, detail="Gaussian PLY is empty or invalid.")
    if not (content.startswith(b"ply\n") or content.startswith(b"ply\r\n")):
        raise HTTPException(status_code=400, detail="Uploaded file is not a PLY file.")
    header_end = content.find(b"end_header")
    if header_end < 0 or header_end > 1024 * 1024:
        raise HTTPException(status_code=400, detail="PLY header is missing or invalid.")
    room_id = normalize_uuid(job["room_id"], "room ID")
    output_folder = GENERATED_DIR / room_id
    output_folder.mkdir(parents=True, exist_ok=True)
    output_path = output_folder / "room_gaussian.ply"
    fd, temporary_name = tempfile.mkstemp(prefix="room_gaussian_", suffix=".ply.tmp", dir=str(output_folder))
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(fd, "wb") as file:
            file.write(content)
            file.flush()
            os.fsync(file.fileno())
        os.replace(temporary_path, output_path)
    except Exception:
        temporary_path.unlink(missing_ok=True)
        raise

    now = utc_now()
    job.update({
        "status": "completed",
        "engine": "nerfstudio_splatfacto",
        "accuracy_mode": "neural_radiance_field_gaussian_splatting",
        "output_format": "gaussian_ply",
        "message": "Nerfstudio Gaussian scene uploaded and stored successfully.",
        "model_url": f"/api/reconstruction/model/{room_id}",
        "error": None,
        "completed_at": now,
        "updated_at": now,
        "model_size_bytes": output_path.stat().st_size,
    })
    save_job(job)
    return job


def fail_job(job_id: str, message: str) -> dict:
    job = get_job(job_id)
    job.update(status="failed", message=message, error=message, updated_at=utc_now())
    save_job(job)
    return job
