/* eslint-disable */

import React from 'react';
import { useProgress, Html } from "@react-three/drei";


const Loader = () => {
  const { progress } = useProgress();
  return <Html center>{Number(progress).toFixed(2)} % loaded</Html>;
};
export default Loader; 