"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import Button from "@/components/ui/Button";
import { Upload, Crop, X, Check } from "lucide-react";

interface ThumbnailCropperProps {
  onCropped: (blob: Blob) => void;
  aspectRatio?: number;
}

async function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // eBook cover size: 600x800 (3:4 ratio)
  canvas.width = 600;
  canvas.height = 800;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
  });
}

export default function ThumbnailCropper({ onCropped, aspectRatio = 3 / 4 }: ThumbnailCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropping, setCropping] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, etc.)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCrop() {
    if (!imageSrc || !croppedAreaPixels) return;
    setCropping(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropped(blob);
    } catch (err) {
      console.error("Crop error:", err);
      alert("Error cropping image. Please try again.");
    } finally {
      setCropping(false);
    }
  }

  if (!imageSrc) {
    return (
      <div>
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/30 p-8 transition-colors hover:border-teal-500/50 hover:bg-gray-800/50">
          <Upload className="h-8 w-8 text-gray-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">Upload thumbnail</p>
            <p className="mt-1 text-xs text-gray-600">JPG, PNG — will be cropped to eBook format (3:4)</p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative h-80 w-full overflow-hidden rounded-xl border border-gray-700 bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Zoom:</label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-teal-500"
        />
      </div>

      <div className="flex gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setImageSrc(null)}
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleCrop}
          loading={cropping}
        >
          <Check className="h-4 w-4" />
          Crop & Use
        </Button>
      </div>
    </div>
  );
}
