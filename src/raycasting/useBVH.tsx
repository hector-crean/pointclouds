/* eslint-disable */
import * as React from 'react'
import { Points,BufferGeometry, MeshBasicMaterial, Mesh } from 'three'
import * as three from 'three'; 
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'

export interface BVHOptions {
  splitStrategy?: 'CENTER' | 'AVERAGE' | 'SAH'
  verbose?: boolean
  setBoundingBox?: boolean
  maxDepth?: number
  maxLeafTris?: number
}

/**
 * Convenience hook to use the bvh mesh library to speed up raycasting on the pointcloud. In the end,
 * have not used it due to lack of time. 
 */

export function usePointsBVH(points: React.MutableRefObject<Points | undefined>, options?: BVHOptions) {
  React.useEffect(() => {
    if (points.current) {

			// BVH Mesh creation
			
			const indices = [];
			const bvhGeometry = points.current.geometry.clone();
			let verticesLength = bvhGeometry.attributes.position.count;
			for ( let i = 0, l = verticesLength; i < l; i ++ ) {
				indices.push( i, i, i );
			}
			bvhGeometry.setIndex( indices );
			const bvhMaterial = new MeshBasicMaterial( { color: 0xff0000 } );
			const bvhMesh = new Mesh( bvhGeometry, bvhMaterial );


      bvhMesh.raycast = acceleratedRaycast
			// add prototype features to buffer geometry
			// @ts-ignore
			bvhMesh.geometry.computeBoundsTree = computeBoundsTree
			// @ts-ignore
      bvhMesh.geometry.disposeBoundsTree = disposeBoundsTree
			// @ts-ignore
      bvhMesh.geometry.computeBoundsTree(options)

      return () => {
				// @ts-ignore
        if (bvhMesh.geometry.boundsTree) {
					// @ts-ignore
          bvhMesh.geometry.disposeBoundsTree()
        }
      }
    }
  }, [points, options])
}