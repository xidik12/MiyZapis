import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

// Renders a scannable barcode (CODE128) from a value, for printing on labels.
const Barcode: React.FC<{ value: string; height?: number }> = ({ value, height = 38 }) => {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: 'CODE128',
          width: 1.4,
          height,
          fontSize: 11,
          margin: 2,
          displayValue: true,
        });
      } catch { /* invalid value — render nothing */ }
    }
  }, [value, height]);
  return <svg ref={ref} className="mx-auto max-w-full" />;
};

export default Barcode;
