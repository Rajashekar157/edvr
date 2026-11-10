import React, { Suspense, useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, TransformControls, Environment, ContactShadows, Html } from "@react-three/drei";
import { FiBox, FiMove, FiRotateCw, FiLayers, FiTrash2, FiSave, FiPlus, FiCheck } from "react-icons/fi";
import "./InteriorEditor.css";

const DEFAULT_ROOM_ID = "static-demo-home";
const PALETTE = ["#252a31", "#3b302c", "#55463d", "#263b46", "#75604d", "#9a8066", "#d1c2ae", "#a6aaa8", "#6b4140", "#34483e", "#b18a50"];
const CATALOG = [
  { name: "Sofa", size: [2.5, 1.0, 1.0], color: "#303b46" },
  { name: "Armchair", size: [0.9, 1.0, 0.9], color: "#5a4439" },
  { name: "Coffee Table", size: [1.3, 0.45, 0.75], color: "#49372d" },
  { name: "TV Unit", size: [2.0, 0.6, 0.45], color: "#282b30" },
  { name: "Bed", size: [2.2, 0.65, 2.1], color: "#3b414a" },
  { name: "Wardrobe", size: [1.5, 2.3, 0.65], color: "#49372d" },
  { name: "Dining Table", size: [1.7, 0.8, 1.0], color: "#49372d" },
  { name: "Kitchen Island", size: [2.0, 0.95, 0.9], color: "#34383c" },
  { name: "Refrigerator", size: [0.8, 2.0, 0.75], color: "#343a40" },
  { name: "Bookshelf", size: [1.0, 1.9, 0.35], color: "#49372d" }
];

function Box({ position, size, color, roughness = 0.78, metalness = 0, castShadow = true, receiveShadow = true, radius }) {
  return <mesh position={position} castShadow={castShadow} receiveShadow={receiveShadow}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
  </mesh>;
}

function Cylinder({ position, args, color, rotation = [0, 0, 0], metalness = 0 }) {
  return <mesh position={position} rotation={rotation} castShadow>
    <cylinderGeometry args={args} />
    <meshStandardMaterial color={color} roughness={0.55} metalness={metalness} />
  </mesh>;
}

function Lamp({ position }) {
  return <group position={position}>
    <Cylinder position={[0, 0.8, 0]} args={[0.025, 0.025, 1.6, 12]} color="#25272a" />
    <Cylinder position={[0, 1.62, 0]} args={[0.22, 0.3, 0.28, 24]} color="#c2a16a" />
    <pointLight position={[0, 1.5, 0]} intensity={1.2} distance={4} color="#ffcf8a" />
  </group>;
}

function Sofa({ color = "#303b46" }) {
  return <group>
    <Box position={[0, .28, 0]} size={[2.45, .42, .9]} color="#282b30" />
    <Box position={[0, .72, -.34]} size={[2.45, .72, .22]} color={color} />
    {[-1.15, 1.15].map(x => <Box key={x} position={[x, .53, 0]} size={[.18, .58, .9]} color={color} />)}
    {[-.72, 0, .72].map(x => <Box key={x} position={[x, .52, .12]} size={[.72, .18, .56]} color={color} />)}
    {[-.95, .95].map(x => <group key={x} position={[x, .68, .1]} rotation={[0, 0, -.12]}>
      <Box position={[0, 0, 0]} size={[.42, .38, .16]} color="#b09a83" />
    </group>)}
    {[-1, 1].map(x => [-.32, .32].map(z => <Cylinder key={`${x}-${z}`} position={[x, .1, z]} args={[.045, .045, .2, 10]} color="#17191d" />))}
  </group>;
}

function Bed({ dark = "#343b45" }) {
  return <group>
    <Box position={[0, .2, 0]} size={[2.25, .34, 2.05]} color="#282a2e" />
    <Box position={[0, .48, .05]} size={[2.16, .25, 1.96]} color="#d0c7bb" />
    <Box position={[0, .64, .48]} size={[2.12, .09, 1.05]} color={dark} />
    {[-.55, .55].map(x => <Box key={x} position={[x, .69, -.65]} size={[.78, .16, .45]} color="#eee8df" />)}
    <Box position={[0, .88, -1.02]} size={[2.28, 1.05, .13]} color="#493a31" />
    {[-.94, .94].map(x => [-.86, .86].map(z => <Box key={`${x}-${z}`} position={[x, .1, z]} size={[.08, .2, .08]} color="#211c19" />))}
  </group>;
}

function Wardrobe({ color = "#49372d" }) {
  return <group>
    <Box position={[0, 1.15, 0]} size={[1.5, 2.3, .65]} color={color} />
    {[-.37, .37].map(x => <group key={x}>
      <Box position={[x, 1.15, .333]} size={[.72, 2.2, .025]} color="#705844" />
      <Cylinder position={[x + (x < 0 ? .22 : -.22), 1.15, .37]} args={[.035, .035, .08, 12]} color="#c39a58" rotation={[Math.PI / 2, 0, 0]} metalness={.7} />
    </group>)}
  </group>;
}

function DiningTable({ color = "#49372d" }) {
  return <group>
    <Box position={[0, .78, 0]} size={[1.8, .13, 1.05]} color={color} />
    {[-.72, .72].map(x => [-.38, .38].map(z => <Box key={`${x}-${z}`} position={[x, .38, z]} size={[.1, .76, .1]} color="#27221e" />))}
    {[-1, 1].map(x => <group key={x} position={[x * 1.25, 0, 0]}>
      <Box position={[0, .48, 0]} size={[.58, .12, .58]} color="#343b42" />
      <Box position={[0, .85, -.23]} size={[.58, .72, .1]} color="#343b42" />
      {[-.22, .22].map(a => [-.22, .22].map(b => <Box key={`${a}-${b}`} position={[a, .23, b]} size={[.055, .46, .055]} color="#28221d" />))}
    </group>)}
  </group>;
}

function KitchenRun() {
  return <group>
    {/* Base cabinets and dark stone worktop */}
    <Box position={[0, .48, 0]} size={[4.0, .92, .62]} color="#34383c" />
    <Box position={[0, .98, 0]} size={[4.12, .12, .72]} color="#282d32" roughness={.28} />
    {[-1.45, -.48, .48, 1.45].map(x => <group key={x}>
      <Box position={[x, .48, .317]} size={[.88, .82, .025]} color="#55504a" />
      <Box position={[x, .48, .34]} size={[.025, .62, .02]} color="#b28b54" />
    </group>)}
    {/* Upper cabinets */}
    {[-1.35, -.45, .45, 1.35].map(x => <group key={x}>
      <Box position={[x, 2.05, -.12]} size={[.86, .78, .48]} color="#292e33" />
      <Box position={[x, 2.05, .13]} size={[.82, .73, .025]} color="#44413d" />
      <Cylinder position={[x + .28, 2.05, .17]} args={[.018, .018, .06, 8]} color="#c49b5e" rotation={[Math.PI / 2, 0, 0]} />
    </group>)}
    {/* Sink and tap */}
    <Box position={[-1.18, 1.05, .03]} size={[.72, .025, .42]} color="#a6a9a8" roughness={.22} metalness={.65} />
    <Cylinder position={[-1.18, 1.2, -.1]} args={[.025, .025, .28, 12]} color="#b7babb" metalness={.8} />
    <Cylinder position={[-1.18, 1.33, -.22]} args={[.025, .025, .24, 12]} color="#b7babb" rotation={[Math.PI / 2, 0, 0]} metalness={.8} />
    {/* Hob */}
    <Box position={[1.15, 1.06, .02]} size={[.78, .025, .48]} color="#17191c" roughness={.2} metalness={.4} />
    {[[-.18, -.1], [.18, -.1], [-.18, .1], [.18, .1]].map(([x, z]) => <Cylinder key={`${x}-${z}`} position={[1.15 + x, 1.085, z]} args={[.075, .075, .012, 20]} color="#777b7d" metalness={.7} />)}
    {/* Oven */}
    <Box position={[1.15, .48, .34]} size={[.78, .48, .035]} color="#171a1e" roughness={.25} metalness={.3} />
    <Box position={[1.15, .49, .365]} size={[.58, .28, .018]} color="#343d44" roughness={.18} metalness={.2} />
    {/* Refrigerator */}
    <Box position={[2.55, 1.12, -.05]} size={[.86, 2.22, .82]} color="#6c7478" roughness={.25} metalness={.55} />
    <Box position={[2.55, 1.12, .37]} size={[.82, .018, .025]} color="#272b30" />
    <Box position={[2.9, 1.55, .43]} size={[.025, .42, .035]} color="#c5c7c7" metalness={.7} />
  </group>;
}

function TVConsole() {
  return <group>
    <Box position={[0, .36, 0]} size={[2.25, .58, .48]} color="#282c31" />
    {[-.72, 0, .72].map(x => <Box key={x} position={[x, .36, .25]} size={[.66, .48, .025]} color="#45413c" />)}
    <Box position={[0, 1.35, -.05]} size={[2.2, 1.25, .1]} color="#101419" roughness={.15} metalness={.25} />
    <Box position={[0, 1.35, .01]} size={[2.08, 1.13, .018]} color="#182d3a" roughness={.12} />
  </group>;
}

function Plant({ position, scale = 1 }) {
  return <group position={position} scale={scale}>
    <Cylinder position={[0, .22, 0]} args={[.2, .15, .42, 20]} color="#574337" />
    {[0, 1, 2, 3, 4].map(i => <mesh key={i} position={[Math.sin(i * 1.25) * .18, .65 + (i % 2) * .12, Math.cos(i * 1.25) * .16]} rotation={[.25, i, -.35]}>
      <coneGeometry args={[.12, .65, 8]} />
      <meshStandardMaterial color={i % 2 ? "#3c6049" : "#547454"} roughness={.9} />
    </mesh>)}
  </group>;
}

function RoomShell() {
  const wall = "#d0cbc2";
  return <group>
    {/* Overall floor plate */}
    <Box position={[0, -.12, 0]} size={[14, .24, 11]} color="#6d6258" />
    {/* Flooring: dark oak appearance */}
    <Box position={[0, .015, 0]} size={[13.85, .035, 10.85]} color="#78614f" />
    {Array.from({ length: 22 }).map((_, i) => <Box key={i} position={[-6.55 + i * .62, .04, 0]} size={[.012, .008, 10.7]} color="#4d4036" castShadow={false} />)}
    {/* Exterior rear and side walls; front is open for dollhouse view */}
    <Box position={[0, 1.55, -5.42]} size={[14, 3.1, .16]} color={wall} />
    <Box position={[-6.92, 1.55, 0]} size={[.16, 3.1, 11]} color={wall} />
    <Box position={[6.92, 1.55, 0]} size={[.16, 3.1, 11]} color={wall} />
    {/* Bedroom partitions at rear */}
    <Box position={[-2.45, 1.45, -3.15]} size={[.12, 2.9, 4.45]} color="#bcb6ad" />
    <Box position={[2.25, 1.45, -3.15]} size={[.12, 2.9, 4.45]} color="#bcb6ad" />
    {/* Front partition line with door openings left clear */}
    <Box position={[-4.6, 1.45, -.92]} size={[4.55, 2.9, .12]} color="#bcb6ad" />
    <Box position={[0.35, 1.45, -.92]} size={[3.65, 2.9, .12]} color="#bcb6ad" />
    <Box position={[5.65, 1.45, -.92]} size={[2.45, 2.9, .12]} color="#bcb6ad" />
    {/* Kitchen divider partial */}
    <Box position={[-4.45, 1.35, -2.95]} size={[.12, 2.7, 4.0]} color="#c4beb5" />
    {/* Windows */}
    {[-4.7, 0, 4.65].map(x => <group key={x}>
      <Box position={[x, 2.05, -5.31]} size={[1.55, 1.15, .035]} color="#b7d1da" roughness={.15} metalness={.1} />
      <Box position={[x, 2.05, -5.27]} size={[.045, 1.2, .045]} color="#eee8df" />
      <Box position={[x, 2.05, -5.27]} size={[1.6, .045, .045]} color="#eee8df" />
    </group>)}
    {/* Room thresholds */}
    {[-4.7, 0, 4.55].map(x => <Box key={x} position={[x, .07, -.92]} size={[1.15, .09, .2]} color="#b49b7d" />)}
    {/* Wall skirting */}
    <Box position={[0, .12, -5.29]} size={[13.7, .18, .08]} color="#e3ded5" />
  </group>;
}

function RoomLabels() {
  const labels = [
    ["LIVING HALL", 0, 2.25],
    ["KITCHEN", -4.55, -3.95],
    ["BEDROOM 1", -.05, -3.95],
    ["BEDROOM 2", 4.55, -3.95]
  ];
  return <>{labels.map(([label, x, z]) => <Html key={label} position={[x, .16, z]} center distanceFactor={13} style={{ pointerEvents: "none" }}>
    <div className="room-label">{label}</div>
  </Html>)}</>;
}

function FurnishedHome() {
  return <group>
    <RoomShell />
    {/* Living hall */}
    <group position={[-1.2, 0, 2.45]} rotation={[0, Math.PI, 0]}><Sofa /></group>
    <group position={[-1.15, 0, 4.0]}><Box position={[0, .28, 0]} size={[1.35, .12, .75]} color="#49372d" /><Cylinder position={[-.52, .14, -.25]} args={[.035, .035, .25, 10]} color="#25201c" /><Cylinder position={[.52, .14, -.25]} args={[.035, .035, .25, 10]} color="#25201c" /></group>
    <group position={[3.55, 0, 1.35]} rotation={[0, -Math.PI / 2, 0]}><TVConsole /></group>
    <group position={[4.5, 0, 3.3]}><Plant position={[0, 0, 0]} scale={1.1} /></group>
    <group position={[-5.55, 0, 3.3]}><Lamp position={[0, 0, 0]} /></group>
    <group position={[1.8, 0, 3.8]}><DiningTable color="#46372d" /></group>
    <Plant position={[-3.2, 0, 4.1]} scale={.8} />
    {/* Kitchen - rear left */}
    <group position={[-4.5, 0, -4.75]} rotation={[0, Math.PI, 0]}><KitchenRun /></group>
    <group position={[-4.15, 0, -2.35]}><Box position={[0, .48, 0]} size={[1.55, .95, .8]} color="#33383d" /><Box position={[0, 1, 0]} size={[1.65, .12, .9]} color="#292d32" /></group>
    {/* Bedroom 1 */}
    <group position={[-.25, 0, -3.25]}><Bed dark="#39414a" /></group>
    <group position={[-1.75, 0, -4.35]}><Wardrobe color="#3e3029" /></group>
    <group position={[-1.85, 0, -1.45]}><Box position={[0, .32, 0]} size={[.55, .64, .55]} color="#49372d" /><Lamp position={[0, .64, 0]} /></group>
    <group position={[1.35, 0, -4.45]}><Box position={[0, .42, 0]} size={[1.25, .84, .55]} color="#49372d" /><Box position={[0, .88, -.08]} size={[1.28, .08, .62]} color="#292d32" /></group>
    {/* Bedroom 2 */}
    <group position={[4.55, 0, -3.25]}><Bed dark="#34423e" /></group>
    <group position={[5.8, 0, -4.45]}><Wardrobe color="#34383a" /></group>
    <group position={[3.0, 0, -4.35]}><Box position={[0, .36, 0]} size={[.65, .72, .62]} color="#44372f" /><Lamp position={[0, .72, 0]} /></group>
    <group position={[5.85, 0, -1.45]}><Box position={[0, .42, 0]} size={[1.15, .84, .55]} color="#383b3d" /><Box position={[0, .88, -.08]} size={[1.18, .08, .62]} color="#292d32" /></group>
    <RoomLabels />
  </group>;
}

function FurnitureModel({ item }) {
  switch (item.name) {
    case "Sofa": return <Sofa color={item.color} />;
    case "Bed": return <Bed dark={item.color} />;
    case "Dining Table": return <DiningTable color={item.color} />;
    case "Wardrobe": return <Wardrobe color={item.color} />;
    case "TV Unit": return <TVConsole />;
    case "Kitchen Island": return <group><Box position={[0, .48, 0]} size={[2, .95, .9]} color={item.color}/><Box position={[0, 1, 0]} size={[2.08, .12, .98]} color="#252a30"/></group>;
    case "Refrigerator": return <Box position={[0, 1, 0]} size={item.size} color={item.color}/>;
    case "Bookshelf": return <group><Box position={[0, .95, 0]} size={item.size} color={item.color}/>{[.4,.9,1.4].map(y=><Box key={y} position={[0,y,.2]} size={[.92,.04,.38]} color="#b18a50"/>)}</group>;
    case "Armchair": return <group><Box position={[0,.3,0]} size={[.9,.45,.85]} color={item.color}/><Box position={[0,.78,-.3]} size={[.9,.75,.2]} color={item.color}/></group>;
    case "Coffee Table": return <group><Box position={[0,.42,0]} size={item.size} color={item.color}/>{[-.5,.5].map(x=>[-.25,.25].map(z=><Box key={`${x}-${z}`} position={[x,.2,z]} size={[.07,.4,.07]} color="#24201d"/>))}</group>;
    default: return <Box position={[0,item.size[1]/2,0]} size={item.size} color={item.color}/>;
  }
}

function EditableFurniture({ item, selected, onSelect, registerObject }) {
  const setRef = useCallback(node => registerObject(item.id, node), [item.id, registerObject]);
  return <group ref={setRef} position={item.position} rotation={[0,item.rotation,0]} onClick={e => { e.stopPropagation(); onSelect(item.id); }}>
    <FurnitureModel item={item}/>
    {selected && <mesh position={[0,item.size[1]/2,0]}><boxGeometry args={[item.size[0]+.16,item.size[1]+.16,item.size[2]+.16]}/><meshBasicMaterial color="#42a5f5" wireframe/></mesh>}
  </group>;
}

export default function InteriorEditor({ roomId = DEFAULT_ROOM_ID }) {
  const [furniture, setFurniture] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("translate");
  const [showMaterials, setShowMaterials] = useState(false);
  const [saved, setSaved] = useState(false);
  const refs = useRef({});
  const selectedFurniture = furniture.find(item => item.id === selectedId);
  const selectedObject = selectedId ? refs.current[selectedId] : null;

  const registerObject = useCallback((id, node) => {
    if (node) refs.current[id] = node;
    else delete refs.current[id];
  }, []);

  const addFurniture = name => {
    const template = CATALOG.find(item => item.name === name);
    if (!template) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item = { ...template, size: [...template.size], id, position: [0, 0, 0], rotation: 0 };
    setFurniture(previous => [...previous, item]);
    setSelectedId(id);
  };

  const updateColor = color => setFurniture(previous => previous.map(item => item.id === selectedId ? { ...item, color } : item));
  const currentFurniture = () => furniture.map(item => {
    const object = refs.current[item.id];
    return object ? { ...item, position: [object.position.x, object.position.y, object.position.z], rotation: object.rotation.y } : item;
  });
  const saveDesign = () => {
    const data = { room_id: roomId, layout: "hall-two-bedrooms-kitchen", furniture: currentFurniture(), saved_at: new Date().toISOString() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = `interior-design-${roomId}.json`; link.click();
    URL.revokeObjectURL(url);
    setSaved(true); window.setTimeout(() => setSaved(false), 1800);
  };
  const removeSelected = () => {
    setFurniture(previous => previous.filter(item => item.id !== selectedId));
    delete refs.current[selectedId]; setSelectedId(null); setShowMaterials(false);
  };

  return <div className="editor-page">
    <header className="top-header">
      <div><h1>3D Home Interior Studio</h1><p>Explore a furnished 2-bedroom home with a living hall and modern kitchen.</p></div>
      <button className="primary-btn" onClick={saveDesign}>{saved ? <FiCheck/> : <FiSave/>}{saved ? "Saved" : "Save Design"}</button>
    </header>
    <div className="editor-layout">
      <aside className="editor-tools">
        <h3>Add Furniture</h3>
        {CATALOG.map(item => <button type="button" className="furniture-item" key={item.name} onClick={() => addFurniture(item.name)}><FiBox/><span>{item.name}</span><FiPlus className="add-icon"/></button>)}
        <hr/>
        <h3>Transform Selected</h3>
        <button className={`furniture-item ${mode === "translate" ? "active" : ""}`} onClick={() => setMode("translate")} disabled={!selectedId}><FiMove/>Move</button>
        <button className={`furniture-item ${mode === "rotate" ? "active" : ""}`} onClick={() => setMode("rotate")} disabled={!selectedId}><FiRotateCw/>Rotate</button>
        <button className="furniture-item" onClick={() => setShowMaterials(v => !v)} disabled={!selectedId}><FiLayers/>Materials</button>
        {showMaterials && selectedFurniture && <div className="material-panel"><h4>Dark & warm finishes</h4><div className="material-colors">{PALETTE.map(color => <button key={color} title={color} aria-label={`Select ${color}`} style={{ backgroundColor: color }} className={selectedFurniture.color === color ? "color-selected" : ""} onClick={() => updateColor(color)}/>)}</div></div>}
        {selectedId && <><hr/><div className="selected-item"><h4>{selectedFurniture?.name}</h4><button className="furniture-item delete-item" onClick={removeSelected}><FiTrash2/>Delete Furniture</button></div></>}
        <hr/>
        <div className="editor-info"><span>Rooms</span><strong>4</strong></div>
        <div className="editor-info"><span>Added Furniture</span><strong>{furniture.length}</strong></div>
        <div className="editor-info"><span>Preview</span><strong>3D Demo Home</strong></div>
        <p className="editor-hint">Drag to orbit · Scroll to zoom · Select furniture to move or rotate.</p>
      </aside>
      <section className="editor-viewer">
        <div className="editor-toolbar"><span>FULL HOME 3D FLOOR PREVIEW</span><span>2 BEDROOMS · HALL · KITCHEN</span></div>
        <div className="editor-canvas">
          <Canvas shadows dpr={[1, 1.75]} camera={{ position: [12, 10, 14], fov: 38, near: .1, far: 100 }} onPointerMissed={() => { setSelectedId(null); setShowMaterials(false); }}>
            <color attach="background" args={["#202832"]}/>
            <ambientLight intensity={0.55}/>
            <hemisphereLight skyColor="#dbe8f1" groundColor="#514235" intensity={1.0}/>
            <directionalLight position={[7, 13, 8]} intensity={2.1} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}/>
            <pointLight position={[-4, 2.6, 2]} intensity={1.1} color="#e8b77d" distance={9}/>
            <pointLight position={[4, 2.5, -3]} intensity={.9} color="#b4c8d8" distance={8}/>
            <Suspense fallback={null}>
              <Environment preset="city"/>
              <FurnishedHome/>
              {furniture.map(item => <EditableFurniture key={item.id} item={item} selected={selectedId === item.id} onSelect={setSelectedId} registerObject={registerObject}/>)}
              {selectedObject && <TransformControls object={selectedObject} mode={mode} size={.8} onMouseUp={() => setFurniture(currentFurniture())}/>}
              <ContactShadows position={[0, .045, 0]} opacity={.35} scale={18} blur={2.5} far={5}/>
            </Suspense>
            <OrbitControls makeDefault enableDamping dampingFactor={.08} minDistance={7} maxDistance={24} maxPolarAngle={Math.PI / 2.03} target={[0, .8, 0]}/>
          </Canvas>
        </div>
      </section>
    </div>
  </div>;
}
