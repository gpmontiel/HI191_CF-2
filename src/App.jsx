import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Layout from './pages/Layout.jsx';
import LoginForm from './pages/LoginForm.jsx';
import StatusTable from "./pages/StatusTable.jsx";
import SubmissionForm from "./pages/SubmissionForm.jsx";
import ViewForm from "./pages/ViewForm.jsx";
import { Plus } from 'lucide-react';
import { supabase } from "./lib/supabase.js";
import Toast from "./pages/Toast.jsx"

export default function App() {
  const [user, setUser] = React.useState(null);
  const [view, setView] = React.useState('dashboard');
  const [forms, setForms] = useState([]); // Initialized clean, waiting for live data
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedFormData, setSelectedFormData] = useState(null);
    const [globalToast, setGlobalToast] = useState(null);

  // Computed state metrics based directly on real database entries
  const stats = {
    pending: forms.filter(
        (f) => f.status?.toLowerCase() === 'pending' || f.status?.toLowerCase() === 'in review'
    ).length,
    approved: forms.filter((f) => f.status?.toLowerCase() === 'approved').length,
    rejected: forms.filter((f) => f.status?.toLowerCase() === 'rejected').length,
  };

  // 1. UPDATED FETCHING FUNCTION WITH USER FILTER
  const fetchClaimForms = async (userId) => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
          .from('ClaimForms2')
          .select(`
            cf2_id,
            user_id,
            date_submitted,
            status,
            confinement_info (
                last_name,
                first_name,
                middle_name,
                name_extension
            )
          `)
          .eq('user_id', userId)
          .order('date_submitted', { ascending: false });

      if (error) throw error;

      const formattedForms = (data || []).map((form) => {
        const patient = form.confinement_info;
        const fullName = patient
            ? [patient.first_name, patient.middle_name, patient.last_name, patient.name_extension]
                .filter(Boolean)
                .join(' ')
            : 'Unknown Patient';

        return {
          id: form.cf2_id,
          patient_name: fullName,
          submission_date: form.date_submitted,
          status: form.status || 'Pending'
        };
      });

      setForms(formattedForms);
    } catch (error) {
      console.error('Error fetching live tracker lists:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. UPDATED EFFECT HOOK
  useEffect(() => {
    if (user?.id && view === 'dashboard') {
      fetchClaimForms(user.id);
    }
  }, [user, view]);

  // 3. UPDATED LOGIN HANDLER TO CAPTURE USER ID
  const handleLogin = (supabaseUser) => {
    setIsLoading(true);

    // If it's a demo string bypass, mock an ID. Otherwise, read actual Supabase auth metadata.
    if (typeof supabaseUser === 'string') {
      setUser({
        id: supabaseUser === 'phy1' ? 'id_of_phy1_here' : 'id_of_phy2_here',
        email: `${supabaseUser}@example.com`
      });
    } else {
      setUser({
        id: supabaseUser?.id, // Supabase native authenticated UUID
        email: supabaseUser?.email
      });
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
    setForms([]);
  };

  const handleNewSubmission = () => setView('form');
  const handleCancelSubmission = () => setView('dashboard');


  // *---------------- not sure just trying to see if it works (submission) ----------------------------
  const handleSupabaseSubmit = async (data) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) throw new Error('No authenticated user found. Please log in again.');
    try {
      setIsLoading(true);
      const parseNum = (val) => val ? parseFloat(val) : null;
      const parseDate = (val) => val ? val : null;

      // ---- PART III insert first, get its ID ----
      const { data: part3Data, error: part3Error } = await supabase
          .from('Part3_Consumption_Consent')
          .insert([{
            is_benefit_enough:                  data.certifiedEnough,
            enough_hci_fees:                    parseNum(data.hciFeesEnough),
            enough_pf_fees:                     parseNum(data.pfFeesEnough),
            enough_grand_total:                 parseNum(data.grandTotalEnough),
            is_benefit_consumed_or_with_purchases: data.consumedPrior,
            hci_actual_charges:                 parseNum(data.hciActualCharges),
            hci_discount_amount:                parseNum(data.hciDiscount),
            hci_philhealth_benefit:             parseNum(data.hciPhilhealthBenefit),
            hci_copay_amount:                   parseNum(data.hciAfterDeductionAmount),
            hci_paid_by_member:                 data.hciDeductionPayers.member,
            hci_paid_by_hmo:                    data.hciDeductionPayers.hmo,
            hci_paid_by_others:                 data.hciDeductionPayers.others,
            pf_actual_charges:                  parseNum(data.pfActualCharges),
            pf_discount_amount:                 parseNum(data.pfDiscount),
            pf_philhealth_benefit:              parseNum(data.pfPhilhealthBenefit),
            pf_copay_amount:                    parseNum(data.pfAfterDeductionAmount),
            pf_paid_by_member:                  data.pfDeductionPayers.member,
            pf_paid_by_hmo:                     data.pfDeductionPayers.hmo,
            pf_paid_by_others:                  data.pfDeductionPayers.others,
            drugs_cost_type:                    data.drugsCostType,
            drugs_amount:                       parseNum(data.drugsAmount),
            diagnostic_cost_type:               data.diagnosticCostType,
            diagnostic_amount:                  parseNum(data.diagnosticAmount),
            representative_name:                data.representativeName,
            consent_date_signed:                parseDate(data.representativeDateSigned),
            representative_relationship:        data.representativeRelationship,
            representative_relationship_others: data.representativeRelationshipSpecify,
            signing_behalf_reason:              data.behalfReason,
            signing_behalf_reason_others:       data.behalfReasonSpecify,
            consent_medical_records:            data.consentMedicalRecords,
            consent_liability_free:             data.consentLiabilityFree,
          }])
          .select()
          .single();

      if (part3Error) throw part3Error;

      // ---- PART IV insert, get its ID ----
      const { data: part4Data, error: part4Error } = await supabase
          .from('Part4_Certification')
          .insert([{
            hci_name:     data.hci_name,
            designation:  data.designation,
            date:         parseDate(data.date_signed),
            is_certified: data.finalCertification,
          }])
          .select()
          .single();

      if (part4Error) throw part4Error;

        // ---- Update admission_diagnosis on the existing confinement_info row ----
        if (data.confinement_id && data.admission_diagnosis) {
            const { error: confinementError } = await supabase
                .from('confinement_info')
                .update({ admission_diagnosis: data.admission_diagnosis })
                .eq('confinement_id', data.confinement_id);

            if (confinementError) throw confinementError;
        }

      // ---- ClaimForms2 master record — ties everything together ----
      const { data: cf2Data, error: cf2Error } = await supabase
          .from('ClaimForms2')
          .insert([{
            user_id:          authUser.id,
            hci_id:           data.hci_id          || null,
            confinement_id:   data.confinement_id  || null,
            form2_id:         part3Data.id          || null, // FK to Part3
            certification_id: part4Data.id          || null, // FK to Part4
            status:           'Pending',
            // date_submitted and user_id have DB defaults, no need to pass them
          }])
          .select()
          .single();

      if (cf2Error) throw cf2Error;

      // Update local state so dashboard shows the new row immediately
      const newForm = {
        id:               cf2Data.cf2_id,
        patient_name:     `${data.patient_last_name}, ${data.patient_first_name}`,
        form_type:        'CF2 Claim',
        status:           'Pending',
        submission_date:  new Date().toISOString().split('T')[0],
        physician_id:     '1',
      };
      setForms(prev => [newForm, ...prev]);

        // ---- Discharge Diagnoses insert ----
        if (data.discharge_diagnoses && data.discharge_diagnoses.length > 0) {
            const diagRows = data.discharge_diagnoses
                .filter(d => d.diagnosis?.trim()) // skip empty rows
                .map(d => ({
                    confinement_id:    data.confinement_id,
                    diagnosis:         d.diagnosis        || null,
                    icd_code:          d.icd_code         || null,
                    related_procedure: d.related_procedure || null,
                    rvs_code:          d.rvs_code          || null,
                    procedure_date:    d.procedure_date    || null,
                    laterality:        d.laterality        || null,
                }));

            if (diagRows.length > 0) {
                const { error: diagError } = await supabase
                    .from('discharge_diagnosis')
                    .insert(diagRows);

                if (diagError) throw diagError;
            }
        }

      setGlobalToast({ message: 'Form submitted successfully!', type: 'success' });
      setView('dashboard');

    } catch (error) {
      console.error('Supabase Insert Error:', error);
      setGlobalToast({ message: `Error saving to database: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <LoginForm onLogin={handleLogin} isLoading={isLoading} />;

  const handleViewFormDetails = async (claimId) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
          .from('ClaimForms2')
          .select(`
          cf2_id,
          status,
          hci_info (*),
          confinement_info (
            *,
            discharge_diagnosis (*)
          ),
          Part3_Consumption_Consent (*),
          Part4_Certification (*)
        `)
          .eq('cf2_id', claimId)
          .single();

      if (error) throw error;

      if (data) {
        const patient = data.confinement_info || {};
        const part3 = data.Part3_Consumption_Consent || {};
        const part4 = data.Part4_Certification || {};

        // Build object exactly mapping props inside ViewForm
        const mappedDocumentProfile = {
          id: data.cf2_id,

          // Official part I and II
            // Part I - HCI
            hci_name_institution: data.hci_info?.hci_name || '',
            pan_number:           data.hci_info?.pan_number || '',
            hci_address_street:   data.hci_info?.hci_address_street || '',
            hci_address_city:     data.hci_info?.hci_address_city || '',
            hci_address_province: data.hci_info?.hci_address_province || '',

            // Part II - Patient
            patient_last_name:       patient.last_name || '',
            patient_first_name:      patient.first_name || '',
            patient_middle_name:     patient.middle_name || '',
            patient_name_extension:  patient.name_extension || '',
            is_referred:             patient.is_referred,
            name_referral:           patient.name_referral || '',
            building_street_referral: patient.building_street_re || '',
            city_referral:           patient.city_referral || '',
            province_referral:       patient.province_referral || '',
            zip_referral:            patient.zip_referral || '',
            date_time_admitted:      patient.date_time_admitted || '',
            date_time_discharged:    patient.date_time_discharged || '',
            disposition:             patient.disposition || '',
            accomodation_type:       patient.accomodation_type || '',
            admission_diagnosis:     patient.admission_diagnosis || '',
            discharge_diagnoses:     patient.discharge_diagnosis || [],
            date_time_expiration:  patient.date_time_expiration  || '',
            transferred_hci_name:  patient.transferred_hci_name  || '',
            transferred_street:    patient.transferred_street    || '',
            transferred_city:      patient.transferred_city      || '',
            transferred_province:  patient.transferred_province  || '',
            transferred_zip:       patient.transferred_zip       || '',
            reason_referral:       patient.reason_referral       || '',

            // Part III
            certifiedEnough: part3.is_benefit_enough || false,
          hciFeesEnough: part3.enough_hci_fees || '',
          pfFeesEnough: part3.enough_pf_fees || '',
          consumedPrior: part3.is_benefit_consumed_or_with_purchases || false,
          hciActualCharges: part3.hci_actual_charges || '',
          hciDiscount: part3.hci_discount_amount || '',
          hciPhilhealthBenefit: part3.hci_philhealth_benefit || '',
          hciAfterDeductionAmount: part3.hci_copay_amount || '',
          hciDeductionPayers: { member: part3.hci_paid_by_member, hmo: part3.hci_paid_by_hmo, others: part3.hci_paid_by_others },
          pfActualCharges: part3.pf_actual_charges || '',
          pfDiscount: part3.pf_discount_amount || '',
          pfPhilhealthBenefit: part3.pf_philhealth_benefit || '',
          pfAfterDeductionAmount: part3.pf_copay_amount || '',
          pfDeductionPayers: { member: part3.pf_paid_by_member, hmo: part3.pf_paid_by_hmo, others: part3.pf_paid_by_others },
          drugsCostType: part3.drugs_cost_type || 'none',
          drugsAmount: part3.drugs_amount || '',
          diagnosticCostType: part3.diagnostic_cost_type || 'none',
          diagnosticAmount: part3.diagnostic_amount || '',

          representativeName: part3.representative_name || '',
          representativeDateSigned: part3.consent_date_signed || '',
          representativeRelationship: part3.representative_relationship || '',
          representativeRelationshipSpecify: part3.representative_relationship_others || '',
          behalfReason: part3.signing_behalf_reason || '',
          behalfReasonSpecify: part3.signing_behalf_reason_others || '',
          consentMedicalRecords: part3.consent_medical_records || false,
          consentLiabilityFree: part3.consent_liability_free || false,

          hci_name: part4.hci_name || '',
          designation: part4.designation || '',
          date_signed: part4.date || '',
          finalCertification: part4.is_certified || false,
        };

        setSelectedFormData(mappedDocumentProfile);
        setView('view');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Layout
          userEmail={user.email}
          onLogout={handleLogout}
      >
          {/* Global Toast */}
          {globalToast && (
              <Toast
                  message={globalToast.message}
                  type={globalToast.type}
                  onClose={() => setGlobalToast(null)}
              />
          )}

        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
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
                              animate={{ width: `${forms.length ? (stats.pending / forms.length) * 100 : 0}%` }}
                              className="h-full bg-philhealth-yellow"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* LIVE TABLE TRACKER */}
                <StatusTable
                    forms={forms}
                    isLoading={isLoading}
                    onView={handleViewFormDetails}
                />
              </motion.div>
          )}

          {view === 'form' && (
              <motion.div key="form">
                <SubmissionForm
                    onSubmit={handleSupabaseSubmit}
                    onCancel={() => setView('dashboard')}
                />
              </motion.div>
          )}

          {view === 'view' && (
              <motion.div key="view">
                <ViewForm
                    data={selectedFormData}
                    onClose={() => setView('dashboard')}
                />
              </motion.div>
          )}
        </AnimatePresence>
      </Layout>
  );
}