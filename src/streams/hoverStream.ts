/* eslint-disable */

/**
 * This module sets up the interfaces and logic behind a stream of pointer events.
 * The UI sends raw values containing information, the distance from the camera, and whether hover is happening or not.
 * Through a series of stream transformations, a new stream can be calculated with the
 * current hover state that takes 3d properly into account.
 * 
 */
 import { omit } from "ramda";
 import type { Stream } from "xstream";
 import {Vector3} from 'three';

 export interface HoverState {
	 pointPosition: Vector3;
 }
 
 const toKey = (rawHoverState: RawHoverState): string =>
	 JSON.stringify({
		pointPosition: rawHoverState.pointPosition,
	 });
 
 const fromKey = (key: string): { pointPosition: Vector3;} =>
	 JSON.parse(key);
 
 export interface RawHoverState {
		pointPosition: Vector3;
	 	hovered: boolean;
	 	distance: number;
 }
 
 interface FoldedHoverState {
	 hoveredEntries: Record<string, number>;
 }
 
 const streamDataFoldFn = (
	 accumulator: FoldedHoverState,
	 current: RawHoverState
 ) => {
	 const key = toKey(current);
	 return {
		 ...accumulator,
		 hoveredEntries: current.hovered
			 ? {
					 ...accumulator.hoveredEntries,
					 [key]: current.distance,
				 }
			 : omit([key], accumulator.hoveredEntries),
	 };
 };
 
 const extractHover = (data: FoldedHoverState): HoverState | null => {
	 const firstHoveredEntry = Object.entries(data.hoveredEntries).sort(
		 ([_key1, distance1], [_key2, distance2]) => distance1 - distance2
	 )[0]?.[0];
	 if (firstHoveredEntry) {
		 return fromKey(firstHoveredEntry);
	 }
	 return null;
 };
 
 export const processStream = (
	 rawStream: Stream<RawHoverState>
 ): Stream<HoverState | null> =>
	 rawStream
		 .fold<FoldedHoverState>(streamDataFoldFn, {
			 hoveredEntries: {},
		 })
		 .map(extractHover);
 
