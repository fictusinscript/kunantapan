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
      backColor: [0.4, 0.4, 0.4, 1],  
      show3Dcrosshair: true,  
      onLocationChange: handleLocationChange  
    };  
  
    // Wait a small amount of time to ensure the canvas is properly in the DOM  
    const initTimer = setTimeout(() => {  
      try {  
        const nv = new Niivue(defaults);  
          
        // 2. Attach to canvas - this is where WebGL context is created  
        if (canvasRef.current) {  
          nv.attachToCanvas(canvasRef.current);  
          nv.opts.dragMode = nv.dragModes.pan;  
          nv.opts.multiplanarForceRender = true;  
          nv.opts.yoke3Dto2DZoom = true;  
          nv.opts.crosshairGap = 11;  
          nv.setInterpolation(true);  
            
          // 3. Store the reference for later use  
          nvRef.current = nv;  
            
          // 4. Load default volumes with proper paths  
          // Make sure these files exist at these paths in your public folder  
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
  
  // Rest of your effect hooks and handlers remain the same...  
  // Update clip plane when state changes  
  useEffect(() => {  
    if (!nvRef.current) return;  
    if (clipPlane) {  
      nvRef.current.setClipPlane([0, 0, 90]);  
    } else {  
      nvRef.current.setClipPlane([2, 0, 90]);  
    }  
  }, [clipPlane]);  
  
  // Update opacity when state changes  
  useEffect(() => {  
    if (!nvRef.current || !nvRef.current.volumes || nvRef.current.volumes.length === 0) return;  
    nvRef.current.setOpacity(0, opacity.background / 255);  
    nvRef.current.updateGLVolume();  
  }, [opacity.background]);  
  
  useEffect(() => {  
    if (!nvRef.current || !nvRef.current.volumes || nvRef.current.volumes.length < 2) return;  
    nvRef.current.setOpacity(1, opacity.overlay / 255);  
    nvRef.current.updateGLVolume();  
  }, [opacity.overlay]);  
  
  // Update drag mode when state changes  
  useEffect(() => {  
    if (!nvRef.current) return;  
    nvRef.current.opts.dragMode = dragMode;  
  }, [dragMode]);  
  
  // Update drawing mode when state changes  
  useEffect(() => {  
    if (!nvRef.current) return;  
    nvRef.current.setDrawingEnabled(drawing.enabled);  
    if (drawing.mode >= 0) {  
      nvRef.current.setPenValue(drawing.mode & 7, drawing.mode > 7);  
    }  
  }, [drawing.enabled, drawing.mode]);  
  
  // Handle drawing mode changes  
  const handlePenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {  
    const mode = parseInt(e.target.value);  
    setDrawing(prev => ({ ...prev, enabled: mode >= 0, mode }));  
  };  
  
  // Handle draw mode (undo, append, remove)  
  const handleDrawModeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {  
    if (!nvRef.current || !nvRef.current.drawBitmap) {  
      alert("No drawing (hint: use the Draw pull down to select a pen)");  
      setDrawing(prev => ({ ...prev, drawMode: 0 }));  
      return;  
    }  
      
    const mode = parseInt(e.target.value);  
    if (mode === 0) {  
      nvRef.current.drawUndo();  
      setDrawing(prev => ({ ...prev, drawMode: 0 }));  
      return;  
    }  
      
    if (nvRef.current.volumes.length < 2) {  
      alert("No segmentation open");  
      setDrawing(prev => ({ ...prev, drawMode: 0 }));  
      return;  
    }  
      
    let img = nvRef.current.volumes[1].img;  
    let draw = await nvRef.current.saveImage({ filename: "", isSaveDrawing: true });  
    const niiHdrBytes = 352;  
    const nvox = draw.length;  
      
    if (mode === 1) { // append  
      for (let i = 0; i < nvox; i++) if (draw[niiHdrBytes + i] > 0) img[i] = 1;  
    }  
    if (mode === 2) { // delete  
      for (let i = 0; i < nvox; i++) if (draw[niiHdrBytes + i] > 0) img[i] = 0;  
    }  
      
    nvRef.current.closeDrawing();  
    nvRef.current.updateGLVolume();  
    nvRef.current.setDrawingEnabled(false);  
    setDrawing(prev => ({ ...prev, enabled: false, mode: -1, drawMode: 0 }));  
  };  
  
  // Handle save image button  
  const handleSaveImage = () => {  
    if (!nvRef.current || nvRef.current.volumes.length < 2) {  
      alert("No segmentation open");  
      return;  
    }  
    nvRef.current.volumes[1].saveToDisk("segmentation.nii.gz");  
  };  
  
  // Handle save scene button  
  const handleSaveScene = () => {  
    if (!nvRef.current) return;  
    nvRef.current.saveDocument("brainchop.nvd");  
  };  
  
  // Parse location string for better display  
  const parsedLocation = location.split(" ").map((value, index) => (  
    <p key={index} style={{ fontSize: "14px", margin: "0px" }}>{value}</p>  
  ));  
  
  return (  
    <div className="flex flex-col h-full w-full bg-[#303030] text-white">  
      <header className="p-4">  
        <div className="flex flex-wrap gap-4 items-center">  
          <div className="flex items-center gap-2">  
            <label htmlFor="clipCheck">Clip Plane</label>  
            <input type="checkbox" id="clipCheck" checked={clipPlane} onChange={e => setClipPlane(e.target.checked)} />  
          </div>  
          <div className="flex items-center gap-2">  
            <label htmlFor="opacitySlider0">Background Opacity</label>  
            <input type="range" min="0" max="255" value={opacity.background} className="slider" id="opacitySlider0" onChange={e => setOpacity(prev => ({ ...prev, background: parseInt(e.target.value) }))} />  
          </div>  
          <div className="flex items-center gap-2">  
            <label htmlFor="opacitySlider1">Overlay Opacity</label>  
            <input type="range" min="0" max="255" value={opacity.overlay} className="slider" id="opacitySlider1" onChange={e => setOpacity(prev => ({ ...prev, overlay: parseInt(e.target.value) }))} />  
          </div>  
          <div className="flex items-center gap-2">  
            <label htmlFor="penDrop">Draw</label>  
            <select id="penDrop" value={drawing.mode} onChange={handlePenChange} >  
              <option value="-1">Off</option>  
              <option value="2">On</option>  
              <option value="10">Filled</option>  
              <option value="0">Erase</option>  
            </select>  
            <select id="drawDrop" value={drawing.drawMode} onChange={handleDrawModeChange} >  
              <option value="0">Undo</option>  
              <option value="1">Append</option>  
              <option value="2">Remove</option>  
            </select>  
          </div>  
          <div className="flex items-center gap-2">  
            <label htmlFor="dragMode">Drag Mode</label>  
            <select id="dragMode" value={dragMode} onChange={e => setDragMode(parseInt(e.target.value))} >  
              <option value="0">none</option>  
              <option value="1">contrast</option>  
              <option value="2">measurement</option>  
              <option value="3">pan/zoom</option>  
              <option value="4">slicer3D</option>  
            </select>  
          </div>  
          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded" onClick={handleSaveImage} >  
            Save Segmentation  
          </button>  
          <button className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded" onClick={handleSaveScene} >  
            Save Scene  
          </button>  
        </div>  
      </header>  
      <main className="flex-1 bg-black relative">  
        <canvas ref={canvasRef} id="gl1" className="absolute inset-0 w-full h-full"></canvas>  
      </main>  
      <footer className="p-4">  
        <div className="w-full">  
          <table className="w-full">  
            <tbody>  
              <tr>  
                <th id="location">{parsedLocation}</th>  
              </tr>  
            </tbody>  
          </table>  
        </div>  
      </footer>  
    </div>  
  );  
}