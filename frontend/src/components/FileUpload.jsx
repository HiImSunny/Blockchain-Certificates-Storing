import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

const FileUpload = ({ onFileSelect, accept = '.pdf,.jpg,.jpeg,.png', disabled = false }) => {
    const [dragActive, setDragActive] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);

            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                setSelectedFile(file);
                onFileSelect(file);
            }
        },
        [onFileSelect]
    );

    const handleChange = useCallback(
        (e) => {
            e.preventDefault();
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setSelectedFile(file);
                onFileSelect(file);
            }
        },
        [onFileSelect]
    );

    return (
        <div className="w-full">
            <div
                className={`
          relative border-2 border-dashed p-8
          flex flex-col items-center justify-center gap-4
          transition-colors duration-200
          ${dragActive ? 'border-primary bg-primary bg-opacity-5' : 'border-neutral-gray bg-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {selectedFile ? (
                    <>
                        <FileText size={48} className="text-primary" />
                        <div className="text-center">
                            <p className="font-medium text-neutral-dark">{selectedFile.name}</p>
                            <p className="text-sm text-neutral-gray">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <Upload size={48} className="text-neutral-gray" />
                        <div className="text-center">
                            <p className="font-medium text-neutral-dark">
                                Drop your certificate here or click to browse
                            </p>
                            <p className="text-sm text-neutral-gray mt-1">
                                Supports PDF, JPG, PNG (max 10MB)
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
