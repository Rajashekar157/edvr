"""
EDVR — Single-file room understanding + interior design preview engine.

Place this file at:
    vr-backend/app/services/room_design_engine.py

What it does:
- Validates room type, dimensions, colors, style and design options.
- Optionally detects common visible objects using Ultralytics YOLO (if installed
  and a model is configured). Detection is informational only: 2D detections
  are NOT converted into metric 3D positions.
- Recommends coordinated interior color palettes.
- Builds a procedural room shell, flooring, ceiling, doors/windows placeholders,
  furniture placeholders and lighting fixtures.
- Exports a valid GLB preview using trimesh.
- Exposes a FastAPI endpoint:
    POST /api/interior-design/rooms/{room_id}/preview

Install:
    pip install fastapi pydantic trimesh numpy pillow

Optional object detection:
    pip install ultralytics

Environment:
    EDVR_YOLO_MODEL=yolov8n.pt   # optional; downloads model on first use

IMPORTANT:
This is a configurable design-preview generator, not a photogrammetry system.
Room dimensions should be supplied by the client or measured separately.
Generated furniture is procedural placeholder geometry; replace it with licensed
high-quality GLB assets for production.
"""

from __future__ import annotations

import os
import logging
from pathlib import Path
from typing import Optional, Literal
from uuid import UUID

import numpy as np
import trimesh
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator


logger = logging.getLogger("edvr.room_design")

# ---------------------------------------------------------------------------
# Paths and router
# ---------------------------------------------------------------------------

CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parent.parent
APP_DIR = BACKEND_DIR / "app"
GENERATED_DIR = APP_DIR / "generated"
UPLOAD_DIR = APP_DIR / "uploads"

GENERATED_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/interior-design", tags=["AI Interior Design"])

# ---------------------------------------------------------------------------
# Design presets
# ---------------------------------------------------------------------------

STYLE_PALETTES = {
    "modern_luxury": {
        "wall": "#E8E0D4",
        "accent_wall": "#68745B",
        "floor": "#A9825B",
        "ceiling": "#F7F5F0",
        "furniture": "#B18A63",
        "fabric": "#D7C8B5",
        "metal": "#B99A62",
        "light": "#FFF0D6",
    },
    "minimalist": {
        "wall": "#E9E9E5",
        "accent_wall": "#B9B9B0",
        "floor": "#C5BBAA",
        "ceiling": "#FFFFFF",
        "furniture": "#B7A58E",
        "fabric": "#D9D6CE",
        "metal": "#777777",
        "light": "#F5F0E6",
    },
    "scandinavian": {
        "wall": "#F1EEE6",
        "accent_wall": "#D5DCCF",
        "floor": "#D6B88E",
        "ceiling": "#FFFFFF",
        "furniture": "#C49A6C",
        "fabric": "#E4DDD1",
        "metal": "#777D78",
        "light": "#FFF3DC",
    },
    "contemporary_indian": {
        "wall": "#E9DCC8",
        "accent_wall": "#8A5948",
        "floor": "#9A704F",
        "ceiling": "#F8F3E9",
        "furniture": "#80563C",
        "fabric": "#D8BFA1",
        "metal": "#A77B45",
        "light": "#FFE7C2",
    },
    "industrial": {
        "wall": "#AFAEAA",
        "accent_wall": "#55585A",
        "floor": "#77716A",
        "ceiling": "#D9D8D3",
        "furniture": "#594B40",
        "fabric": "#77716C",
        "metal": "#34383A",
        "light": "#F4DFC0",
    },
    "traditional": {
        "wall": "#E6D4B8",
        "accent_wall": "#79513E",
        "floor": "#8B5E3C",
        "ceiling": "#F5EBDD",
        "furniture": "#70452F",
        "fabric": "#B68A61",
        "metal": "#B28A4D",
        "light": "#FFE5BD",
    },
}

ROOM_FURNITURE = {
    "living_room": ["sofa", "coffee_table", "tv_unit", "side_table", "plant"],
    "bedroom": ["bed", "bedside_table", "wardrobe", "plant"],
    "dining_room": ["dining_table", "dining_chair", "sideboard", "plant"],
    "kitchen": ["kitchen_counter", "kitchen_island", "stool", "refrigerator"],
    "office": ["desk", "office_chair", "bookshelf", "plant"],
    "empty_room": [],
}

# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------

class RoomDesignRequest(BaseModel):
    room_type: Literal[
        "living_room", "bedroom", "dining_room", "kitchen", "office", "empty_room"
    ] = "living_room"

    style: Literal[
        "modern_luxury", "minimalist", "scandinavian",
        "contemporary_indian", "industrial", "traditional"
    ] = "modern_luxury"

    # Dimensions are in metres. They must be supplied/confirmed by the user.
    length: float = Field(default=5.0, gt=2.0, le=30.0)
    width: float = Field(default=4.0, gt=2.0, le=30.0)
    height: float = Field(default=3.0, gt=2.0, le=8.0)

    wall_color: Optional[str] = None
    accent_wall_color: Optional[str] = None
    floor_color: Optional[str] = None
    ceiling_color: Optional[str] = None

    include_ceiling: bool = True
    include_lighting: bool = True
    include_furniture: bool = True
    include_decor: bool = True
    accent_wall: bool = True

    furniture_scale: float = Field(default=1.0, ge=0.5, le=1.5)
    design_name: str = Field(default="EDVR Design", max_length=80)

    @field_validator(
        "wall_color", "accent_wall_color", "floor_color", "ceiling_color"
    )
    @classmethod
    def validate_hex_color(cls, value):
        if value is None:
            return value
        value = value.strip()
        if not value.startswith("#") or len(value) != 7:
            raise ValueError("Colors must use #RRGGBB format.")
        try:
            int(value[1:], 16)
        except ValueError as exc:
            raise ValueError("Invalid hexadecimal color.") from exc
        return value.upper()


# ---------------------------------------------------------------------------
# Color and material functions
# ---------------------------------------------------------------------------

def hex_rgba(value: str, alpha: int = 255) -> np.ndarray:
    value = value.lstrip("#")
    return np.array(
        [int(value[i:i + 2], 16) for i in (0, 2, 4)] + [alpha],
        dtype=np.uint8,
    )


def palette_for(request: RoomDesignRequest) -> dict:
    """Return a complete palette, applying user overrides."""
    palette = dict(STYLE_PALETTES[request.style])
    overrides = {
        "wall": request.wall_color,
        "accent_wall": request.accent_wall_color,
        "floor": request.floor_color,
        "ceiling": request.ceiling_color,
    }
    for key, value in overrides.items():
        if value:
            palette[key] = value
    return palette


def recommend_palette(style: str, room_type: str) -> dict:
    """Return a palette recommendation with short design guidance."""
    if style not in STYLE_PALETTES:
        raise ValueError(f"Unsupported style: {style}")
    palette = dict(STYLE_PALETTES[style])
    guidance = {
        "bedroom": "Use softer wall colors and warm, low-intensity lighting.",
        "living_room": "Use a balanced neutral base with one accent wall.",
        "dining_room": "Use warm colors to create a welcoming dining area.",
        "kitchen": "Prefer easy-to-clean, visually light finishes.",
        "office": "Use restrained colors and avoid visual clutter.",
        "empty_room": "Start with a neutral base and add accents gradually.",
    }
    return {
        "style": style,
        "room_type": room_type,
        "colors": palette,
        "guidance": guidance.get(room_type, ""),
    }


def material(color: str, roughness: float = 0.8) -> trimesh.visual.material.PBRMaterial:
    rgba = hex_rgba(color)
    return trimesh.visual.material.PBRMaterial(
        name=f"EDVR_{color}",
        baseColorFactor=rgba.tolist(),
        metallicFactor=0.0,
        roughnessFactor=float(roughness),
    )


# ---------------------------------------------------------------------------
# Room understanding / optional 2D object detection
# ---------------------------------------------------------------------------

def detect_room_objects(image_paths: list[Path]) -> dict:
    """
    Optional YOLO image detections.

    This identifies visible object categories in each 2D photo only.
    It does NOT estimate real-world object coordinates, room dimensions,
    wall planes, or exact 3D geometry.
    """
    model_path = os.getenv("EDVR_YOLO_MODEL", "").strip()
    if not model_path:
        return {
            "available": False,
            "detections": [],
            "message": "YOLO is not configured. Set EDVR_YOLO_MODEL to enable 2D object detection.",
        }

    try:
        from ultralytics import YOLO
    except ImportError:
        return {
            "available": False,
            "detections": [],
            "message": "Optional dependency missing. Install with: pip install ultralytics",
        }

    try:
        model = YOLO(model_path)
        results = model([str(path) for path in image_paths], verbose=False)
        detections = []
        for image_index, result in enumerate(results):
            names = result.names or {}
            boxes = result.boxes
            if boxes is None:
                continue
            for box in boxes:
                cls_id = int(box.cls.item())
                confidence = float(box.conf.item())
                xyxy = [float(v) for v in box.xyxy[0].tolist()]
                detections.append({
                    "image_index": image_index,
                    "label": names.get(cls_id, str(cls_id)),
                    "confidence": round(confidence, 4),
                    "bbox_xyxy": xyxy,
                })
        return {
            "available": True,
            "detections": detections,
            "message": "2D detections only; positions are not metric 3D coordinates.",
        }
    except Exception as exc:
        logger.exception("YOLO room-object detection failed")
        return {
            "available": False,
            "detections": [],
            "message": f"Object detection failed: {exc}",
        }


def validate_room_images(room_id: str) -> list[Path]:
    """Find and validate the uploaded images belonging to a room."""
    try:
        normalized = str(UUID(room_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid room ID.") from exc

    folder = UPLOAD_DIR / normalized
    if not folder.is_dir():
        raise HTTPException(status_code=404, detail="Uploaded room not found.")

    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    images = sorted(
        [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in allowed],
        key=lambda p: p.name.lower(),
    )
    if len(images) < 2:
        raise HTTPException(
            status_code=400,
            detail=f"At least 2 room photographs are required; found {len(images)}.",
        )
    return images


# ---------------------------------------------------------------------------
# Procedural geometry helpers
# ---------------------------------------------------------------------------

def add_box(
    scene: trimesh.Scene,
    name: str,
    size: tuple[float, float, float],
    position: tuple[float, float, float],
    color: str,
    roughness: float = 0.8,
) -> None:
    mesh = trimesh.creation.box(extents=size)
    mesh.apply_translation(position)
    mesh.visual.material = material(color, roughness)
    scene.add_geometry(mesh, node_name=name)


def add_cylinder(
    scene: trimesh.Scene,
    name: str,
    radius: float,
    height: float,
    position: tuple[float, float, float],
    color: str,
) -> None:
    mesh = trimesh.creation.cylinder(radius=radius, height=height, sections=20)
    mesh.apply_translation(position)
    mesh.visual.material = material(color)
    scene.add_geometry(mesh, node_name=name)


def build_room_shell(scene: trimesh.Scene, req: RoomDesignRequest, palette: dict) -> None:
    """Create floor, four walls and optional ceiling."""
    length, width, height = req.length, req.width, req.height
    wall_t = 0.12

    # Floor
    add_box(
        scene, "Room_Floor",
        (length, width, 0.12),
        (0, 0, -0.06),
        palette["floor"],
    )

    # Back and front walls
    back_color = palette["accent_wall"] if req.accent_wall else palette["wall"]
    add_box(
        scene, "Wall_Back",
        (length, wall_t, height),
        (0, width / 2, height / 2),
        back_color,
    )
    add_box(
        scene, "Wall_Front",
        (length, wall_t, height),
        (0, -width / 2, height / 2),
        palette["wall"],
    )

    # Left and right walls
    add_box(
        scene, "Wall_Left",
        (wall_t, width, height),
        (-length / 2, 0, height / 2),
        palette["wall"],
    )
    add_box(
        scene, "Wall_Right",
        (wall_t, width, height),
        (length / 2, 0, height / 2),
        palette["wall"],
    )

    if req.include_ceiling:
        add_box(
            scene, "Ceiling",
            (length, width, 0.10),
            (0, 0, height + 0.05),
            palette["ceiling"],
        )


def build_door_and_windows(scene: trimesh.Scene, req: RoomDesignRequest, palette: dict) -> None:
    """Add simple visible placeholder door and two window panels."""
    h = req.height
    door_h = min(2.1, h * 0.78)
    door_w = 0.9
    # Door is represented as a panel on the front wall.
    add_box(
        scene, "Door_Panel",
        (door_w, 0.045, door_h),
        (-req.length * 0.30, -req.width / 2 - 0.035, door_h / 2),
        "#76513B",
    )
    # Window panels on the back wall. These are placeholders, not inferred openings.
    window_w = min(1.35, req.length * 0.30)
    window_h = min(1.0, h * 0.35)
    for index, x in enumerate((-req.length * 0.22, req.length * 0.22), start=1):
        add_box(
            scene, f"Window_Glass_{index}",
            (window_w, 0.035, window_h),
            (x, req.width / 2 - 0.04, h * 0.62),
            "#9CC7D8",
            roughness=0.25,
        )
        add_box(
            scene, f"Window_Frame_{index}",
            (window_w + 0.08, 0.06, 0.07),
            (x, req.width / 2 - 0.02, h * 0.62 + window_h / 2),
            "#F1EEE8",
        )


# ---------------------------------------------------------------------------
# Furniture placement
# ---------------------------------------------------------------------------

def place_furniture(scene: trimesh.Scene, req: RoomDesignRequest, palette: dict) -> list[dict]:
    """Create simple editable furniture placeholders in plausible positions."""
    if not req.include_furniture:
        return []

    s = req.furniture_scale
    L, W = req.length, req.width
    y_back = W / 2 - 0.65
    placed = []

    def box_item(name, size, pos, color=None):
        scaled = tuple(float(v) * s for v in size)
        add_box(scene, name, scaled, pos, color or palette["furniture"])
        placed.append({"name": name, "position": list(pos), "size": list(scaled)})

    room_type = req.room_type

    if room_type == "living_room":
        # Sofa against the back wall; coffee table in front; TV unit opposite.
        box_item("Sofa_Base", (2.2, 0.85, 0.42), (0, y_back, 0.42), palette["fabric"])
        box_item("Sofa_Back", (2.2, 0.18, 0.72), (0, y_back + 0.34, 0.98), palette["fabric"])
        for x in (-0.85, 0.85):
            box_item("Sofa_Arm", (0.22, 0.85, 0.62), (x, y_back, 0.72), palette["fabric"])
        box_item("Coffee_Table", (1.1, 0.55, 0.12), (0, 0, 0.48))
        box_item("TV_Unit", (1.8, 0.38, 0.48), (0, -W / 2 + 0.65, 0.48))
        box_item("TV_Screen", (1.25, 0.06, 0.75), (0, -W / 2 + 0.65, 1.08), "#25292D")

    elif room_type == "bedroom":
        box_item("Bed_Base", (2.0, 2.0, 0.35), (0, y_back - 0.35, 0.35))
        box_item("Mattress", (1.92, 1.92, 0.20), (0, y_back - 0.35, 0.62), "#E9E4DA")
        box_item("Headboard", (2.05, 0.12, 1.0), (0, y_back + 0.68, 0.95), palette["furniture"])
        for x in (-1.25, 1.25):
            box_item("Bedside_Table", (0.45, 0.45, 0.52), (x, y_back + 0.35, 0.26))
        box_item("Wardrobe", (1.8, 0.60, 2.1), (L / 2 - 0.45, 0, 1.05))

    elif room_type == "dining_room":
        box_item("Dining_Table_Top", (1.8, 0.95, 0.12), (0, 0, 0.78))
        box_item("Dining_Table_Base", (0.25, 0.25, 0.68), (0, 0, 0.34))
        for x in (-1.15, 1.15):
            for y in (-0.48, 0.48):
                box_item("Dining_Chair_Seat", (0.45, 0.45, 0.12), (x, y, 0.48), palette["fabric"])
                box_item("Dining_Chair_Back", (0.45, 0.10, 0.55), (x, y + (0.22 if y < 0 else -0.22), 0.78), palette["fabric"])

    elif room_type == "kitchen":
        box_item("Kitchen_Counter", (L * 0.55, 0.65, 0.92), (0, y_back, 0.46))
        box_item("Kitchen_Island", (1.5, 0.8, 0.90), (0, -0.15, 0.45))
        box_item("Refrigerator", (0.75, 0.72, 1.9), (L / 2 - 0.55, y_back - 0.9, 0.95), "#D5D8DA")

    elif room_type == "office":
        box_item("Office_Desk", (1.6, 0.75, 0.12), (0, y_back - 0.4, 0.78))
        box_item("Office_Desk_Pedestal", (0.35, 0.60, 0.72), (-0.55, y_back - 0.4, 0.36))
        box_item("Office_Chair_Seat", (0.55, 0.55, 0.15), (0, 0.1, 0.55), palette["fabric"])
        box_item("Office_Chair_Back", (0.55, 0.12, 0.65), (0, 0.36, 0.92), palette["fabric"])
        box_item("Bookshelf", (1.0, 0.35, 1.8), (L / 2 - 0.55, y_back - 0.7, 0.9))

    return placed


# ---------------------------------------------------------------------------
# Lighting and decor
# ---------------------------------------------------------------------------

def add_lighting(scene: trimesh.Scene, req: RoomDesignRequest, palette: dict) -> None:
    if not req.include_lighting:
        return

    # Ceiling fixture body and warm emissive-looking diffuser.
    z = req.height - 0.16
    add_cylinder(scene, "Ceiling_Light_Base", 0.22, 0.08, (0, 0, z), palette["metal"])
    add_cylinder(scene, "Ceiling_Light_Diffuser", 0.16, 0.035, (0, 0, z - 0.055), palette["light"])

    # Four simple recessed-light discs.
    for i, x in enumerate((-req.length * 0.30, req.length * 0.30), start=1):
        for j, y in enumerate((-req.width * 0.28, req.width * 0.28), start=1):
            add_cylinder(
                scene, f"Spotlight_{i}_{j}", 0.075, 0.025,
                (x, y, req.height - 0.10), "#FFF1D8"
            )


def add_decor(scene: trimesh.Scene, req: RoomDesignRequest, palette: dict) -> None:
    if not req.include_decor:
        return

    # Plant pot and foliage-like stacked spheres.
    x, y = -req.length / 2 + 0.55, req.width / 2 - 0.55
    add_cylinder(scene, "Plant_Pot", 0.18, 0.32, (x, y, 0.16), "#A66E4D")

    for index, offset in enumerate((0.0, 0.12, -0.12)):
        sphere = trimesh.creation.icosphere(subdivisions=2, radius=0.28)
        sphere.apply_scale([0.85, 0.85, 1.0])
        sphere.apply_translation((x + offset, y, 0.62 + index * 0.12))
        sphere.visual.material = material("#527653")
        scene.add_geometry(sphere, node_name=f"Plant_Leaves_{index + 1}")

    # Wall art placeholder on the accent wall.
    add_box(
        scene, "Wall_Art_Frame",
        (0.9, 0.045, 0.65),
        (req.length * 0.20, req.width / 2 - 0.09, req.height * 0.68),
        "#5A4638",
    )
    add_box(
        scene, "Wall_Art_Canvas",
        (0.80, 0.025, 0.55),
        (req.length * 0.20, req.width / 2 - 0.12, req.height * 0.68),
        "#D8C5A7",
    )


# ---------------------------------------------------------------------------
# Scene builder and export
# ---------------------------------------------------------------------------

def build_design_scene(req: RoomDesignRequest) -> tuple[trimesh.Scene, dict]:
    palette = palette_for(req)
    scene = trimesh.Scene()

    build_room_shell(scene, req, palette)
    build_door_and_windows(scene, req, palette)
    furniture = place_furniture(scene, req, palette)
    add_lighting(scene, req, palette)
    add_decor(scene, req, palette)

    metadata = {
        "design_name": req.design_name,
        "room_type": req.room_type,
        "style": req.style,
        "dimensions_m": {
            "length": req.length,
            "width": req.width,
            "height": req.height,
        },
        "palette": palette,
        "furniture": furniture,
        "limitations": [
            "This is a procedural design preview, not geometry reconstructed from photographs.",
            "Door and window positions are placeholders.",
            "Furniture dimensions and positions are approximate editable defaults.",
            "Supply measured room dimensions and replace placeholders with real licensed 3D assets for production.",
        ],
    }
    return scene, metadata


def export_design_glb(room_id: str, req: RoomDesignRequest) -> tuple[Path, dict]:
    try:
        normalized_room_id = str(UUID(room_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid room ID.") from exc

    scene, metadata = build_design_scene(req)
    output_dir = GENERATED_DIR / normalized_room_id
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / "design_preview.glb"
    temp_path = output_dir / "design_preview.tmp.glb"

    try:
        scene.export(temp_path, file_type="glb")
        data = temp_path.read_bytes()
        if len(data) < 20 or data[:4] != b"glTF":
            raise RuntimeError("Generated output is not a valid binary GLB.")
        if int.from_bytes(data[4:8], "little") != 2:
            raise RuntimeError("Unsupported GLB version.")
        if int.from_bytes(data[8:12], "little") != len(data):
            raise RuntimeError("Generated GLB length is invalid.")
        os.replace(temp_path, output_path)
    except Exception as exc:
        temp_path.unlink(missing_ok=True)
        logger.exception("EDVR GLB design export failed")
        raise HTTPException(status_code=500, detail=f"Could not generate GLB preview: {exc}") from exc

    metadata["model_url"] = f"/api/interior-design/rooms/{normalized_room_id}/model"
    metadata["model_size_bytes"] = output_path.stat().st_size
    return output_path, metadata


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@router.get("/styles")
def get_design_styles():
    return {
        "styles": list(STYLE_PALETTES.keys()),
        "room_types": list(ROOM_FURNITURE.keys()),
        "message": "Choose a room type and design style to generate a preview.",
    }


@router.get("/palette/{style}/{room_type}")
def get_palette(style: str, room_type: str):
    try:
        return recommend_palette(style, room_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/rooms/{room_id}/preview")
def create_room_design_preview(room_id: UUID, request: RoomDesignRequest):
    output_path, metadata = export_design_glb(str(room_id), request)
    return {
        "success": True,
        "message": "EDVR 3D interior design preview generated.",
        **metadata,
    }


@router.get("/rooms/{room_id}/model")
def get_room_design_model(room_id: UUID):
    from fastapi.responses import FileResponse

    model_path = GENERATED_DIR / str(room_id) / "design_preview.glb"
    if not model_path.is_file():
        raise HTTPException(status_code=404, detail="Design preview has not been generated.")
    return FileResponse(
        path=model_path,
        media_type="model/gltf-binary",
        filename="design_preview.glb",
        content_disposition_type="inline",
    )


@router.post("/rooms/{room_id}/analyze")
def analyze_room_photos(room_id: UUID):
    """
    Optional 2D object detection endpoint for uploaded room images.
    It does not generate 3D geometry.
    """
    images = validate_room_images(str(room_id))
    result = detect_room_objects(images)
    return {
        "success": True,
        "room_id": str(room_id),
        "image_count": len(images),
        **result,
    }
