/* eslint-disable */

import React from "react";
import type { FC } from "react";

const InfoPanel: FC<{ data: Array<{ label: string; value: string }> }> = (
  props
) => (
  <div className="absolute z-10 text-gray-500 bottom-12 right-12 space-y-4">
    {props.data.map((d, index) => (
      <div key={index}>
        <p className="text-sm">{d.label}</p>
        <p className="text-3xl">{d.value}</p>
      </div>
    ))}
  </div>
);

export default InfoPanel;
