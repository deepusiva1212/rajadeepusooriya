import { useEffect } from "react";

export default function InternshipTerms() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen pt-32 pb-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 bg-white p-10 rounded-sm border border-gray-200 shadow-sm">
        <h1 className="font-display text-4xl font-black text-gray-900 mb-8">Internship Terms & Conditions</h1>
        <div className="prose max-w-none text-gray-600 font-body leading-relaxed space-y-6">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          <h3 className="text-xl font-bold text-gray-900 mt-6">1. Program Rules</h3>
          <p>By applying to the Raja Deepu Sooriya Private Limited Internship Programme, you agree to abide by our corporate guidelines...</p>
          <p><i>(Note to Admin: You can add all your specific internship rules, stipends, and certificate conditions in this file!)</i></p>
        </div>
      </div>
    </div>
  );
}
