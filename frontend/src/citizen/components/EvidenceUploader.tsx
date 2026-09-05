import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  X, 
  FileCheck,
  AlertCircle,
  Eye
} from 'lucide-react';
import { EvidenceItem } from '../types';

interface EvidenceUploaderProps {
  evidence: EvidenceItem[];
  onChange: (evidence: EvidenceItem[]) => void;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  evidence,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<EvidenceItem | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const processFiles = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    setFileError(null);

    const validItems: EvidenceItem[] = [];
    const MAX_SIZE_MB = 25;

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        setFileError(`"${file.name}" is not a supported file format. Please select image or video files.`);
        continue;
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setFileError(`"${file.name}" exceeds the ${MAX_SIZE_MB}MB maximum limit.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      validItems.push({
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        file,
        name: file.name,
        size: file.size,
        type: isImage ? 'image' : 'video',
        previewUrl,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    if (validItems.length > 0) {
      onChange([...evidence, ...validItems]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset file input value so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveItem = (id: string) => {
    const itemToRemove = evidence.find((item) => item.id === id);
    if (itemToRemove?.previewUrl) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }
    onChange(evidence.filter((item) => item.id !== id));
    if (selectedPreview?.id === id) {
      setSelectedPreview(null);
    }
  };

  return (
    <div className="space-y-3" id="evidence-uploader-component">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-800">
          Visual Evidence (Images & Videos)
        </label>
        <span className="text-xs text-slate-500">
          Upload photos or video clips (Max 25MB each)
        </span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        id="evidence-dropzone"
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-700 bg-blue-50/70'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="evidence-file-input"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-blue-900">
            <UploadCloud className="w-6 h-6 text-blue-900" />
          </div>

          <div className="text-sm text-slate-700">
            <span className="font-semibold text-blue-900 hover:underline">
              Click to browse files
            </span>{' '}
            or drag and drop here
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> JPEG, PNG, WEBP
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <VideoIcon className="w-3.5 h-3.5 text-slate-400" /> MP4, WEBM, MOV
            </span>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {fileError && (
        <div className="flex items-center gap-2 p-2.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {/* Attached Evidence Grid Preview */}
      {evidence.length > 0 && (
        <div className="space-y-2 pt-1" id="evidence-preview-list">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Attached Evidence ({evidence.length} {evidence.length === 1 ? 'file' : 'files'})</span>
            <span className="text-slate-500">
              Total size: {formatFileSize(evidence.reduce((acc, curr) => acc + curr.size, 0))}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="relative group bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs hover:shadow-xs transition-shadow"
              >
                {/* Thumbnail */}
                <div className="h-28 w-full bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  {item.type === 'image' ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-blue-900/10 flex items-center justify-center mb-1 text-blue-900">
                        <VideoIcon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded">
                        VIDEO
                      </span>
                    </div>
                  )}

                  {/* Overlay for quick action */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {item.type === 'image' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPreview(item);
                        }}
                        className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-xs transition-transform hover:scale-105"
                        title="View preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xs transition-transform hover:scale-105"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* File details caption */}
                <div className="p-2 text-[11px] bg-white border-t border-slate-100">
                  <p className="font-medium text-slate-800 truncate" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between text-slate-500 mt-0.5">
                    <span>{formatFileSize(item.size)}</span>
                    <span className="text-emerald-700 flex items-center gap-0.5">
                      <FileCheck className="w-3 h-3" /> Ready
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal image preview */}
      {selectedPreview && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedPreview(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full p-4 overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="text-sm font-semibold text-slate-900 truncate pr-4">
                {selectedPreview.name}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-3 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={selectedPreview.previewUrl}
                alt={selectedPreview.name}
                className="max-h-[65vh] w-auto object-contain rounded"
              />
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Size: {formatFileSize(selectedPreview.size)}</span>
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
