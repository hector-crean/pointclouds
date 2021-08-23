/* eslint-disable */

import React, { Suspense, FC, useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { MapControls, AdaptiveEvents, AdaptiveDpr } from '@react-three/drei';
import { Vector3, Box3, Raycaster, Vector2, Event as ThreeEvent, Intersection, Object3D} from 'three';
import {
  LightingPostprocessing,
} from "./effects/LightingPostprocessing";
import { useOutlineEffect, defaultOutlineEffectParams} from './effects/useOutlineEffect'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Loader from './ui-3d/Loader'; 
import GLTFPointCloud from './ui-3d/GLTFPointCloud';
import MeasureTool from './ui-3d/MeasureTool';


const PointCloudMapScene = () => {

	const [objectsInFocus, setObjectsInFocus] = useState<Object3D[]>([])
	console.log(objectsInFocus)
	const [measureToolPoints, setMeasureToolPoints] = useState<Vector3[]>([])

	const small_cloud_url: string = "/small_cloud.glb";

	const gltf = useLoader(GLTFLoader, small_cloud_url)

	// get bounding box of the pointcloud:
	const boundingBox = useMemo(() => new Box3().setFromObject(gltf.scene), []);
	const centreOfBoundingBox = useMemo(() => boundingBox.clone().getCenter(new Vector3()), [boundingBox]); 


	// move camera to vicinity of our pointcloud
	const { camera } = useThree(); 
	useEffect(() => {
		camera.position.lerp(boundingBox.max, 1); 
		camera.lookAt(centreOfBoundingBox); 
		camera.zoom = 1; 
		camera.updateProjectionMatrix(); 
	},[])

	// this outline effect does not work very well...
	// useOutlineEffect(objectsInFocus, defaultOutlineEffectParams); 

  return (
    
		<>
				
				<MeasureTool 
					points={measureToolPoints}
				/>
				<GLTFPointCloud 
					gltf = {gltf}
					setMeasureToolPoints={setMeasureToolPoints}
					setObjectsInFocus={setObjectsInFocus}
				/>

				<ambientLight/>

				<axesHelper/>

				<MapControls 
					enableDamping={true}
					dampingFactor={0.05}
					screenSpacePanning={false}
					maxPolarAngle={Math.PI/2}
					target={centreOfBoundingBox}
					maxDistance={10000000}
				/>

     </>
  );
};


const CanvasWrapper: FC = ({children}) => {

	return (

		
      <Canvas
			style={{
        height: "100vh",
        width: "100vw",
      }}		
				raycaster-params-Points-threshold={0.1}
        onCreated={({ camera, gl, raycaster }) => {
					camera.near = 0.001; 
					camera.far = 2000; 
					camera.up.set(0, 0, 1);
          camera.updateProjectionMatrix();	
					// - layers are a useful feature: we can assign objects to various raycaster/render layers, and then choose which layers to render/raycast for
					raycaster.layers.enable(0)
					raycaster.layers.enable(1)
					raycaster.layers.enable(2)
					camera.layers.enableAll()

        }}
				
			>
				<Suspense fallback={Loader}>
					<PointCloudMapScene/>
				</Suspense>

				<AdaptiveEvents />
				<AdaptiveDpr pixelated />
				<LightingPostprocessing/>

		</Canvas>
		
  );
};


export default CanvasWrapper;


 

