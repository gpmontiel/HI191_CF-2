import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Layout from './pages/Layout.jsx';
import LoginForm from './pages/LoginForm.jsx';
import StatusTable from "./pages/StatusTable.jsx";
import SubmissionForm from "./pages/SubmissionForm.jsx";
import { Plus } from 'lucide-react';

// Mock data
const MOCK_FORMS = [
  {
    id: 'PH-2023-001',
    patient_name: 'Dela Cruz, Juan',
    form_type: 'CF2 Claim',
    status: 'Approved',
    submission_date: '2023-11-20',
    physician_id: '1',
  },
  {
    id: 'PH-2023-002',
    patient_name: 'Santos, Maria',
    form_type: 'CF2 Claim',
    status: 'Pending',
    submission_date: '2023-11-22',
    physician_id: '1',
  },
  {
    id: 'PH-2023-003',
    patient_name: 'Bautista, David',
    form_type: 'CF2 Claim',
    status: 'In Review',
    submission_date: '2023-11-23',
    physician_id: '1',
  },
  {
    id: 'PH-2023-004',
    patient_name: 'Garcia, Elena',
    form_type: 'CF2 Claim',
    status: 'Rejected',
    submission_date: '2023-11-15',
    physician_id: '1',
  },
];

export default function App() {
  const [user, setUser] = React.useState(null);
  const [view, setView] = React.useState('dashboard');
  const [forms, setForms] = React.useState(MOCK_FORMS);
  const [isLoading, setIsLoading] = React.useState(false);

  const stats = {
    pending: forms.filter(
        (f) => f.status === 'Pending' || f.status === 'In Review'
    ).length,
    approved: forms.filter((f) => f.status === 'Approved').length,
    rejected: forms.filter((f) => f.status === 'Rejected').length,
  };

  const handleLogin = (email) => {
    setIsLoading(true);

    setTimeout(() => {
      setUser({ email });
      setIsLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  const handleNewSubmission = () => setView('form');

  const handleCancelSubmission = () => setView('dashboard');

  const handleSubmitForm = (data) => {
    const newForm = {
      id: `PH-${new Date().getFullYear()}-${String(
          forms.length + 1
      ).padStart(3, '0')}`,
      patient_name: data.patient_name,
      form_type: 'CF2 Claim',
      status: 'Pending',
      submission_date: new Date()
          .toISOString()
          .split('T')[0],
      physician_id: '1',
    };

    setForms([newForm, ...forms]);
    setView('dashboard');
  };

  // 🔐 LOGIN SCREEN
  if (!user) {
    return (
        <LoginForm
            onLogin={handleLogin}
            isLoading={isLoading}
        />
    );
  }

  return (
      <Layout
          userEmail={user.email}
          onLogout={handleLogout}
      >
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
              <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col lg:flex-row gap-6"
              >
                {/* LEFT SIDEBAR */}
                <aside className="w-full lg:w-72 flex flex-col gap-6">
                  {/* NEW FORM */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-philhealth-yellow">
                    <h3 className="font-bold text-emerald-900 mb-2">
                      New Submission
                    </h3>

                    <p className="text-xs text-slate-500 mb-6 italic">
                      Fill out CF2 claim form here.
                    </p>

                    <button
                        onClick={handleNewSubmission}
                        className="w-full bg-philhealth-green hover:bg-philhealth-green-dark text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      Start New Form
                    </button>
                  </div>

                  {/* STATS */}
                  <div className="bg-philhealth-green rounded-2xl p-6 text-white shadow-xl">
                    <h3 className="text-philhealth-yellow text-[10px] font-bold uppercase mb-6 tracking-widest">
                      Submission Summary
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between">
                          <span className="text-xs opacity-70">
                            Active Reviews
                          </span>
                          <span className="text-2xl font-bold">
                            {String(stats.pending).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="h-1.5 bg-emerald-950/40 rounded-full overflow-hidden">
                          <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(stats.pending / forms.length) * 100}%` }}
                              className="h-full bg-philhealth-yellow"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* TABLE */}
                <StatusTable
                    forms={forms}
                    onView={(id) => console.log('View', id)}
                />
              </motion.div>
          ) : (
              <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
              >
                <SubmissionForm
                    onSubmit={handleSubmitForm}
                    onCancel={handleCancelSubmission}
                />
              </motion.div>
          )}
        </AnimatePresence>
      </Layout>
  );
}