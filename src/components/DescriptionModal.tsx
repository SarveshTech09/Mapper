import { useState } from "react";
import { X } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string) => void;
  initialDescription: string;
}

export default function DescriptionModal({
  isOpen,
  onClose,
  onSave,
  initialDescription,
}: DescriptionModalProps) {
  const [description, setDescription] = useState(initialDescription);

  if (!isOpen) return null;

  const modules = {
    toolbar: true,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Product Description</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="mb-4">
          <ReactQuill
            theme="snow"
            value={description}
            onChange={setDescription}
            modules={modules}
            style={{ background: "#fff",}}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(description);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Save Description
          </button>
        </div>
      </div>
    </div>
  );
}