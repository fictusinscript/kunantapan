"use client"    
import React, { useState, useEffect, useRef } from 'react';    
import { Niivue } from '@niivue/niivue';    
    
export default function BrainViewer() {    
  const canvasRef = useRef<HTMLCanvasElement>(null);    
  const containerRef = useRef<HTMLDivElement>(null);    
  const nvRef = useRef<any>(null);    
      
  // Add refs for slice info divs    
  const axialSliceInfoRef = useRef<HTMLDivElement>(null);    
  const coronalSliceInfoRef = useRef<HTMLDivElement>(null);    
  const sagittalSliceInfoRef = useRef<HTMLDivElement>(null);    
      
  // State for all interactive elements    
  const [opacity, setOpacity] = useState({ background: 255, overlay: 128 });    
  const [clipPlane, setClipPlane] = useState(true);    
  const [dragMode, setDragMode] = useState(3); // pan/zoom by default    
  const [drawing, setDrawing] = useState({    
    enabled: false,    
    mode: -1, // -1 = off, 2 = on, 10 = filled, 0 = erase    
    drawMode: 0 // 0 = undo, 1 = append, 2 = remove    
  });    
  const [location, setLocation] = useState("Drag and Drop any NIfTI image");    
  const [sliceInfo, setSliceInfo] = useState({    
    axial: { current: 0, total: 0 },    
    coronal: { current: 0, total: 0 },    
    sagittal: { current: 0, total: 0 }    
  });    
    
  // Initialize Niivue    
  useEffect(() => {    
    if (!canvasRef.current) return;    
    
    // Define a function to handle location changes    
    const handleLocationChange = (data: any) => {    
      setLocation(data.string);    
          
      // Update slice information if volumes are loaded    
      if (nvRef.current && nvRef.current.volumes.length > 0) {    
        const nv = nvRef.current;    
        const volume = nv.volumes[0];    
            
        // Get dimensions from the volume header    
        const dims = volume.hdr.dims.slice(1, 4); // [x, y, z] dimensions    
            
        // Get crosshair position (0-1 range for each dimension)    
        const crosshair = nv.scene.crosshairPos.slice();    
            
        // Calculate current slice for each orientation (convert from 0-1 range to actual slice number)    
        const axialSlice = Math.round(crosshair[2] * (dims[2] - 1)) + 1;    
        const coronalSlice = Math.round(crosshair[1] * (dims[1] - 1)) + 1;    
        const sagittalSlice = Math.round(crosshair[0] * (dims[0] - 1)) + 1;    
            
        // Update slice info state    
        setSliceInfo({    
          axial: { current: axialSlice, total: dims[2] },    
          coronal: { current: coronalSlice, total: dims[1] },    
          sagittal: { current: sagittalSlice, total: dims[0] }    
        });    
      }    
    };    
    
    // 1. Create NiiVue instance with proper defaults    
    const defaults = {    
      backColor: [0, 0, 0, 1], // Solid black background    
      show3Dcrosshair: true,    
      crosshairColor: [1, 1, 0, 1],    
      onLocationChange: handleLocationChange, // Important: Register the location change handler    
      // Disable linked zoom behavior    
      yoke3Dto2DZoom: false,    
      // Disable scroll wheel zoom completely    
      scrollWheelZoom: false,  
      // Enable equal size for all views  
      multiplanarEqualSize: true  
    };    
    
    // Wait a small amount of time to ensure the canvas is properly in the DOM    
    const initTimer = setTimeout(() => {    
      try {    
        const nv = new Niivue(defaults);    
            
        // 2. Attach to canvas - this is where WebGL context is created    
        if (canvasRef.current) {    
          nv.attachToCanvas(canvasRef.current);    
              
          // Set drag mode to measurement instead of pan to avoid zoom behavior    
          nv.opts.dragMode = nv.dragModes.slicer3D;    
          nv.opts.multiplanarForceRender = true;    
          nv.opts.crosshairGap = 11;    
          nv.setInterpolation(true);    
            
          // Enable world space mode for proper physical proportions  
          nv.setSliceMM(true);  
              
          // Set a fixed 2x2 quad-view layout    
          nv.setCustomLayout([    
            // Top left - Sagittal    
            {sliceType: nv.sliceTypeSagittal, position: [0, 0, 0.5, 0.5]},    
            // Top right - Coronal    
            {sliceType: nv.sliceTypeCoronal, position: [0.5, 0, 0.5, 0.5]},    
            // Bottom left - Axial    
            {sliceType: nv.sliceTypeAxial, position: [0, 0.5, 0.5, 0.5]},    
            // Bottom right - 3D Render    
            {sliceType: nv.sliceTypeRender, position: [0.5, 0.5, 0.5, 0.5]},    
          ]);    
              
          // 3. Store the reference for later use    
          nvRef.current = nv;    
              
          // 4. Load default volumes with proper paths    
          nv.loadVolumes([    
            { url: "/default/brain.nii" },    
            { url: "/default/mask.seg.nii" }    
          ]).then(() => {    
            if (nv.volumes.length > 1) {    
              nv.volumes[1].colormap = "red";    
              nv.volumes[1].opacity = 0.5;    
              nv.updateGLVolume();    
            }    
                
          }).catch(err => {    
            console.error("Error loading volumes:", err);    
          });    
        }    
      } catch (e) {    
        console.error("Error initializing NiiVue:", e);    
      }    
    }, 100);    
    
      
    
    // Proper cleanup function    
    return () => {    
      clearTimeout(initTimer);    
          
      if (nvRef.current) {    
        const nv = nvRef.current;    
            
        // Remove our custom wheel handler if it exists    
        if (canvasRef.current) {    
          // We can't directly remove the anonymous function,    
          // but NiiVue's cleanup will handle this    
        }    
            
        // 1. Properly clean up WebGL context if it exists    
        if (nv.gl) {    
          // Try to lose context    
          const loseCtx = nv.gl.getExtension('WEBGL_lose_context');    
          if (loseCtx) {    
            loseCtx.loseContext();    
          }    
              
          // 2. Clear volumes array to help GC    
          if (nv.volumes) {    
            while (nv.volumes.length > 0) {    
              nv.volumes.pop();    
            }    
          }    
              
          // 3. Clear meshes array if it exists    
          if (nv.meshes) {    
            while (nv.meshes.length > 0) {    
              nv.meshes.pop();    
            }    
          }    
        }    
            
        // 4. Clear the reference    
        nvRef.current = null;    
      }    
    };    
  }, []);    
    
  return (    
    <div className="flex flex-col h-full w-full bg-black text-white" ref={containerRef}>    
      <main className="flex-1 bg-black relative">    
        {/* Canvas element for NiiVue */}    
        <canvas     
          ref={canvasRef}     
          id="gl1"     
          className="absolute inset-0 w-full h-full bg-black"     
          style={{ minHeight: "400px" }}     
        ></canvas>    
            
        {/* Slice Information Overlays */}    
        <div    
          ref={axialSliceInfoRef}    
          className="absolute text-white text-sm px-2 py-1 pointer-events-none"    
          style={{     
            left: '10px',     
            bottom: '10px',     
            zIndex: 10,    
            textShadow: '1px 1px 2px black' // Add text shadow to ensure visibility    
          }}    
        >    
          Slice: {sliceInfo.axial.current}/{sliceInfo.axial.total}    
        </div>    
    
        <div    
          ref={coronalSliceInfoRef}    
          className="absolute text-white text-sm px-2 py-1 pointer-events-none"    
          style={{     
            left: '60%',     
            bottom: '60%',     
            zIndex: 10,    
            textShadow: '1px 1px 2px black' // Add text shadow to ensure visibility    
          }}    
        >    
          Slice: {sliceInfo.coronal.current}/{sliceInfo.coronal.total}    
        </div>    
    
        <div    
          ref={sagittalSliceInfoRef}    
          className="absolute text-white text-sm px-2 py-1 pointer-events-none"    
          style={{     
            left: '10px',     
            bottom: '60%',     
            zIndex: 10,    
            textShadow: '1px 1px 2px black' // Add text shadow to ensure visibility    
          }}    
        >    
          Slice: {sliceInfo.sagittal.current}/{sliceInfo.sagittal.total}    
        </div>  
      </main>    
    </div>    
  );    
}