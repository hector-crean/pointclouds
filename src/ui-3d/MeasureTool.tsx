/* eslint-disable */
import React, { useRef, FC} from 'react';
import { Vector3, Mesh } from 'three';
import { Html, Line as LineBufferGeometry} from '@react-three/drei'

/**
 * Simple measure tool, which will draw a connected line between points 
 */
export type MeasureToolProps = {
	points: Vector3[]; 
}
const MeasureTool: FC<MeasureToolProps> = (props) => {

	const meshRef = useRef<Mesh>(null!)
	const linePoints = props.points.length > 1 ? props.points : [new Vector3(), new Vector3()]

	
	return (
	
		<mesh
			ref={meshRef}
			layers={3}
		>
			<LineBufferGeometry 
				points={linePoints}
			/>
      {/* <lineBasicMaterial attach="material" color={new Color('orange')} linewidth={10} linecap={'round'} linejoin={'round'} /> */}
			<meshBasicMaterial/>
		</mesh>

	)
}

export default MeasureTool;