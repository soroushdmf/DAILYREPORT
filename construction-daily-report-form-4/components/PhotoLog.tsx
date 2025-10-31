import React, { useRef, useState, useCallback } from 'react';
import { PhotoLogEntry } from '../types';
import { resizeImage } from '../utils/fileUtils';
import IconButton from './IconButton';
import SectionCard from './SectionCard';
import GeminiButton from './GeminiButton';
import { PhotographIcon, PlusIcon, TrashIcon } from './icons';

interface PhotoLogProps {
  photos: PhotoLogEntry[];
  setPhotos: (photos: PhotoLogEntry[] | ((prev: PhotoLogEntry[]) => PhotoLogEntry[])) => void;
  onGenerateCaptions: (photoIds: string[]) => void;
  isGeneratingCaptions: boolean;
}

const PhotoLog = React.forwardRef<HTMLDivElement, PhotoLogProps>(
  ({ photos, setPhotos, onGenerateCaptions, isGeneratingCaptions }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const newPhotoEntries: PhotoLogEntry[] = Array.from(files).map(file => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file: file,
        previewUrl: '',
        caption: '',
        isLoading: true,
        progress: 0,
      }));

      setPhotos(prev => [...prev, ...newPhotoEntries]);

      for (const entry of newPhotoEntries) {
        try {
          const previewUrl = await resizeImage(entry.file!, 1024, (progress) => {
            setPhotos(prev => prev.map(p => p.id === entry.id ? { ...p, progress } : p));
          });
          setPhotos(prev => prev.map(p => p.id === entry.id ? { ...p, previewUrl, isLoading: false, progress: 100 } : p));
        } catch (error) {
          console.error("Error processing image:", error);
          setPhotos(prev => prev.filter(p => p.id !== entry.id));
        }
      }
      
      if (event.target) {
        event.target.value = "";
      }
    }, [setPhotos]);

    const handleRemovePhoto = (id: string) => {
      setPhotos(prev => prev.filter(photo => photo.id !== id));
      setSelectedPhotos(prev => prev.filter(photoId => photoId !== id));
    };
    
    const handleCaptionChange = (id: string, caption: string) => {
      setPhotos(prev => prev.map(photo => (photo.id === id ? { ...photo, caption } : photo)));
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
          setSelectedPhotos(photos.map(p => p.id));
        } else {
          setSelectedPhotos([]);
        }
    };
    
    const handleSelectItem = (id: string, isChecked: boolean) => {
        if (isChecked) {
          setSelectedPhotos(prev => [...prev, id]);
        } else {
          setSelectedPhotos(prev => prev.filter(itemId => itemId !== id));
        }
    };

    const isAllSelected = photos.length > 0 && selectedPhotos.length === photos.length;

    const handleGenerateClick = () => {
        onGenerateCaptions(selectedPhotos);
    };

    return (
      <SectionCard
        id="photos"
        ref={ref}
        title="Photo Log"
        actions={
            <div className="flex items-center gap-2">
                 <GeminiButton
                    onClick={handleGenerateClick}
                    isLoading={isGeneratingCaptions}
                    disabled={selectedPhotos.length === 0 || isGeneratingCaptions}
                >
                    {isGeneratingCaptions ? 'Generating...' : `Generate Captions (${selectedPhotos.length})`}
                </GeminiButton>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                >
                    <PlusIcon />
                    Add Photos
                </button>
            </div>
        }
      >
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        {photos.length > 0 ? (
          <div className="space-y-4">
             <div className="flex items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700">
                <input 
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-blue-600 border-slate-300 dark:border-slate-500 dark:bg-slate-600 rounded focus:ring-blue-500"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all photos"
                />
                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedPhotos.length} of {photos.length} selected
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map(photo => (
                <div key={photo.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm relative">
                    <div className="absolute top-2 left-2 z-10">
                        <input 
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600 border-slate-300 dark:border-slate-500 dark:bg-slate-600 rounded focus:ring-blue-500"
                            checked={selectedPhotos.includes(photo.id)}
                            onChange={(e) => handleSelectItem(photo.id, e.target.checked)}
                            aria-label={`Select photo`}
                        />
                    </div>
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-700">
                    {photo.isLoading || !photo.previewUrl ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-11/12 bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${photo.progress || 0}%` }}></div>
                            </div>
                             <p className="text-sm text-slate-500 mt-2">Processing...</p>
                        </div>
                    ) : (
                        <img src={photo.previewUrl} alt="Log preview" className="object-cover w-full h-full" />
                    )}
                    </div>
                    <div className="p-4">
                    <textarea
                        value={photo.caption}
                        onChange={e => handleCaptionChange(photo.id, e.target.value)}
                        placeholder="Add a caption..."
                        rows={3}
                        spellCheck={true}
                        className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                    </div>
                    <div className="absolute top-2 right-2 z-10">
                        <IconButton
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="text-white bg-black bg-opacity-40 hover:bg-red-600"
                        >
                            <TrashIcon />
                        </IconButton>
                    </div>
                </div>
                ))}
            </div>
          </div>
        ) : (
            <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition"
                onClick={() => fileInputRef.current?.click()}
            >
                <PhotographIcon />
                <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">Add Photos</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Click or drag and drop to upload images.</p>
            </div>
        )}
      </SectionCard>
    );
  }
);

export default PhotoLog;