export default function ResumeUpload({ resumeFile, setResumeFile }) {
  return (
    <div className="p-4 border border-dashed border-gray-300 bg-gray-50 rounded-sm">
      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">
        Upload Resume / CV (PDF or Word) <span className="text-corp-red">*</span>
      </label>
      
      <input 
        type="file" 
        required 
        accept=".pdf,.doc,.docx" 
        // This updates the file state in your main App.jsx!
        onChange={e => setResumeFile(e.target.files[0])} 
        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-bold file:tracking-widest file:uppercase file:bg-corp-blue file:text-white hover:file:bg-corp-blue-mid cursor-pointer transition-colors" 
      />
      
      {resumeFile && (
        <div className="text-xs text-green-600 mt-2 font-bold">
          ✓ Attached: {resumeFile.name}
        </div>
      )}
      
      <p className="text-[10px] text-gray-400 mt-2">Max file size: 5MB</p>
    </div>
  );
}
