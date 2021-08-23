/* eslint-disable */

import { useRef, useMemo } from "react";
import xs from "xstream";


export function useStream<T>() {
  const sendNext = useRef<null | ((data: T) => void)>(null);

  const stream = useMemo(
    () =>
      xs.create<T>({
        start: (listener) => {
          sendNext.current = listener.next.bind(listener);
        },
        stop: () => {
          sendNext.current = null;
        },
      }),
    []
  );

  return {
    stream,
    sendNext: (val: T) => {
      sendNext.current && sendNext.current(val);
    },
  };
}
