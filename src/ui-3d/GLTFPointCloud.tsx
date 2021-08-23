/* eslint-disable */

import React, { FC, useState, useRef, useMemo, useEffect } from 'react';
import { Vector3, Points, ShaderMaterial, Object3D} from 'three';
import { ObjectMap, useThree } from '@react-three/fiber'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import glsl from 'glslify'; 
import { meshBounds, useBVH } from '@react-three/drei'


/**
 * SHADER for pointcloud points: 
 * 	- we can manipulate the position of the geometry in the vertex shader, but nothing has been done here
 * 	- we use the fragment shader to selectively render the points based on whether they lie within chosen bounds. This
 * 	helps to reduce the number of points that need to be rendered.
 */
const vertexShader =  glsl`

		/*
		💉 injected uniforms: <- injected as a matter of course by three.js. 
		uniform mat4 modelMatrix; ✅ 			// = object.matrixWorld
		uniform mat4 modelViewMatrix; ✅ 	// = camera.matrixWorldInverse * object.matrixWorld
		uniform mat4 projectionMatrix; ✅ 	// = camera.projectionMatrix
		uniform mat4 viewMatrix; ✅				// = camera.matrixWorldInverse
		uniform mat3 normalMatrix; ✅			// = inverse transpose of modelViewMatrix
		uniform vec3 cameraPosition; ✅		// = camera position in world space
		*/

		uniform float uPointSize;
		uniform vec3 uClippingLow;
		uniform vec3 uCippingHigh;
		uniform vec3 uRaycastIntersectionPoint; 
		// uniform vec4[] uClippingPlanes;

		/*
		 💉 injected attributes: <- from inspecing the gltf file, we know the ✅ attributes will be parsed in by the gltf loader
		attribute vec3 position; //POSITION ✅
		attribute vec3 normal; //NORMAL
		attribute vec3 tangent; //TANGENT
		attribute vec2 uv; //TEXCOORD_0
		attribute vec2 uv2; //TEXCOORD_1
		attribute vec4 color; //COLOR_0 ✅
		attribute vec3 skinWeight; //WEIGHTS_0
		attribute vec3 skinIndex; //JOINTS_0
		*/

		varying vec4 vWorldSpaceCoordinates; 
		varying vec4 vViewSpaceCoordinates; 
		varying vec4 vClipSpaceCoordinates; 
		varying vec4 vColor; 

		varying vec3 vCameraPosition; 

	void main() {
		vColor = color; 
		vCameraPosition = cameraPosition; 

		// position: coordinates w.r.t local/model space
		// position = position - uEffectivePointCloudOrigin; 
		// vWorldSpaceCoordinates: coordinates w.r.t world space. 'modelMatrix' transforms from local to world space
		vWorldSpaceCoordinates = modelMatrix * vec4( position, 1.0 );
		// vViewSpaceCoordinates: coodinates w.r.t camera space
		vViewSpaceCoordinates = viewMatrix * vWorldSpaceCoordinates; 
		// gl_Position: coordinates w.r.t homogenous space
		gl_Position = projectionMatrix * vViewSpaceCoordinates; 
		// gl_PointSize:
		gl_PointSize = uPointSize;

	}`


	const fragmentShader = glsl`



	
		/*
		💉 injected uniforms: <- injected as a matter of course by three.js. 
		uniform mat4 modelMatrix; ✅ 			// = object.matrixWorld
		uniform mat4 modelViewMatrix; ✅ 	// = camera.matrixWorldInverse * object.matrixWorld
		uniform mat4 projectionMatrix; ✅ 	// = camera.projectionMatrix
		uniform mat4 viewMatrix; ✅				// = camera.matrixWorldInverse
		uniform mat3 normalMatrix; ✅			// = inverse transpose of modelViewMatrix
		uniform vec3 cameraPosition; ✅		// = camera position in world space
		*/

		// uniform sampler2D uTexture;
		uniform vec3 uClippingLow;
		uniform vec3 uCippingHigh;
		uniform vec3 uRaycastIntersectionPoint; 
		// uniform vec4[] uClippingPlanes;


		varying vec4 vWorldSpaceCoordinates; 
		varying vec4 vViewSpaceCoordinates; 
		varying vec4 vClipSpaceCoordinates; 
		varying vec4 vColor; 
		varying vec3 vCameraPosition; 

	
		float bijectionFromRealsToUnit(float x){
			return (2.0*x - 1.0)/(x - x*x); 
		}

		float distanceBetweenPoints(vec3 a, vec3 b){
			return length(b-a);
		}

	void main() {

		float radius = distanceBetweenPoints(vWorldSpaceCoordinates.xyz, uRaycastIntersectionPoint);
		vec4 fragColor = vColor;
		float haloDistance = float(1.0); 
		if ( (haloDistance - 0.3) < radius && radius < (haloDistance+0.3)
		) {
			fragColor = vec4(0.0, 0.0, 1.0, 1.0); 
		} 
		if ( (haloDistance*2.0 - 0.3) < radius && radius < (haloDistance*2.0 +0.3)
		) {
			fragColor = vec4(0.0, 1.0, 0.0, 1.0); 
		} 
		if ( (haloDistance*3.0 - 0.3) < radius && radius < (haloDistance*3.0 +0.3)
		) {
			fragColor = vec4(1.0, 0.0, 0.0, 1.0); 
		} 

		gl_FragColor = fragColor; 

		
		// -- TODO: we could implement clipping planes as follows:
		// vec4 plane; // where 𝑛 = [x, y, z] is the normal vector of the plane, and w is the constant offset value from the origin
		// #pragma unroll_loop_start
		// 		for ( int i = 0; i < 3; i ++ ) {
		// 			plane = uClippingPlanes[ i ];
		// 			if ( dot( vWorldSpaceCoordinates.xyz , plane.xyz ) > plane.w ) discard;  			
		// 		}
		// #pragma unroll_loop_end


	}`; 


const DynamicUniformsPoints: FC<{
	pointsBufferGeometry: Points['geometry'],
	uRaycastIntersectionPoint: Vector3,
	uPointSize: number,
	uClippingLow: Vector3,
	uClippingHigh: Vector3,
	renderLayer: number; 
}> = (props) => {

	const materialRef = useRef<ShaderMaterial>(null!)

	const uniforms = useMemo(() =>{
		return {
		uRaycastIntersectionPoint: {value: props.uRaycastIntersectionPoint},
		uPointSize: {value: props.uPointSize},
		uClippingLow: {value: props.uClippingLow},
		uClippingHigh: { value: props.uClippingHigh }
		}
	},[])



	/**
	 * We drive ui behaviour by dynamically changing the unfiforms that we give to the
	 * shaders. This seems to be very slow. Fairly difficult to force three.js to update
	 * shader uniforms - perhaps uniforms are cached?
	 * 
	 * Below we feed in a uniform that describes the position in world space that the pointer
	 * has clicked on. 
	 */
	const { raycaster, scene, gl, camera} = useThree(); 
	useEffect(() => {

		const onDblClickDocument = (e: MouseEvent) => {
			const intersections = raycaster.intersectObject(scene, true)
			if ( intersections.length > 0) {
				materialRef.current.uniforms.uRaycastIntersectionPoint.value = intersections[0].point;
				materialRef.current.uniformsNeedUpdate = true;
				materialRef.current.needsUpdate = true;
			}
		}
		
		document.addEventListener('dblclick', onDblClickDocument, false)
		 return () => document.removeEventListener('dblclick', onDblClickDocument)
	}, [])

	return (
		<points
		layers={props.renderLayer}
		geometry={props.pointsBufferGeometry}
		>      
		<shaderMaterial
			attach="material"
			ref={materialRef}
			uniforms={uniforms}
			vertexShader={vertexShader} 
			fragmentShader={fragmentShader}
			alphaTest={0}
			depthWrite={true}
			vertexColors={true}
			// needsUpdate={true}
			// uniformsNeedUpdate={true}
		/>
	</points>
	)
}


const GLTFPointCloud: FC<{
  gltf: GLTF & ObjectMap;
	setMeasureToolPoints: React.Dispatch<React.SetStateAction<Vector3[]>>;
	setObjectsInFocus: React.Dispatch<React.SetStateAction<Object3D[]>>;
 }
 > = (props) => {


	const { raycaster, scene} = useThree(); 
	useEffect(() => {
		const onClickDocument = (e: MouseEvent) => {
			const intersections = raycaster.intersectObject(scene, true)
			if ( intersections.length > 0) {
				props.setMeasureToolPoints((prevState) => {return [...prevState, 	intersections[0].point]})
				props.setObjectsInFocus([intersections[0].object])
			}
		}
		document.addEventListener('click', onClickDocument, false)
		 return () => document.removeEventListener('click', onClickDocument)
	}, [])

  const nodeKeys = Object.keys(props.gltf.nodes);

  return (
		<>
      {nodeKeys.map((nodeKey, index) => {

        const [bufferGeometry] = useState((props.gltf.nodes as {[name: string]: Points})[nodeKey].geometry);

				/* // -- Possibly advantageous to use a bvh mesh to facilitate raycasting
				const bvhMesh = useMemo(() => {
					// BVH Mesh creation
					const indices = [];
					const bvhGeometry = bufferGeometry.clone();
					let verticesLength = bvhGeometry.attributes.position.count;
					for ( let i = 0, l = verticesLength; i < l; i ++ ) {
						indices.push( i, i, i );
					}
					bvhGeometry.setIndex( indices );
					const bvhMaterial = new MeshBasicMaterial( { color: 0xff0000 } );
					return new Mesh( bvhGeometry, bvhMaterial );
				}, [bufferGeometry])
				const bvhMeshRef = useRef(bvhMesh); 
				useBVH(bvhMeshRef); 
				*/


        return (

					<DynamicUniformsPoints
						key={`${nodeKeys}-${index}`}
						pointsBufferGeometry ={bufferGeometry}
						uRaycastIntersectionPoint={new Vector3()}
						uPointSize={0.5}
						uClippingLow={new Vector3()}
						uClippingHigh={new Vector3()}
						renderLayer={1} 
						/>

        );
      })}
				
	</>


  );
};


export default GLTFPointCloud; 