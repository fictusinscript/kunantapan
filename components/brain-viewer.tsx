"use client"  
import React, { useState, useEffect, useRef } from 'react';  
import { Niivue } from '@niivue/niivue';  
  
export default function BrainViewer() {  
  const containerRef = useRef<HTMLDivElement>(null);  
  // Single canvas reference  
  const canvasRef = useRef<HTMLCanvasElement>(null);  
  // Single NiiVue instance reference  
  const nvRef = useRef<any>(null);  
    
  // Refs for slice info divs  
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
        
      // Only update slice info if volumes are loaded  
      if (nvRef.current && nvRef.current.volumes.length > 0) {  
        const nv = nvRef.current;  
        const volume = nv.volumes[0];  
          
        // Get dimensions from the volume header  
        const dims = volume.hdr.dims.slice(1, 4); // [x, y, z] dimensions  
          
        // Get crosshair position (0-1 range for each dimension)  
        const crosshair = nv.scene.crosshairPos.slice();  
          
        // Calculate current slice for each orientation  
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
  
    // Wait a small amount of time to ensure the canvas is properly in the DOM  
    const initTimer = setTimeout(() => {  
      try { 
        // Create a single NiiVue instance with multiplanar view    
        const nv = new Niivue({    
          backColor: [0, 0, 0, 1], // Solid black background    
          show3Dcrosshair: true,    
          crosshairColor: [1, 1, 0, 1],    
          // Remove onLocationChange from here  
          multiplanarPadPixels: 2, // Add padding between views    
          multiplanarLayout: 2, // Grid layout (0: auto, 1: column, 2: grid, 3: row)    
          multiplanarShowRender: 1, // Always show 3D render    
          dragMode: 3, // Default pan/zoom mode    
          multiplanarForceRender: true,    
          crosshairGap: 11,    
          multiplanarEqualSize: true, // All views have equal size    
          yoke3Dto2DZoom: false, // Individual zoom levels
          scrollRequiresFocus: true,    
        });    
        // Set onLocationChange callback after creating the instance  
        nv.onLocationChange = handleLocationChange;  
        // Attach to canvas  
        nv.attachToCanvas(canvasRef.current!);  
          
        // Set multiplanar view (which includes all views: axial, coronal, sagittal, and 3D)  
        nv.setSliceType(nv.sliceTypeMultiplanar);  
        nv.setInterpolation(true);  
        nv.setSliceMM(true);  
          
        // Store reference  
        nvRef.current = nv;  
  
        // Load volumes  
        const loadVolumes = async () => {  
          try {  
            await nv.loadVolumes([  
              { url: "/default/brain.nii" },  
              { url: "/default/mask.seg.nii" }  
            ]);  
              
            // Configure overlay  
            if (nv.volumes.length > 1) {  
              nv.volumes[1].colormap = "red";  
              nv.volumes[1].opacity = 0.5;  
              nv.updateGLVolume();  
            }  
          } catch (err) {  
            console.error("Error loading volumes:", err);  
          }  
        };  
          
        loadVolumes();  
      } catch (e) {  
        console.error("Error initializing NiiVue:", e);  
      }  
    }, 10);  
  
    // Proper cleanup function  
    return () => {  
      clearTimeout(initTimer);  
        
      // Clean up NiiVue instance  
      if (nvRef.current) {  
        const nv = nvRef.current;  
          
        // Clean up WebGL context  
        if (nv.gl) {  
          // Try to lose context  
          const loseCtx = nv.gl.getExtension('WEBGL_lose_context');  
          if (loseCtx) {  
            loseCtx.loseContext();  
          }  
            
          // Clear volumes array  
          if (nv.volumes) {  
            while (nv.volumes.length > 0) {  
              nv.volumes.pop();  
            }  
          }  
            
          // Clear meshes array  
          if (nv.meshes) {  
            while (nv.meshes.length > 0) {  
              nv.meshes.pop();  
            }  
          }  
            
          // Use NiiVue's built-in cleanup if available  
          if (typeof nv.cleanup === 'function') {  
            nv.cleanup();  
          }  
        }  
          
        // Clear the reference  
        nvRef.current = null;  
      }  
    };  
  }, []);  
  
  return (  
    <div className="flex flex-col h-full w-full bg-black text-white" ref={containerRef}>  
      <main className="flex-1 bg-black relative">  
        {/* Single canvas for multiplanar view */}  
        <div className="relative h-full w-full">  
          <canvas   
            ref={canvasRef}   
            className="absolute inset-0 w-full h-full bg-black"  
          ></canvas>  
            
          {/* Overlay the slice info at appropriate positions */}  
          <div   
            ref={sagittalSliceInfoRef}   
            className="absolute text-white text-sm px-2 py-1 pointer-events-none"  
            style={{ left: '10px', top: '10px', zIndex: 10, textShadow: '1px 1px 2px black' }}  
          >  
            Slice: {sliceInfo.sagittal.current}/{sliceInfo.sagittal.total}  
          </div>  
            
          <div   
            ref={coronalSliceInfoRef}   
            className="absolute text-white text-sm px-2 py-1 pointer-events-none"  
            style={{ right: '10px', top: '10px', zIndex: 10, textShadow: '1px 1px 2px black' }}  
          >  
            Slice: {sliceInfo.coronal.current}/{sliceInfo.coronal.total}  
          </div>  
            
          <div   
            ref={axialSliceInfoRef}   
            className="absolute text-white text-sm px-2 py-1 pointer-events-none"  
            style={{ left: '10px', bottom: '10px', zIndex: 10, textShadow: '1px 1px 2px black' }}  
          >  
            Slice: {sliceInfo.axial.current}/{sliceInfo.axial.total}  
          </div>  
        </div>  
      </main>  
    </div>  
  );  
}