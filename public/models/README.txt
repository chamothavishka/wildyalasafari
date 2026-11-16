Photoreal Toyota models (optional)
==================================

Put licensed .glb files here and the website uses them automatically in
Safari Packages and on the Booking page:

  hilux.glb         Toyota Hilux (single or double cab)
  landcruiser.glb   Toyota Land Cruiser 70-series

Tips
 - Face the front of the vehicle towards +X (or set rotationY in src/three/VehicleStage.js -> VEHICLE_MODELS).
 - Name wheel meshes/groups with "wheel" so they spin during drive animations.
 - Keep each file under about 8 MB (compress textures / Draco). Real-time friendly models work best.
 - Make sure the licence allows commercial use (e.g. Sketchfab "CC Attribution" or a paid licence).
 - If a file is missing or fails to load, the built-in procedural Toyota model is shown instead.
