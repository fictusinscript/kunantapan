"use client"  
import React, { useState, useEffect, useRef } from 'react';  
import { Niivue } from '@niivue/niivue';  
  
export default function BrainViewer() {  
  const canvasRef = useRef<HTMLCanvasElement>(null);  
  const nvRef = useRef<any>(null);  
    
  // State for all interactive elements  
  const [opacity, setOpacity] = useState({ background: 255, overlay: 128 });  
  const [clipPlane, setClipPlane] = useState(false);  
  const [dragMode, setDragMode] = useState(3); // pan/zoom by default  
  const [drawing, setDrawing] = useState({  
    enabled: false,  
    mode: -1, // -1 = off, 2 = on, 10 = filled, 0 = erase  
    drawMode: 0 // 0 = undo, 1 = append, 2 = remove  
  });  
  const [location, setLocation] = useState("Drag and Drop any NIfTI image");  
  
  // Initialize Niivue  
  useEffect(() => {  
    if (!canvasRef.current) return;  
  
    // Define a function to handle location changes  
    const handleLocationChange = (data: any) => {  
      setLocation(data.string);  
    };  
  
    // 1. Create NiiVue instance with proper defaults  
    const defaults = {  
      backColor: [0, 0, 0, 1], // Solid black background  
      show3Dcrosshair: true,  
      crosshairColor: [1, 1, 0, 1],  
      onLocationChange: handleLocationChange,  
      // Important: Disable linked zoom behavior  
      yoke3Dto2DZoom: false,  
      // Disable scroll wheel zoom completely  
      scrollWheelZoom: false  
    };  
  
    // Wait a small amount of time to ensure the canvas is properly in the DOM  
    const initTimer = setTimeout(() => {  
      try {  
        const nv = new Niivue(defaults);  
          
        // 2. Attach to canvas - this is where WebGL context is created  
        if (canvasRef.current) {  
          nv.attachToCanvas(canvasRef.current);  
            
          // Set drag mode to measurement instead of pan to avoid zoom behavior  
          nv.opts.dragMode = nv.dragModes.measurement;  
            
          nv.opts.multiplanarForceRender = true;  
          nv.opts.crosshairGap = 11;  
          nv.setInterpolation(true);  
  
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
              
            // Add our custom wheel handler AFTER volumes are loaded  
            addCustomWheelHandler(nv);  
              
          }).catch(err => {  
            console.error("Error loading volumes:", err);  
          });  
        }  
      } catch (e) {  
        console.error("Error initializing NiiVue:", e);  
      }  
    }, 100);  
  
    // Function to add our custom wheel handler  
    function addCustomWheelHandler(nv: any) {  
      if (!canvasRef.current) return;  
        
      // Override NiiVue's internal wheel handler  
      const originalHandleWheel = nv.handleWheel;  
      nv.handleWheel = function() {  
        // Do nothing - completely disable the default wheel behavior  
        return;  
      };  
        
      // Add wheel event listener to canvas  
      canvasRef.current.addEventListener('wheel', function(e) {  
        e.preventDefault();  
        e.stopPropagation();  
          
        const rect = canvasRef.current!.getBoundingClientRect();  
        const x = e.clientX - rect.left;  
        const y = e.clientY - rect.top;  
          
        // Get the tile index to determine which view we're in  
        const tileIdx = nv.tileIndex(x * window.devicePixelRatio, y * window.devicePixelRatio);  
          
        // Only proceed if we're over a valid tile  
        if (tileIdx >= 0) {  
          const axCorSag = nv.screenSlices[tileIdx].axCorSag;  
            
          // Only handle 2D views (not the 3D render view)  
          if (axCorSag <= 2) { // 0: Axial, 1: Coronal, 2: Sagittal  
            // Calculate scroll direction  
            let scrollAmount = e.deltaY < 0 ? -1 : 1;  
            if (nv.opts.invertScrollDirection) {  
              scrollAmount = -scrollAmount;  
            }  
              
            // Get current crosshair position  
            const crosshair = nv.scene.crosshairPos.slice();  
              
            // Change only the dimension corresponding to the current view  
            // Axial: change Z  
            // Coronal: change Y  
            // Sagittal: change X  
            const step = 0.05; // Step size for slice movement, adjust as needed  
              
            if (axCorSag === 0) { // Axial  
              crosshair[2] = Math.max(0, Math.min(1, crosshair[2] + (scrollAmount * step)));  
            } else if (axCorSag === 1) { // Coronal  
              crosshair[1] = Math.max(0, Math.min(1, crosshair[1] + (scrollAmount * step)));  
            } else if (axCorSag === 2) { // Sagittal  
              crosshair[0] = Math.max(0, Math.min(1, crosshair[0] + (scrollAmount * step)));  
            }  
              
            // Update crosshair position  
            nv.scene.crosshairPos = crosshair;  
            nv.drawScene();  
          }  
        }  
      }, { passive: false });  
    }  
  
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
    <div className="flex flex-col h-full w-full bg-black text-white">  
      <main className="flex-1 bg-black relative">  
        <canvas   
          ref={canvasRef}  
          id="gl1"  
          className="absolute inset-0 w-full h-full bg-black"  
          style={{ minHeight: "400px" }} // Ensures minimum height for the canvas  
        ></canvas>  
      </main>  
    </div>  
  );  
}