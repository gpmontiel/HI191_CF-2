import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Stethoscope, ClipboardList, CheckSquare, ArrowLeft, ArrowRight } from 'lucide-react';

const STEPS = [
    { id: 1, title: 'Health Care Institution (HCI) Information', icon: <Stethoscope size={20} /> },
    { id: 2, title: 'Patient Confinement Information', icon: <User size={20} /> },
    { id: 3, title: 'Certification of Consumption of Benefits and Consent', icon: <ClipboardList size={20} /> },
    { id: 4, title: 'Certification of Health Care Institution', icon: <CheckSquare size={20} /> },
];

export default function ViewForm({ data, onClose }) {
    const [currentStep, setCurrentStep] = React.useState(1);

    if (!data) return null;

    const grandTotalEnough = data.certifiedEnough
        ? ((parseFloat(data.hciFeesEnough) || 0) + (parseFloat(data.pfFeesEnough) || 0)).toString()
        : '';

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

                {/* Header */}
                <div className="bg-slate-800 text-white p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <ClipboardList size={220} />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-philhealth-yellow" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-philhealth-yellow">
                                  Reviewing Submitted Claim Documents
                                </span>
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">
                                CF-2 Viewer
                            </h2>
                            <p className="opacity-70 text-xs mt-1 uppercase font-bold tracking-widest text-slate-300">
                                Transaction ID: #{String(data.id || '').padStart(9, '0')}
                            </p>
                        </div>

                        {/* Step Indicators */}
                        <div className="flex -space-x-2">
                            {STEPS.map((s) => (
                                <div
                                    key={s.id}
                                    className={`w-10 h-10 rounded-full border-4 border-slate-800 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                        currentStep === s.id
                                            ? 'bg-philhealth-yellow text-slate-900 scale-110 z-10'
                                            : currentStep > s.id
                                                ? 'bg-slate-600 text-white'
                                                : 'bg-slate-700/50 text-white/50'
                                    }`}
                                >
                                    {s.id}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step label */}
                <div className="flex px-8 py-4 bg-slate-50 border-b border-slate-100 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-500">
                          {STEPS[currentStep - 1].icon}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Section {currentStep} of 4
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                                {STEPS[currentStep - 1].title}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ x: 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-10"
                        >
                            {/* PART I */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ReadOnlyDisplay label="HCI Name"                           value={data.hci_name_institution} />
                                        <ReadOnlyDisplay label="PhilHealth Accreditation No. (PAN)" value={data.pan_number} />
                                        <ReadOnlyDisplay label="Street Address"                     value={data.hci_address_street} />
                                        <ReadOnlyDisplay label="City / Municipality"                value={data.hci_address_city} />
                                        <ReadOnlyDisplay label="Province / Region"                  value={data.hci_address_province} />
                                    </div>
                                </div>
                            )}

                            {/* PART II */}
                            {currentStep === 2 && (
                                <div className="space-y-8">

                                    {/* 1. Name */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">1. Name of Patient</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                            <ReadOnlyDisplay label="Last Name"      value={data.patient_last_name} />
                                            <ReadOnlyDisplay label="First Name"     value={data.patient_first_name} />
                                            <ReadOnlyDisplay label="Name Extension" value={data.patient_name_extension} />
                                            <ReadOnlyDisplay label="Middle Name"    value={data.patient_middle_name} />
                                        </div>
                                    </div>

                                    {/* 2. Referred */}
                                    <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                            2. Was patient referred by another HCI?
                                        </p>
                                        <div className="flex gap-4">
                                            <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase border ${data.is_referred === false ? 'bg-philhealth-green text-white border-philhealth-green' : 'bg-white text-slate-300 border-slate-200'}`}>No</span>
                                            <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase border ${data.is_referred === true  ? 'bg-philhealth-green text-white border-philhealth-green' : 'bg-white text-slate-300 border-slate-200'}`}>Yes</span>
                                        </div>
                                        {data.is_referred && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3">
                                                <ReadOnlyDisplay label="Referring HCI"       value={data.name_referral} />
                                                <ReadOnlyDisplay label="Building / Street"   value={data.building_street_referral} />
                                                <ReadOnlyDisplay label="City / Municipality" value={data.city_referral} />
                                                <ReadOnlyDisplay label="Province"            value={data.province_referral} />
                                                <ReadOnlyDisplay label="Zip Code"            value={data.zip_referral} />
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Confinement Period */}
                                    <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">3. Confinement Period</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <ReadOnlyDisplay label="Date Admitted"   value={data.date_time_admitted   ? new Date(data.date_time_admitted).toLocaleDateString('en-PH',   { year:'numeric', month:'long', day:'numeric' }) : ''} />
                                            <ReadOnlyDisplay label="Time Admitted"   value={data.date_time_admitted   ? new Date(data.date_time_admitted).toLocaleTimeString('en-PH',   { hour:'numeric', minute:'2-digit', hour12:true }) : ''} />
                                            <ReadOnlyDisplay label="Date Discharged" value={data.date_time_discharged ? new Date(data.date_time_discharged).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' }) : ''} />
                                            <ReadOnlyDisplay label="Time Discharged" value={data.date_time_discharged ? new Date(data.date_time_discharged).toLocaleTimeString('en-PH', { hour:'numeric', minute:'2-digit', hour12:true }) : ''} />
                                        </div>
                                    </div>

                                    {/* 4. Disposition */}
                                    <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">4. Patient Disposition</p>
                                        <div className="flex flex-wrap gap-3">
                                            {['Improved','Recovered','Home/Discharged Against Medical Advise','Absconded','Expired','Transferred/Referred'].map(opt => (
                                                <span key={opt} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border ${data.disposition === opt ? 'bg-philhealth-green text-white border-philhealth-green' : 'bg-white text-slate-300 border-slate-200'}`}>
                                                    {opt}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Expired */}
                                        {data.disposition === 'Expired' && (
                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 mt-2">
                                                <ReadOnlyDisplay
                                                    label="Date of Expiration"
                                                    value={data.date_time_expiration
                                                        ? new Date(data.date_time_expiration).toLocaleDateString('en-PH', { month:'2-digit', day:'2-digit', year:'2-digit' })
                                                        : ''}
                                                />
                                                <ReadOnlyDisplay
                                                    label="Time of Expiration"
                                                    value={data.date_time_expiration
                                                        ? new Date(data.date_time_expiration).toLocaleTimeString('en-PH', { hour:'numeric', minute:'2-digit', hour12: true })
                                                        : ''}
                                                />
                                            </div>
                                        )}

                                        {/* Transferred/Referred */}
                                        {data.disposition === 'Transferred/Referred' && (
                                            <div className="space-y-4 pt-3 border-t border-slate-200 mt-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Transferred / Referred To:</p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <ReadOnlyDisplay label="HCI Name"             value={data.transferred_hci_name} />
                                                    <ReadOnlyDisplay label="Building / Street"    value={data.transferred_street} />
                                                    <ReadOnlyDisplay label="City / Municipality"  value={data.transferred_city} />
                                                    <ReadOnlyDisplay label="Province"             value={data.transferred_province} />
                                                    <ReadOnlyDisplay label="Zip Code"             value={data.transferred_zip} />
                                                </div>
                                                <ReadOnlyDisplay label="Reason for Referral / Transfer" value={data.reason_referral} />
                                            </div>
                                        )}
                                    </div>

                                    {/* 5. Accommodation */}
                                    <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">5. Type of Accommodation</p>
                                        <div className="flex gap-4">
                                            {['Private','Non-Private (Charity/Service)'].map(opt => (
                                                <span key={opt} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border ${data.accomodation_type === opt ? 'bg-philhealth-green text-white border-philhealth-green' : 'bg-white text-slate-300 border-slate-200'}`}>
                                                    {opt}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 6. Admission Diagnosis */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">6. Admission Diagnosis/es</p>
                                        <ReadOnlyDisplay value={data.admission_diagnosis} isTextArea={true} />
                                    </div>

                                    {/* 7. Discharge Diagnosis  */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">7. Discharge Diagnosis/es</p>
                                        {!data.discharge_diagnoses || data.discharge_diagnoses.length === 0 ? (
                                            <div className="px-5 py-4 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs italic text-slate-300 font-normal">
                                                Left Blank
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto rounded-xl border border-slate-100">
                                                <table className="w-full text-[10px]">
                                                    <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        {['Diagnosis', 'ICD-10 Code', 'Related Procedure', 'RVS Code', 'Date of Procedure', 'Laterality'].map(h => (
                                                            <th key={h} className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-wider">{h}</th>
                                                        ))}
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {data.discharge_diagnoses.map((d, i) => (
                                                        <tr key={d.diagnosis_id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                            <td className="px-4 py-3 font-bold text-slate-700">{d.diagnosis || '—'}</td>
                                                            <td className="px-4 py-3 text-slate-500">{d.icd_code || '—'}</td>
                                                            <td className="px-4 py-3 text-slate-500">{d.related_procedure || '—'}</td>
                                                            <td className="px-4 py-3 text-slate-500">{d.rvs_code || '—'}</td>
                                                            <td className="px-4 py-3 text-slate-500">{d.procedure_date || '—'}</td>
                                                            <td className="px-4 py-3 text-slate-500">{d.laterality || '—'}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            )}

                            {/* PART III */}
                            {currentStep === 3 && (
                                <div className="space-y-12">
                                    {/* SECTION A */}
                                    <section className="space-y-8">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-slate-500 pl-4">
                                            A. CERTIFICATION OF CONSUMPTION OF BENEFITS:
                                        </h3>

                                        {data.certifiedEnough && (
                                            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-6 mb-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3 text-amber-800 font-bold text-xs uppercase tracking-wider">
                                                        ✓ PhilHealth benefit was enough to cover HCI and PF Charges.
                                                    </div>
                                                    <p className="text-[11px] text-amber-700">
                                                        No purchase of drugs/medicines, supplies, diagnostics, and co-pay for professional fees by the member/patient.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-emerald-200/50">
                                                    <ReadOnlyDisplay label="Total HCI Fees" value={data.hciFeesEnough} />
                                                    <ReadOnlyDisplay label="Total Professional Fees" value={data.pfFeesEnough} />
                                                    <ReadOnlyDisplay label="Grand Total" value={grandTotalEnough} />
                                                </div>
                                            </div>
                                        )}

                                        {/* 2. Show Option 2 layout if checked */}
                                        {data.consumedPrior && (
                                            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-8">
                                                <div className="text-amber-800 font-bold text-xs uppercase tracking-wider">
                                                    ✓ The benefit of the member/patient was completely consumed prior to co-pay OR the benefit of the member/patient is not completely consumed BUT with purchases/expenses for drugs/medicines, supplies, diagnostics and others.
                                                </div>

                                                <div className="pt-4 border-t border-amber-200/50">
                                                    <div className="mb-5">
                                                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-700">
                                                            Total Co-Pay Breakdown
                                                        </h4>
                                                    </div>

                                                    {/* HCI Breakdown */}
                                                    <div className="space-y-4 pl-4 border-l-2 border-amber-200">
                                                        <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-wider">
                                                            1. Health Care Institution Fees
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <ReadOnlyDisplay label="Actual Charges" value={data.hciActualCharges} />
                                                            <ReadOnlyDisplay label="After Discount" value={data.hciDiscount} />
                                                            <ReadOnlyDisplay label="PhilHealth Benefit" value={data.hciPhilhealthBenefit} />
                                                            <ReadOnlyDisplay label="Co-pay Amount" value={data.hciAfterDeductionAmount} />
                                                        </div>
                                                        <div className="text-[12px] font-bold text-slate-600">
                                                            Paid by: {[
                                                            data.hciDeductionPayers?.member && 'Member/Patient',
                                                            data.hciDeductionPayers?.hmo && 'HMO',
                                                            data.hciDeductionPayers?.others && 'Others'
                                                        ].filter(Boolean).join(', ') || 'None stated'}
                                                        </div>
                                                    </div>

                                                    {/* PF Breakdown */}
                                                    <div className="space-y-4 pl-4 border-l-2 border-amber-200 mt-6">
                                                        <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                                                            2. Professional Fees
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <ReadOnlyDisplay label="Actual Charges" value={data.pfActualCharges} />
                                                            <ReadOnlyDisplay label="After Discount" value={data.pfDiscount} />
                                                            <ReadOnlyDisplay label="PhilHealth Benefit" value={data.pfPhilhealthBenefit} />
                                                            <ReadOnlyDisplay label="Co-pay Amount" value={data.pfAfterDeductionAmount} />
                                                        </div>
                                                        <div className="text-[12px] font-bold text-slate-600">
                                                            Paid by: {[
                                                            data.pfDeductionPayers?.member && 'Member/Patient',
                                                            data.pfDeductionPayers?.hmo && 'HMO',
                                                            data.pfDeductionPayers?.others && 'Others'
                                                        ].filter(Boolean).join(', ') || 'None stated'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Outside Purchases */}
                                                <div className="pt-4 border-t border-amber-200/50">
                                                    <div className="mb-4">
                                                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-700">
                                                            Purchases/Expenses Not Included in HCI Charges
                                                        </h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <ReadOnlyDisplay
                                                            label="Total Cost of Purchased Medicines & Supplies"
                                                            value={data.drugsCostType === 'amount' ? data.drugsAmount : 'None'}
                                                        />
                                                        <ReadOnlyDisplay
                                                            label="Total Diagnostic & Laboratory Costs"
                                                            value={data.diagnosticCostType === 'amount' ? data.diagnosticAmount : 'None'}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 3. Fallback text if neither is checked */}
                                        {!data.certifiedEnough && !data.consumedPrior && (
                                            <p className="text-xs text-slate-400 italic">No structural benefit configurations declared.</p>
                                        )}
                                    </section>

                                    {/* SECTION B */}
                                    <section className="space-y-6 pt-8 border-t border-slate-200">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-slate-500 pl-4">
                                            B. CONSENT TO ACCESS PATIENT RECORD/S
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <ReadOnlyDisplay label="Name of Member/Patient/Authorized Representative" value={data.representativeName} />
                                            <ReadOnlyDisplay label="Date" value={data.representativeDateSigned} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl">
                                            <ReadOnlyDisplay label="Relationship to Patient" value={data.representativeRelationship === 'Others' ? `Others: ${data.representativeRelationshipSpecify}` : data.representativeRelationship || 'Self'} />
                                            <ReadOnlyDisplay label="Reason for signing on behalf" value={data.behalfReason === 'Others' ? `Others: ${data.behalfReasonSpecify}` : data.behalfReason || 'N/A'} />
                                        </div>
                                        <div
                                            className={`p-6 rounded-xl text-xs font-bold border ${
                                                data.consentMedicalRecords
                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                    : 'bg-red-50 text-red-800 border-red-200'
                                            }`}
                                        >
                                            {data.consentMedicalRecords ? '✓ I hereby consent to the submission and examination of the patient’s pertinent medical records for the purpose of verifying the veracity of this claim to effect\n' +
                                                'efficient processing of benefit payment.' : '✗ Consent to access medical records NOT indicated.'}
                                        </div>
                                        <div
                                            className={`p-6 rounded-xl text-xs font-bold border ${
                                                data.consentLiabilityFree
                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                    : 'bg-red-50 text-red-800 border-red-200'
                                            }`}
                                        >
                                            {data.consentLiabilityFree ? '✓ I hereby hold PhilHealth or any of its officers, employees and/or representatives free from any and all legal liabilities relative to the herein-mentioned consent ' +
                                                'which I have voluntarily and willingly given in connection with this claim for reimbursement before PhilHealth.' : '✗ Liability release signature NOT indicated.'}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* PART IV */}
                            {currentStep === 4 && (
                                <div className="space-y-8">
                                    <ReadOnlyDisplay label="Name of Authorized HCI Representative" value={data.hci_name} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <ReadOnlyDisplay label="Official Capacity/Designation" value={data.designation} />
                                        <ReadOnlyDisplay label="Date" value={data.date_signed} />
                                    </div>
                                    <div
                                        className={`p-6 rounded-xl text-xs font-bold border ${
                                            data.finalCertification
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                : 'bg-red-50 text-red-800 border-red-200'
                                        }`}
                                    >
                                        {data.finalCertification ? '✓ Document officially certified true and correct by the representative.' : '✗ Document lacks official final certification endorsement.'}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={currentStep === 1 ? onClose : prevStep}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all flex items-center gap-2 group"
                    >
                        {currentStep === 1 ? 'Exit Viewer' : <><ArrowLeft size={14} /> Previous</>}
                    </button>

                    {currentStep === 4 ? (
                        <button
                            onClick={onClose}
                            className="px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] bg-slate-800 text-white hover:bg-slate-900 transition-all active:scale-95 shadow-md"
                        >
                            Close Document
                        </button>
                    ) : (
                        <button
                            onClick={nextStep}
                            className="px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] bg-slate-800 text-white hover:bg-slate-900 transition-all active:scale-95 shadow-md flex items-center gap-2"
                        >
                            Next Section <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReadOnlyDisplay({ label, value, isTextArea = false }) {
    return (
        <div className="space-y-1.5 w-full">
            <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider block">
                {label}
            </span>
            <div className={`w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 shadow-inner select-all ${
                isTextArea ? 'min-h-[100px] whitespace-pre-wrap' : ''
            }`}>
                {value || <span className="text-slate-300 font-normal italic">Left Blank</span>}
            </div>
        </div>
    );
}