import { useState, useEffect } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const ADMIN_EMAIL = "deepusiva2017@gmail.com"; 

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [applications, setApplications] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setUser(currentUser);
        fetchApplications();
      } else {
        setUser(null);
        if (currentUser) signOut(auth);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        alert("Access Denied: You are not authorized to view this dashboard.");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const fetchApplications = async () => {
    setLoadingData(true);
    try {
      const q = query(collection(db, "applications"), orderBy("submittedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const dateStr = data.submittedAt ? data.submittedAt.toDate().toLocaleDateString() : "Just now";
        return { id: doc.id, ...data, dateStr };
      });
      setApplications(apps);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoadingData(false);
  };

  if (loadingAuth) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-body">
        <div className="bg-white p-10 rounded-sm shadow-xl w-full max-w-md border-t-4 border-corp-red">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-corp-red text-white font-black text-xl flex items-center justify-center rounded-sm mx-auto mb-4">RDS</div>
            <h1 className="font-display text-2xl font-black text-gray-900">Admin Portal</h1>
            <p className="text-gray-500 text-sm mt-2">Authorized Personnel Only</p>
          </div>
          <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 py-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm tracking-widest uppercase transition-colors rounded-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /><path fill="none" d="M1 1h22v22H1z" /></svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <header className="bg-corp-blue text-white py-4 px-8 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-corp-red font-black flex items-center justify-center rounded-sm text-sm">RDS</div>
          <span className="font-bold tracking-widest uppercase text-sm">Enterprise Dashboard</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-300 hover:text-white uppercase tracking-widest font-bold">Logout</button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-display text-3xl font-black text-gray-900 mb-2">Internship Applications</h2>
            <p className="text-gray-500 text-sm">Manage and review candidates for the 2026-27 programme.</p>
          </div>
          <button onClick={fetchApplications} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-sm text-xs font-bold tracking-widest uppercase hover:bg-gray-50 flex items-center gap-2">
            {loadingData ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">ID & Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Candidate</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Education</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Brand Track</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">No applications found.</td></tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-corp-red mb-1">{app.applicationId || "N/A"}</div>
                        <div className="text-sm text-gray-500">{app.dateStr}</div>
                      </td>
                      <td className="px-6 py-4"><div className="font-bold text-gray-900">{app.name}</div></td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{app.college} ({app.year})</div>
                        <div className="text-xs text-gray-500">{app.stream}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${app.brand && app.brand.includes('MyTripRaja') ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                          {app.brand ? app.brand.split(' ')[0] : ''}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">{app.duration}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{app.role || "Any"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        <div>P: {app.phone}</div>
                        {app.altPhone && <div className="text-xs text-gray-400 mt-0.5">A: {app.altPhone}</div>}
                        <div className="text-xs text-blue-600 mt-1">{app.email}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
