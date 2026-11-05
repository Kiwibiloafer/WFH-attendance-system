import React, { useState } from 'react';
import { getPhotoUrl } from '../../utils/photo';
import { ImageOff } from 'lucide-react';

interface AuthImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export const AuthImage: React.FC<AuthImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const authSrc = getPhotoUrl(src);

  if (!authSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center ${containerClassName || className}`}
      >
        <ImageOff className="w-5 h-5 mb-1 text-slate-400" />
        <span className="text-[10px] text-slate-400 leading-tight">Foto tidak tersedia</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        {...props}
        src={authSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

