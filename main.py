#!/usr/bin/env python3
"""
CODAGE11 3D Printing Price Calculator - FastAPI Backend
Main server for 3D file analysis and price calculation
"""

import os
import tempfile
import json
import math
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse

app = FastAPI(
    title="CODAGE11 3D Pricer API",
    description="API for 3D printing price calculation and file analysis",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")

# Material properties and pricing
MATERIALS = {
    "PLA": {
        "name": "PLA (Standard)",
        "density": 1.24,  # g/cm³
        "price_per_kg": 25.0,  # EUR/kg
        "print_speed_modifier": 1.0,
        "support_difficulty": 1.0
    },
    "ABS": {
        "name": "ABS (High Strength)",
        "density": 1.04,  # g/cm³
        "price_per_kg": 30.0,  # EUR/kg
        "print_speed_modifier": 0.9,
        "support_difficulty": 1.2
    },
    "PETG": {
        "name": "PETG (Chemical Resistant)",
        "density": 1.27,  # g/cm³
        "price_per_kg": 35.0,  # EUR/kg
        "print_speed_modifier": 0.8,
        "support_difficulty": 1.1
    },
    "TPU": {
        "name": "TPU (Flexible)",
        "density": 1.2,  # g/cm³
        "price_per_kg": 45.0,  # EUR/kg
        "print_speed_modifier": 0.5,
        "support_difficulty": 1.5
    }
}

# Pricing configuration
PRICING_CONFIG = {
    "base_print_time_per_cm3": 2.0,  # minutes per cm³
    "machine_cost_per_hour": 15.0,  # EUR/hour
    "post_processing_base": 5.0,  # EUR base cost
    "support_cost_multiplier": 0.3,  # Additional cost for supports
    "margin": 0.25,  # 25% margin
    "minimum_price": 5.0  # Minimum order value
}

def analyze_3d_file_simple(file_path: str, file_size: int) -> Dict[str, Any]:
    """
    Simple 3D file analysis without trimesh (for demo purposes)
    In production, this would use proper 3D analysis libraries
    """
    try:
        # Get file extension
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # Simulate analysis based on file size and type
        # This is a simplified version for demonstration
        
        # Estimate volume based on file size (very rough approximation)
        # Larger files typically mean more complex/larger models
        estimated_volume_cm3 = max(1.0, file_size / 100000 * 10)  # Rough heuristic
        
        # Simulate other properties
        estimated_surface_area = estimated_volume_cm3 * 6  # Rough cube approximation
        
        # Simulate dimensions (assuming roughly cubic shape)
        cube_side = estimated_volume_cm3 ** (1/3)
        dimensions_cm = {
            "x": round(cube_side * 1.2, 2),  # Slightly rectangular
            "y": round(cube_side * 0.8, 2),
            "z": round(cube_side * 1.0, 2)
        }
        
        # Simulate complexity based on file size
        complexity_factor = min(1.0, file_size / 1000000)  # Normalize to file size
        
        # Simulate face count
        face_count = int(file_size / 50)  # Rough estimate
        vertex_count = int(face_count * 0.6)
        
        # Basic printability checks
        is_watertight = True  # Assume good for demo
        needs_supports = complexity_factor > 0.3  # Heuristic
        
        return {
            "volume_cm3": round(estimated_volume_cm3, 3),
            "surface_area_cm2": round(estimated_surface_area, 2),
            "dimensions_cm": dimensions_cm,
            "face_count": face_count,
            "vertex_count": vertex_count,
            "complexity_factor": round(complexity_factor, 3),
            "is_watertight": is_watertight,
            "needs_supports": needs_supports,
            "analysis_method": "simplified_demo"
        }
        
    except Exception as e:
        raise ValueError(f"Error analyzing 3D file: {str(e)}")

def calculate_price(analysis: Dict[str, Any], material: str, 
                   infill: float = 20.0, layer_height: float = 0.2,
                   include_supports: bool = None) -> Dict[str, Any]:
    """
    Calculate printing price based on analysis and parameters
    """
    if material not in MATERIALS:
        raise ValueError(f"Unknown material: {material}")
    
    mat_props = MATERIALS[material]
    volume_cm3 = analysis["volume_cm3"]
    
    # Auto-detect supports if not specified
    if include_supports is None:
        include_supports = analysis["needs_supports"]
    
    # Calculate material usage
    infill_multiplier = 0.1 + (infill / 100) * 0.9  # 10% minimum + infill%
    effective_volume = volume_cm3 * infill_multiplier
    
    # Add support material if needed
    if include_supports:
        support_volume = volume_cm3 * 0.15  # Estimate 15% additional for supports
        effective_volume += support_volume
    
    # Calculate material weight and cost
    weight_g = effective_volume * mat_props["density"]
    weight_kg = weight_g / 1000
    material_cost = weight_kg * mat_props["price_per_kg"]
    
    # Calculate print time
    base_time_minutes = volume_cm3 * PRICING_CONFIG["base_print_time_per_cm3"]
    
    # Apply modifiers
    layer_modifier = 0.2 / layer_height  # Thinner layers = longer time
    speed_modifier = mat_props["print_speed_modifier"]
    complexity_modifier = 1 + (analysis["complexity_factor"] * 0.5)
    support_modifier = 1 + (0.3 if include_supports else 0)
    
    total_time_minutes = (base_time_minutes * layer_modifier * 
                         complexity_modifier * support_modifier / speed_modifier)
    total_time_hours = total_time_minutes / 60
    
    # Calculate machine time cost
    machine_cost = total_time_hours * PRICING_CONFIG["machine_cost_per_hour"]
    
    # Post-processing cost
    post_processing = PRICING_CONFIG["post_processing_base"]
    if include_supports:
        post_processing += material_cost * PRICING_CONFIG["support_cost_multiplier"]
    
    # Total before margin
    subtotal = material_cost + machine_cost + post_processing
    
    # Apply margin
    margin_amount = subtotal * PRICING_CONFIG["margin"]
    total_price = subtotal + margin_amount
    
    # Apply minimum price
    total_price = max(total_price, PRICING_CONFIG["minimum_price"])
    
    return {
        "material": {
            "type": material,
            "name": mat_props["name"],
            "weight_g": round(weight_g, 2),
            "cost": round(material_cost, 2)
        },
        "print_time": {
            "hours": round(total_time_hours, 2),
            "minutes": round(total_time_minutes, 0)
        },
        "costs": {
            "material": round(material_cost, 2),
            "machine_time": round(machine_cost, 2),
            "post_processing": round(post_processing, 2),
            "subtotal": round(subtotal, 2),
            "margin": round(margin_amount, 2),
            "total": round(total_price, 2)
        },
        "parameters": {
            "infill_percent": infill,
            "layer_height_mm": layer_height,
            "includes_supports": include_supports
        }
    }

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main index page"""
    return FileResponse("index.html")

@app.get("/upload", response_class=HTMLResponse)
async def upload_page():
    """Serve the upload page"""
    return FileResponse("upload.html")

@app.get("/viewer", response_class=HTMLResponse)
async def viewer_page():
    """Serve the 3D viewer page"""
    return FileResponse("viewer.html")

@app.get("/pricing", response_class=HTMLResponse)
async def pricing_page():
    """Serve the pricing page"""
    return FileResponse("pricing.html")

@app.get("/api/materials")
async def get_materials():
    """Get available materials and their properties"""
    return MATERIALS

@app.post("/api/analyze")
async def analyze_file(
    file: UploadFile = File(...),
    material: str = Form("PLA"),
    infill: float = Form(20.0),
    layer_height: float = Form(0.2),
    include_supports: Optional[bool] = Form(None)
):
    """
    Analyze a 3D file and calculate pricing
    """
    # Validate file type
    allowed_extensions = {'.stl', '.obj', '.ply', '.step', '.stp'}
    file_extension = os.path.splitext(file.filename.lower())[1]
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    try:
        # Analyze the 3D file (simplified version)
        analysis = analyze_3d_file_simple(tmp_file_path, len(content))
        
        # Calculate pricing
        pricing = calculate_price(
            analysis, material, infill, layer_height, include_supports
        )
        
        return {
            "filename": file.filename,
            "file_size_bytes": len(content),
            "analysis": analysis,
            "pricing": pricing,
            "status": "success"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
    finally:
        # Cleanup temporary file
        try:
            os.unlink(tmp_file_path)
        except:
            pass

@app.get("/api/quote/{quote_id}")
async def get_quote(quote_id: str):
    """Get a specific quote (placeholder for future database integration)"""
    # This would typically fetch from a database
    return {"quote_id": quote_id, "status": "placeholder"}

@app.post("/api/quote")
async def create_quote(quote_data: dict):
    """Create a new quote (placeholder for future database integration)"""
    # This would typically save to a database and return a quote ID
    import uuid
    quote_id = str(uuid.uuid4())
    return {"quote_id": quote_id, "status": "created"}

if __name__ == "__main__":
    print("🚀 Starting CODAGE11 3D Pricer Server...")
    print("📊 Visit http://localhost:8000 to access the application")
    
    # Try to import uvicorn, if not available use basic HTTP server
    try:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except ImportError:
        print("⚠️  uvicorn not available, please install it with: pip install uvicorn")
        print("For now, you can test the application structure and files.")
        import sys
        sys.exit(1)