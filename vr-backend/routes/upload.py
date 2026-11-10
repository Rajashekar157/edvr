"""Room image upload endpoint for EDVR."""
from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from PIL import Image, UnidentifiedImageError

from services.reconstruction_service import (
    UPLOAD_DIR,
    SUPPORTED_IMAGE_EXTENSIONS,
    MAX_IMAGE_BYTES,
)

router = APIRouter(prefix="/rooms", tags=["Rooms"])
CHUNK_SIZE = 1024 * 1024
MINIMUM_IMAGE_COUNT = 1


@router.post("/upload")
async def upload_room(request: Request):
    """Accept multipart field names files, images, or file."""
    form = await request.form()
    uploads = []
    for field_name in ("files", "images", "file"):
        uploads.extend(form.getlist(field_name))
    uploads = [
        item for item in uploads
        if getattr(item, "filename", None) and callable(getattr(item, "read", None))
    ]
    if len(uploads) < MINIMUM_IMAGE_COUNT:
        raise HTTPException(status_code=400, detail="Upload at least one photograph of the room.")

    room_id = str(uuid.uuid4())
    room_dir = UPLOAD_DIR / room_id
    room_dir.mkdir(parents=True, exist_ok=False)
    saved_paths: list[Path] = []
    try:
        for index, upload in enumerate(uploads, start=1):
            suffix = Path(upload.filename).suffix.lower()
            if suffix not in SUPPORTED_IMAGE_EXTENSIONS:
                raise HTTPException(status_code=415, detail=f"Unsupported image format: {upload.filename}. Use JPG, JPEG, PNG or WEBP.")
            destination = room_dir / f"image_{index:04d}{suffix}"
            total = 0
            with destination.open("wb") as output:
                while True:
                    chunk = await upload.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    total += len(chunk)
                    if total > MAX_IMAGE_BYTES:
                        raise HTTPException(status_code=413, detail=f"{upload.filename} exceeds the 25 MB per-image limit.")
                    output.write(chunk)
            if total == 0:
                raise HTTPException(status_code=400, detail=f"{upload.filename} is empty.")
            try:
                with Image.open(destination) as image:
                    image.verify()
                with Image.open(destination) as image:
                    width, height = image.size
                    if width < 64 or height < 64:
                        raise HTTPException(status_code=400, detail=f"{upload.filename} has insufficient image resolution.")
            except (UnidentifiedImageError, OSError) as exc:
                raise HTTPException(status_code=400, detail=f"{upload.filename} is not a valid image.") from exc
            saved_paths.append(destination)
        return {
            "success": True,
            "message": f"{len(saved_paths)} room photograph(s) uploaded successfully.",
            "room_id": room_id,
            "image_count": len(saved_paths),
            "minimum_image_count": 2,
            "maximum_image_count": None,
            "reconstruction_mode": "nerfstudio_gaussian_splatting" if len(saved_paths) >= 2 else "awaiting_more_photos",
            "note": "For a usable room reconstruction, provide many overlapping views; one image cannot recover a full room.",
        }
    except Exception:
        shutil.rmtree(room_dir, ignore_errors=True)
        raise
    finally:
        for upload in uploads:
            try:
                await upload.close()
            except Exception:
                pass
