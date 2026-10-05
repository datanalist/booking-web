import { useCallback, useEffect, useRef, useState } from "react";
import { compressImage } from "../../../lib/compressImage";
import { presentProfilePhoto } from "./presentProfilePhoto";

export type ProfilePhotoDraft = {
  photoUrl: string | undefined;
  cropSource: string | undefined;
  onPickFile: (file: File) => void;
  onDeletePhoto: () => void;
  confirmCrop: (croppedDataUrl: string) => void;
  cancelCrop: () => void;
  applyPhoto: (photoUrl: string | undefined) => void;
};

function revokeBlob(url: string | undefined): void {
  if (url !== undefined && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function useCropSource(): {
  cropSource: string | undefined;
  replaceCrop: (next: string | undefined) => void;
} {
  const [cropSource, setCropSource] = useState<string | undefined>(undefined);
  const cropSourceRef = useRef<string | undefined>(undefined);
  const replaceCrop = useCallback((next: string | undefined): void => {
    if (cropSourceRef.current !== next) {
      revokeBlob(cropSourceRef.current);
    }
    cropSourceRef.current = next;
    setCropSource(next);
  }, []);

  useEffect(() => {
    return () => {
      revokeBlob(cropSourceRef.current);
    };
  }, []);

  return { cropSource, replaceCrop };
}

function openCropFromFile(
  file: File,
  replaceCrop: (next: string | undefined) => void,
): void {
  void compressImage(file).then(
    (blob) => {
      replaceCrop(URL.createObjectURL(blob));
    },
    () => undefined,
  );
}

export function useProfilePhotoDraft(
  initialPhoto: string | undefined,
): ProfilePhotoDraft {
  const [photoUrl, setPhotoUrl] = useState(() => presentProfilePhoto(initialPhoto));
  const { cropSource, replaceCrop } = useCropSource();

  const applyPhoto = useCallback(
    (next: string | undefined): void => {
      setPhotoUrl(presentProfilePhoto(next));
      replaceCrop(undefined);
    },
    [replaceCrop],
  );

  const confirmCrop = useCallback(
    (croppedDataUrl: string): void => {
      setPhotoUrl(croppedDataUrl);
      replaceCrop(undefined);
    },
    [replaceCrop],
  );

  return {
    photoUrl,
    cropSource,
    onPickFile: (file: File) => {
      openCropFromFile(file, replaceCrop);
    },
    onDeletePhoto: () => {
      setPhotoUrl(undefined);
    },
    confirmCrop,
    cancelCrop: () => {
      replaceCrop(undefined);
    },
    applyPhoto,
  };
}
