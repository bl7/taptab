import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

export interface StyledQRCodeHandle {
  download: (filename?: string, type?: 'png' | 'svg' | 'jpeg') => void;
}

interface StyledQRCodeProps {
  value: string;
  size?: number;
  logo?: string; // Path to logo image (SVG/PNG)
}

const StyledQRCode = forwardRef<StyledQRCodeHandle, StyledQRCodeProps>(
  ({ value, size = 240, logo = '/qr-logo.svg' }, ref) => {
    const qrRef = useRef<QRCodeStyling>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      qrRef.current = new QRCodeStyling({
        width: size,
        height: size,
        data: value,
        image: logo,
        dotsOptions: {
          color: '#00932A',
          type: 'classy-rounded',
        },
        backgroundOptions: {
          color: '#F6F8F7',
        },
        cornersSquareOptions: {
          color: '#00932A',
          type: 'classy-rounded',
        },
        cornersDotOptions: {
          color: '#00932A',
          type: 'classy',
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 2,
          imageSize: 0.35,
        },
      });
      const container = containerRef.current;
      if (container) {
        container.innerHTML = '';
        qrRef.current.append(container);
      }
      return () => {
        if (container) container.innerHTML = '';
      };
    }, [value, size, logo]);

    useImperativeHandle(ref, () => ({
      download: (filename = 'qr-code', type = 'png') => {
        qrRef.current?.download({ name: filename, extension: type });
      },
    }), []);

    return (
      <div
        ref={containerRef}
        style={{
          width: size,
          height: size,
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
          border: '6px solid #fff',
          display: 'inline-block',
        }}
      />
    );
  }
);

StyledQRCode.displayName = 'StyledQRCode';

export default StyledQRCode; 