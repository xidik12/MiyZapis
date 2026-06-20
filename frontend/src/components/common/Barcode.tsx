import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { isValidEan13 } from '@/utils/barcode';

// Renders a scannable barcode for printing on labels. Valid EAN-13 values render
// as a real EAN-13 (so any retail scanner reads them); everything else falls
// back to CODE128, which encodes arbitrary alphanumeric strings.
const Barcode: React.FC<{ value: string; height?: number }> = ({ value, height = 38 }) => {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: isValidEan13(value) ? 'EAN13' : 'CODE128',
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
