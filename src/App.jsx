import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
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

  // detect philhealth user
  const isPhilHealth = user?.email === 'philhealth@email.com';

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
      let query = supabase
          .from('ClaimForms2')
          .select(`
                cf2_id,
                user_id,
                date_submitted,
                status,
                confinement_info (
                    patient_info (
                        last_name,
                        first_name,
                        middle_name,
                        name_extension
                    )
                )
            `)
          .order('date_submitted', { ascending: false });

      if (!isPhilHealth) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedForms = (data || []).map((form) => {
        const patient = form.confinement_info?.patient_info;
        const fullName = patient
            ? [patient.first_name, patient.middle_name, patient.last_name, patient.name_extension]
                .filter(Boolean).join(' ')
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
      console.error('Error fetching forms:', error.message);
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


  // FOR THE ACCEPT REJECT ACTIONS
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve'|'reject', id }

  const handleApproveReject = (type, id) => {
    setConfirmAction({ type, id });
  };

  const executeApproveReject = async () => {
    if (!confirmAction) return;
    const newStatus = confirmAction.type === 'approve' ? 'Approved' : 'Rejected';
    try {
      setIsLoading(true);
      const { error } = await supabase
          .from('ClaimForms2')
          .update({ status: newStatus })
          .eq('cf2_id', confirmAction.id);
      if (error) throw error;

      // Update local state so table reflects change immediately
      setForms(prev => prev.map(f =>
          f.id === confirmAction.id ? { ...f, status: newStatus } : f
      ));
      setGlobalToast({ message: `Form ${newStatus} successfully.`, type: 'success' });
      setView('dashboard');
    } catch (err) {
      setGlobalToast({ message: `Failed to update status: ${err.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };


  const handleSupabaseSubmit = async (data) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) throw new Error('No authenticated user found. Please log in again.');

    try {
      setIsLoading(true);
      const parseNum = (val) => (val !== '' && val != null) ? parseFloat(val) : null;
      const parseDate = (val) => val || null;

      // ---- PART III ----
      const { data: part3Data, error: part3Error } = await supabase
          .from('Part3_Consumption_Consent')
          .insert([{
            is_benefit_enough:                     data.certifiedEnough,
            enough_hci_fees:                       parseNum(data.hciFeesEnough),
            enough_pf_fees:                        parseNum(data.pfFeesEnough),
            enough_grand_total:                    parseNum(data.grandTotalEnough),
            is_benefit_consumed_or_with_purchases: data.consumedPrior,
            hci_actual_charges:                    parseNum(data.hciActualCharges),
            hci_discount_amount:                   parseNum(data.hciDiscount),
            hci_philhealth_benefit:                parseNum(data.hciPhilhealthBenefit),
            hci_copay_amount:                      parseNum(data.hciAfterDeductionAmount),
            hci_paid_by_member:                    data.hciDeductionPayers?.member || false,
            hci_paid_by_hmo:                       data.hciDeductionPayers?.hmo || false,
            hci_paid_by_others:                    data.hciDeductionPayers?.others || false,
            pf_actual_charges:                     parseNum(data.pfActualCharges),
            pf_discount_amount:                    parseNum(data.pfDiscount),
            pf_philhealth_benefit:                 parseNum(data.pfPhilhealthBenefit),
            pf_copay_amount:                       parseNum(data.pfAfterDeductionAmount),
            pf_paid_by_member:                     data.pfDeductionPayers?.member || false,
            pf_paid_by_hmo:                        data.pfDeductionPayers?.hmo || false,
            pf_paid_by_others:                     data.pfDeductionPayers?.others || false,
            drugs_cost_type:                       data.drugsCostType,
            drugs_amount:                          parseNum(data.drugsAmount),
            diagnostic_cost_type:                  data.diagnosticCostType,
            diagnostic_amount:                     parseNum(data.diagnosticAmount),
            representative_name:                   data.representativeName,
            consent_date_signed:                   parseDate(data.representativeDateSigned),
            representative_relationship:           data.representativeRelationship,
            representative_relationship_others:    data.representativeRelationshipSpecify,
            signing_behalf_reason:                 data.behalfReason,
            signing_behalf_reason_others:          data.behalfReasonSpecify,
            consent_medical_records:               data.consentMedicalRecords,
            consent_liability_free:                data.consentLiabilityFree,
          }])
          .select()
          .single();

      if (part3Error) throw part3Error;

      // ---- PART IV ----
      const { data: part4Data, error: part4Error } = await supabase
          .from('Part4_Certification')
          .insert([{
            hci_representative_name:     data.hci_representative_name,
            designation:  data.designation,
            date:         parseDate(data.date_signed),
            is_certified: data.finalCertification,
          }])
          .select()
          .single();

      if (part4Error) throw part4Error;

      // ---- SPECIAL CONSIDERATION parent row ----
      const sc = data.packages || {};
      const nb = sc.newborn || {};
      const tbPhase = sc.tb_dots_intensive ? 'Intensive Phase'
                    : sc.tb_dots_maintenance ? 'Maintenance Phase'
                    : null;
      const parseInt_ = (val) => (val !== '' && val != null) ? parseInt(val, 10) : null;

      const { data: scRow, error: scError } = await supabase
          .from('special_consideration')
          .insert([{
            confinement_id: data.confinement_id || null,
            zbenefit_code:  parseInt_(sc.z_benefit_code) ?? 0,  // bigint NOT NULL, default 0 if blank
            tbdots_package: tbPhase,
            hiv_lab_number: parseInt_(sc.hiv_lab_number),
          }])
          .select()
          .single();
      if (scError) throw scError;

      const considerationId = scRow.consideration_id;

      // ---- REPETITIVE PROCEDURES (Part a) ----
      const PROC_LABELS = {
        hemodialysis:        'Hemodialysis',
        blood_transfusion:   'Blood Transfusion',
        peritoneal_dialysis: 'Peritoneal Dialysis',
        brachytherapy:       'Brachytherapy',
        radiotherapy_linac:  'Radiotherapy (LINAC)',
        chemotherapy:        'Chemotherapy',
        radiotherapy_cobalt: 'Radiotherapy (COBALT)',
        simple_debridement:  'Simple Debridement',
      };
      const repRows = [];
      Object.entries(data.special_considerations || {}).forEach(([key, val]) => {
        if (!val?.checked) return;
        (val.dates || []).forEach(dateStr => {
          if (!dateStr) return;
          // type="date" already produces yyyy-mm-dd — use directly
          repRows.push({ consideration_id: considerationId, procedure: PROC_LABELS[key], session_date: dateStr });
        });
      });
      if (repRows.length > 0) {
        const { error: repError } = await supabase.from('repetitive_procedure').insert(repRows);
        if (repError) throw repError;
      }

      // ---- ANIMAL BITE PACKAGE (Part e) ----
      const ab = sc.animal_bite || {};
      const biteRows = [
        { vaccine_type: 'Day 0 ARV', date: ab.day_0_arv },
        { vaccine_type: 'Day 3 ARV', date: ab.day_3_arv },
        { vaccine_type: 'Day 7 ARV', date: ab.day_7_arv },
        { vaccine_type: 'RIG',       date: ab.rig },
        { vaccine_type: 'Others',    date: null, others_desc: ab.others || null },
      ].filter(r => r.date || r.others_desc).map(r => ({
        consideration_id: considerationId,
        vaccine_type:     r.vaccine_type,
        date:             r.date || null,   // already yyyy-mm-dd from type="date"
        others_desc:      r.others_desc || null,
      }));
      if (biteRows.length > 0) {
        const { error: biteError } = await supabase.from('animal_bite_package').insert(biteRows);
        if (biteError) throw biteError;
      }

      // ---- MCP PACKAGE (Part c) ----
      const mcpRows = (sc.mcp_dates || [])
        .map((dateStr, idx) => {
          if (!dateStr) return null;
          // type="date" already produces yyyy-mm-dd — use directly
          return { consideration_id: considerationId, checkup_no: idx + 1, checkup_date: dateStr };
        })
        .filter(Boolean);
      if (mcpRows.length > 0) {
        const { error: mcpError } = await supabase.from('mcp_package').insert(mcpRows);
        if (mcpError) throw mcpError;
      }

      // ---- NEWBORN PACKAGE (Part f) ----
      const hasNewborn = Object.values(nb).some(Boolean);
      if (hasNewborn) {
        const { error: nbError } = await supabase.from('newborn_package').insert([{
          consideration_id:     considerationId,
          is_essential:         nb.is_essential         || false,
          is_hearing_screening: nb.is_hearing_screening || false,
          is_screening:         nb.is_screening         || false,
          is_immediate_drying:  nb.is_immediate_drying  || false,
          is_early_skin:        nb.is_early_skin        || false,
          is_cord_clamping:     nb.is_cord_clamping     || false,
          is_eye_prophylaxis:   nb.is_eye_prophylaxis   || false,
          is_weighing:          nb.is_weighing          || false,
          is_vitaminK:          nb.is_vitamink          || false,  // capital K in DB
          is_bcg:               nb.is_bcg               || false,
          is_nonseparation:     nb.is_nonseparation     || false,
          is_hepaB:             nb.is_hepaB             || false,
        }]);
        if (nbError) throw nbError;
      }

      // ---- Update confinement_info with all editable Part II fields ----
      // Clone a new confinement row for this submission
      if (data.confinement_id) {
        const { data: origConf } = await supabase
            .from('confinement_info')
            .select('patient_id')
            .eq('confinement_id', data.confinement_id)
            .single();

        const { data: newConf, error: newConfErr } = await supabase
            .from('confinement_info')
            .insert([{
              patient_id:               origConf.patient_id,
              admission_diagnosis:      data.admission_diagnosis || null,
              is_referred:              data.is_referred ?? null,
              name_referral:            data.name_referral || null,
              building_street_referral: data.building_street_referral || null,
              city_referral:            data.city_referral || null,
              province_referral:        data.province_referral || null,
              zip_referral:             data.zip_referral || null,
              disposition:              data.disposition || null,
              accomodation_type:        data.accomodation_type || null,
              date_time_admitted:       data.date_admitted ? `${data.date_admitted}T${data.time_admitted || '00:00'}:00` : null,
              date_time_discharged:     data.date_discharged ? `${data.date_discharged}T${data.time_discharged || '00:00'}:00` : null,
              date_time_expiration:     data.disposition === 'Expired' && data.date_expiration ? `${data.date_expiration}T${data.time_expiration || '00:00'}:00` : null,
              transferred_hci_name:     data.disposition === 'Transferred/Referred' ? (data.transferred_hci_name || null) : null,
              transferred_street:       data.disposition === 'Transferred/Referred' ? (data.transferred_street || null) : null,
              transferred_city:         data.disposition === 'Transferred/Referred' ? (data.transferred_city || null) : null,
              transferred_province:     data.disposition === 'Transferred/Referred' ? (data.transferred_province || null) : null,
              transferred_zip:          data.disposition === 'Transferred/Referred' ? (data.transferred_zip || null) : null,
              reason_referral:          data.disposition === 'Transferred/Referred' ? (data.reason_referral || null) : null,
            }])
            .select()
            .single();
        if (newConfErr) throw newConfErr;

        // Use the NEW confinement_id for the rest of the submit
        data.confinement_id = newConf.confinement_id;
      }

      // ---- Upsert philhealth_benefits ----
      if (data.confinement_id && (data.philhealth_benefits?.first_case_rate || data.philhealth_benefits?.second_case_rate)) {
        const { error: phError } = await supabase
            .from('philhealth_benefits')
            .upsert({
              confinement_id: data.confinement_id,
              first_case_rate: data.philhealth_benefits.first_case_rate || null,
              second_case_rate: data.philhealth_benefits.second_case_rate || null,
            }, { onConflict: 'confinement_id' });
        if (phError) throw phError;
      }

      // ---- ClaimForms2 master record — ties everything together ----
      const { data: cf2Data, error: cf2Error } = await supabase
          .from('ClaimForms2')
          .insert([{
            user_id:          authUser.id,
            hci_id:           data.hci_id         || null,
            confinement_id:   data.confinement_id || null,
            form2_id:         part3Data.form2_id   || null,
            certification_id: part4Data.certification_id || null,
            status:           'Pending',
          }])
          .select()
          .single();

      if (cf2Error) throw cf2Error;

      // ---- ACCREDITATION / PROFESSIONALS (needs cf2_id from above) ----
      if ((data.professionals || []).length > 0) {
        const accRows = data.professionals.map(p => ({
          cf2_id:               cf2Data.cf2_id,
          accreditation_number: parseInt_(p.accreditation_number),
          date:                 parseDate(p.date),
          is_copay:             p.is_copay || false,
          copay_amount:         parseNum(p.copay_amount),
        }));
        const { error: accError } = await supabase.from('accreditation').insert(accRows);
        if (accError) throw accError;
      }

      // Update local state so dashboard reflects the new row immediately
      setForms(prev => [{
        id:              cf2Data.cf2_id,
        patient_name: `${data.patient_first_name} ${data.patient_last_name}`.trim(),
        status:          'Pending',
        submission_date: new Date().toISOString().split('T')[0],
      }, ...prev]);

        // ---- Discharge Diagnoses insert ----
        if (data.discharge_diagnoses && data.discharge_diagnoses.length > 0) {
            const diagRows = data.discharge_diagnoses
                .filter(d => d.diagnosis?.trim())
                .map(d => ({
                    cf2_id:            cf2Data.cf2_id,
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
          confinement_id,
          status,
          hci_info (*),
          confinement_info (*),
          Part3_Consumption_Consent (*),
          Part4_Certification (*)
        `)
          .eq('cf2_id', claimId)
          .single();

      if (error) throw error;

      if (data) {
        const patient = data.confinement_info || {};
        // Fetch patient name from patient_info
        const { data: patientData } = await supabase
            .from('patient_info')
            .select('*')
            .eq('patient_id', patient.patient_id)
            .maybeSingle();

        const part3 = data.Part3_Consumption_Consent || {};
        const part4 = data.Part4_Certification || {};

        // ---- Fetch special considerations ----
        let scRow = null, repRows = [], biteRows = [], mcpRows = [], nbRow = null;

        console.log('[ViewForm] claimId:', claimId, '| confinement_id:', data.confinement_id);

        const { data: scData, error: scErr } = await supabase
            .from('special_consideration')
            .select('*')
            .eq('confinement_id', data.confinement_id)
            .order('consideration_id', { ascending: false })
            .limit(1);
        console.log('[ViewForm] special_consideration row:', scData, '| error:', scErr);
        scRow = scData?.[0] || null;

        if (scRow?.consideration_id) {
          const [{ data: rData, error: rErr }, { data: bData, error: bErr }, { data: mData, error: mErr }, { data: nData, error: nErr }] = await Promise.all([
            supabase.from('repetitive_procedure').select('*').eq('consideration_id', scRow.consideration_id),
            supabase.from('animal_bite_package').select('*').eq('consideration_id', scRow.consideration_id),
            supabase.from('mcp_package').select('*').eq('consideration_id', scRow.consideration_id),
            supabase.from('newborn_package').select('*').eq('consideration_id', scRow.consideration_id).maybeSingle(),
          ]);
          console.log('[ViewForm] repetitive_procedure:', rData, rErr);
          console.log('[ViewForm] animal_bite_package:', bData, bErr);
          console.log('[ViewForm] mcp_package:', mData, mErr);
          console.log('[ViewForm] newborn_package:', nData, nErr);
          repRows  = rData || [];
          biteRows = bData || [];
          mcpRows  = mData || [];
          nbRow    = nData || null;
        } else {
          console.log('[ViewForm] No special_consideration row found — skipping child table fetches');
        }

        // ---- Fetch philhealth benefits ----
        const { data: phData } = await supabase
            .from('philhealth_benefits')
            .select('*')
            .eq('confinement_id', data.confinement_id)
            .maybeSingle();

        // ---- Fetch accreditation / professionals ----
        const { data: accDataRaw } = await supabase
            .from('accreditation')
            .select('*')
            .eq('cf2_id', claimId)
            .order('accreditation_id', { ascending: true });

        const accData = accDataRaw || [];

        // ---- Fetch discharge diagnoses ----
        const { data: diagData } = await supabase
            .from('discharge_diagnosis')
            .select('*')
            .eq('cf2_id', claimId)
            .order('diagnosis_id', { ascending: true });

        // Group repetitive procedures by name → array of dates
        const repByProcedure = {};
        repRows.forEach(r => {
          if (!repByProcedure[r.procedure]) repByProcedure[r.procedure] = [];
          if (r.session_date) repByProcedure[r.procedure].push(r.session_date);
        });

        // Animal bite helper
        const getBiteDate = (type) => biteRows.find(r => r.vaccine_type === type)?.date || '';
        const getBiteOthers = () => {
          const r = biteRows.find(r => r.vaccine_type === 'Others');
          return r ? (r.others_desc || r.date || '') : '';
        };

        // MCP dates array
        const mcpDates = ['', '', '', ''];
        mcpRows.forEach(r => { if (r.checkup_no >= 1 && r.checkup_no <= 4) mcpDates[r.checkup_no - 1] = r.checkup_date || ''; });

        const mappedDocumentProfile = {
          id: data.cf2_id,

          hci_name_institution: data.hci_info?.hci_name || '',
          pan_number:           data.hci_info?.pan_number || '',
          hci_address_street:   data.hci_info?.hci_address_street || '',
          hci_address_city:     data.hci_info?.hci_address_city || '',
          hci_address_province: data.hci_info?.hci_address_province || '',

          patient_last_name:        patientData?.last_name || '',
          patient_first_name:       patientData?.first_name || '',
          patient_middle_name:      patientData?.middle_name || '',
          patient_name_extension:   patientData?.name_extension || '',
          is_referred:              patient.is_referred,
          name_referral:            patient.name_referral || '',
          building_street_referral: patient.building_street_referral || '',
          city_referral:            patient.city_referral || '',
          province_referral:        patient.province_referral || '',
          zip_referral:             patient.zip_referral || '',
          date_time_admitted:       patient.date_time_admitted || '',
          date_time_discharged:     patient.date_time_discharged || '',
          disposition:              patient.disposition || '',
          accomodation_type:        patient.accomodation_type || '',
          admission_diagnosis:      patient.admission_diagnosis || '',
          discharge_diagnoses:      diagData || [],
            date_time_expiration:  patient.date_time_expiration  || '',
            transferred_hci_name:  patient.transferred_hci_name  || '',
            transferred_street:    patient.transferred_street    || '',
            transferred_city:      patient.transferred_city      || '',
            transferred_province:  patient.transferred_province  || '',
            transferred_zip:       patient.transferred_zip       || '',
            reason_referral:       patient.reason_referral       || '',

          // Special considerations
          special_considerations: {
            repetitive_procedures: repByProcedure,  // { 'Hemodialysis': ['2025-01-01', ...], ... }
            z_benefit_code:        scRow?.zbenefit_code || '',
            tbdots_package:        scRow?.tbdots_package || '',
            hiv_lab_number:        scRow?.hiv_lab_number || '',
            mcp_dates:             mcpDates,
            animal_bite: {
              day_0_arv: getBiteDate('Day 0 ARV'),
              day_3_arv: getBiteDate('Day 3 ARV'),
              day_7_arv: getBiteDate('Day 7 ARV'),
              rig:       getBiteDate('RIG'),
              others:    getBiteOthers(),
            },
            newborn: nbRow ? {
              is_essential:         nbRow.is_essential,
              is_hearing_screening: nbRow.is_hearing_screening,
              is_screening:         nbRow.is_screening,
              is_immediate_drying:  nbRow.is_immediate_drying,
              is_early_skin:        nbRow.is_early_skin,
              is_cord_clamping:     nbRow.is_cord_clamping,
              is_eye_prophylaxis:   nbRow.is_eye_prophylaxis,
              is_weighing:          nbRow.is_weighing,
              is_vitamink:          nbRow.is_vitaminK,
              is_bcg:               nbRow.is_bcg,
              is_nonseparation:     nbRow.is_nonseparation,
              is_hepaB:             nbRow.is_hepaB,
            } : null,
          },

          certifiedEnough:         part3.is_benefit_enough || false,
          hciFeesEnough:           part3.enough_hci_fees || '',
          pfFeesEnough:            part3.enough_pf_fees || '',
          consumedPrior:           part3.is_benefit_consumed_or_with_purchases || false,
          hciActualCharges:        part3.hci_actual_charges || '',
          hciDiscount:             part3.hci_discount_amount || '',
          hciPhilhealthBenefit:    part3.hci_philhealth_benefit || '',
          hciAfterDeductionAmount: part3.hci_copay_amount || '',
          hciDeductionPayers:      { member: part3.hci_paid_by_member, hmo: part3.hci_paid_by_hmo, others: part3.hci_paid_by_others },
          pfActualCharges:         part3.pf_actual_charges || '',
          pfDiscount:              part3.pf_discount_amount || '',
          pfPhilhealthBenefit:     part3.pf_philhealth_benefit || '',
          pfAfterDeductionAmount:  part3.pf_copay_amount || '',
          pfDeductionPayers:       { member: part3.pf_paid_by_member, hmo: part3.pf_paid_by_hmo, others: part3.pf_paid_by_others },
          drugsCostType:           part3.drugs_cost_type || 'none',
          drugsAmount:             part3.drugs_amount || '',
          diagnosticCostType:      part3.diagnostic_cost_type || 'none',
          diagnosticAmount:        part3.diagnostic_amount || '',
          representativeName:                part3.representative_name || '',
          representativeDateSigned:          part3.consent_date_signed || '',
          representativeRelationship:        part3.representative_relationship || '',
          representativeRelationshipSpecify: part3.representative_relationship_others || '',
          behalfReason:            part3.signing_behalf_reason || '',
          behalfReasonSpecify:     part3.signing_behalf_reason_others || '',
          consentMedicalRecords:   part3.consent_medical_records || false,
          consentLiabilityFree:    part3.consent_liability_free || false,

          hci_representative_name:          part4.hci_representative_name || '',
          designation:       part4.designation || '',
          date_signed:       part4.date || '',
          finalCertification: part4.is_certified || false,

          philhealth_benefits: {
            first_case_rate:  phData?.first_case_rate  || '',
            second_case_rate: phData?.second_case_rate || '',
          },

          professionals: (accData || []).map(p => ({
            accreditation_number: p.accreditation_number || '',
            date:                 p.date || '',
            is_copay:             p.is_copay || false,
            copay_amount:         p.copay_amount || '',
          })),
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
      <Layout userEmail={user.email} onLogout={handleLogout} isPhilHealth={isPhilHealth}>
        {/* Global Toast */}
        {globalToast && (
            <Toast
                message={globalToast.message}
                type={globalToast.type}
                onClose={() => setGlobalToast(null)}
            />
        )}

        {/* Approve/Reject Confirm Modal */}
        {confirmAction && ReactDOM.createPortal(
            <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full mx-4 overflow-hidden"
              >
                <div className={`p-6 text-white ${confirmAction.type === 'approve' ? 'bg-emerald-600' : 'bg-red-500'}`}>
                  <h3 className="text-lg font-black tracking-tight capitalize">
                    {confirmAction.type} this claim?
                  </h3>
                  <p className="text-[11px] opacity-70 mt-1">CF-2 Claim Form 2 — ID #{String(confirmAction.id).padStart(9, '0')}</p>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {confirmAction.type === 'approve'
                        ? 'You are about to approve this claim. This action will notify the submitting clinician.'
                        : 'You are about to reject this claim. Please ensure you have reviewed all form details before proceeding.'}
                  </p>
                  <p className="text-[11px] text-slate-400 italic leading-relaxed">
                    This status update will be reflected on the clinician's dashboard immediately.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                        onClick={executeApproveReject}
                        className={`flex-1 px-5 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg ${
                            confirmAction.type === 'approve' ? 'bg-emerald-600' : 'bg-red-500'
                        }`}
                    >
                      Confirm {confirmAction.type}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>,
            document.body
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
                {/* Clinician sidebar — hidden for PhilHealth */}
                {!isPhilHealth && (
                    <aside className="w-full lg:w-72 flex flex-col gap-6">
                      <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-philhealth-yellow">
                        <h3 className="font-bold text-emerald-900 mb-2">New Submission</h3>
                        <p className="text-xs text-slate-500 mb-6 italic">Fill out CF2 claim form here.</p>
                        <button
                            onClick={handleNewSubmission}
                            className="w-full bg-philhealth-green hover:bg-philhealth-green-dark text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2"
                        >
                          <Plus size={20} />
                          Start New Form
                        </button>
                      </div>
                      <div className="bg-philhealth-green rounded-2xl p-6 text-white shadow-xl">
                        <h3 className="text-philhealth-yellow text-[10px] font-bold uppercase mb-6 tracking-widest">
                          Submission Summary
                        </h3>
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between">
                              <span className="text-xs opacity-70">Active Reviews</span>
                              <span className="text-2xl font-bold">{String(stats.pending).padStart(2, '0')}</span>
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
                )}

                {/* PhilHealth gets a compact stats bar above the full-width table */}
                {isPhilHealth && (
                    <div className="w-full flex flex-col gap-6">
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Pending Review', value: stats.pending, color: 'bg-amber-50 border-amber-200 text-amber-700' },
                          { label: 'Approved',       value: stats.approved, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                          { label: 'Rejected',       value: stats.rejected, color: 'bg-red-50 border-red-200 text-red-700' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className={`rounded-2xl border p-5 flex items-center justify-between ${color}`}>
                              <span className="text-xs font-black uppercase tracking-widest opacity-70">{label}</span>
                              <span className="text-3xl font-black">{String(value).padStart(2, '0')}</span>
                            </div>
                        ))}
                      </div>
                      <StatusTable
                          forms={forms}
                          isLoading={isLoading}
                          onView={handleViewFormDetails}
                      />
                    </div>
                )}

                {/* Clinician table */}
                {!isPhilHealth && (
                    <StatusTable
                        forms={forms}
                        isLoading={isLoading}
                        onView={handleViewFormDetails}
                    />
                )}
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
                    isPhilHealth={isPhilHealth}
                    onApprove={(id) => handleApproveReject('approve', id)}
                    onReject={(id) => handleApproveReject('reject', id)}
                />
              </motion.div>
          )}
        </AnimatePresence>
      </Layout>
  );
}