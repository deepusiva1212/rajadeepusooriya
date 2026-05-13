import { useEffect } from "react";

export default function InternshipPrivacy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen pt-32 pb-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 bg-white p-10 rounded-sm border border-gray-200 shadow-sm">
        <h1 className="font-display text-4xl font-black text-gray-900 mb-8">Internship Privacy Policy</h1>
        <div className="prose max-w-none text-gray-600 font-body leading-relaxed space-y-6">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          <h3 className="text-xl font-bold text-gray-900 mt-6">1. Data Collection</h3>
          <p>The personal, academic, and contact information collected during this application will be used solely for the purpose of recruitment and HR processing at Raja Deepu Sooriya Private Limited...</p>
          <p><i>(Note to Admin: You can update your data protection policies here!)</i></p>
        </div>
      </div>
    </div>
  );
}
