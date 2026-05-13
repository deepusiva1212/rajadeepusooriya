import { useState } from "react";

export default function ResumeUpload({ resumeFile, setResumeFile }) {
  const [fileError, setFileError] = useState("");

  const handleFileChange = (e) => {
    setFileError(""); 
    const file = e.target.files[0];
    if (!file) return;

    // Validate File Size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File is too large. Maximum size is 5MB.");
      setResumeFile(null);
      e.target.value = null; 
      return;
    }

    // Validate File Type
    const allowedTypes = [
      "application/pdf", 
      "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Invalid file type. Please upload a PDF or Word Document.");
      setResumeFile(null);
      e.target.value = null;
      return;
    }

    setResumeFile(file); // Save the actual file object!
  };

  return (
    <div className="p-4 border border-dashed border-gray-300 bg-white rounded-sm">
      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">
        Upload Resume / CV (PDF or Word) <span className="text-corp-red">*</span>
      </label>
      
      <input 
        type="file" 
        required 
        accept=".pdf,.doc,.docx" 
        onChange={handleFileChange} 
        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-bold file:tracking-widest file:uppercase file:bg-corp-blue file:text-white hover:file:bg-corp-blue-mid cursor-pointer transition-colors" 
      />
      
      {fileError && <div className="text-xs text-corp-red mt-2 font-bold bg-red-50 p-2 rounded-sm inline-block">⚠ {fileError}</div>}
      {resumeFile && !fileError && <div className="text-xs text-green-600 mt-2 font-bold">✓ Attached: {resumeFile.name}</div>}
      <p className="text-[10px] text-gray-400 mt-2">Max file size: 5MB</p>
    </div>
  );
}
