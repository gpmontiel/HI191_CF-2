import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Layout from './pages/Layout.jsx';
import LoginForm from './pages/LoginForm.jsx';
import StatusTable from "./pages/StatusTable.jsx";
import SubmissionForm from "./pages/SubmissionForm.jsx";
import { Plus } from 'lucide-react';
import {supabase} from "./lib/supabase.js";

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

  const handleLogin = (supabaseUser) => {
    setIsLoading(true);

    // If it's a demo bypass string, use it directly. Otherwise, grab the email property.
    const emailAddress = typeof supabaseUser === 'string'
        ? supabaseUser
        : supabaseUser?.email;

    setUser({ email: emailAddress });
    setIsLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  const handleNewSubmission = () => setView('form');

  const handleCancelSubmission = () => setView('dashboard');

  // FOR SUPABASE SUBMISSION - PART I-IV
  const handleSupabaseSubmit = async (data) => {
    try {
      setIsLoading(true);
      const parseNum = (val) => val ? parseFloat(val) : null;
      const parseDate = (val) => val ? val : null;

      const { error: part3Error } = await supabase
          .from('Part3_Consumption_Consent')
          .insert([
            {
              is_benefit_enough: data.certifiedEnough,
              enough_hci_fees: parseNum(data.hciFeesEnough),
              enough_pf_fees: parseNum(data.pfFeesEnough),
              enough_grand_total: parseNum(data.grandTotalEnough),
              is_benefit_consumed_or_with_purchases: data.consumedPrior,
              hci_actual_charges: parseNum(data.hciActualCharges),
              hci_discount_amount: parseNum(data.hciDiscount),
              hci_philhealth_benefit: parseNum(data.hciPhilhealthBenefit),
              hci_copay_amount: parseNum(data.hciAfterDeductionAmount),
              hci_paid_by_member: data.hciDeductionPayers.member,
              hci_paid_by_hmo: data.hciDeductionPayers.hmo,
              hci_paid_by_others: data.hciDeductionPayers.others,
              pf_actual_charges: parseNum(data.pfActualCharges),
              pf_discount_amount: parseNum(data.pfDiscount),
              pf_philhealth_benefit: parseNum(data.pfPhilhealthBenefit),
              pf_copay_amount: parseNum(data.pfAfterDeductionAmount),
              pf_paid_by_member: data.pfDeductionPayers.member,
              pf_paid_by_hmo: data.pfDeductionPayers.hmo,
              pf_paid_by_others: data.pfDeductionPayers.others,
              drugs_cost_type: data.drugsCostType,
              drugs_amount: parseNum(data.drugsAmount),
              diagnostic_cost_type: data.diagnosticCostType,
              diagnostic_amount: parseNum(data.diagnosticAmount),
              representative_name: data.representativeName,
              consent_date_signed: parseDate(data.representativeDateSigned),
              representative_relationship: data.representativeRelationship,
              representative_relationship_others: data.representativeRelationshipSpecify,
              signing_behalf_reason: data.behalfReason,
              signing_behalf_reason_others: data.behalfReasonSpecify,
              consent_medical_records: data.consentMedicalRecords,
              consent_liability_free: data.consentLiabilityFree
            }
          ]);

      if (part3Error) throw part3Error;

      const { error: part4Error } = await supabase
          .from('Part4_Certification')
          .insert([
            {
              hci_name: data.hci_name,
              designation: data.designation,
              date: parseDate(data.date_signed),
              is_certified: data.finalCertification
            }
          ]);

      if (part4Error) throw part4Error;

      alert('Form submitted successfully to Supabase!');
      setView('dashboard');
    } catch (error) {
      console.error('Supabase Insert Error:', error);
      alert(`Error saving to database: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!user) return <LoginForm onLogin={handleLogin} isLoading={isLoading} />;

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
                    // onSubmit={handleSupabaseSubmit} <- UNCOMMENT IF SUPABASE CONNECTION DONE FOR PART 1 AND PART 2
                    onCancel={() => {
                      if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
                        handleCancelSubmission();
                      }
                    }}
                />
              </motion.div>
          )}
        </AnimatePresence>
      </Layout>
  );
}