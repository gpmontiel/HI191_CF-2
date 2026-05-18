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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <ReadOnlyDisplay label="Full Name of Patient" value={data.patient_name} />
                                    <ReadOnlyDisplay label="PhilHealth ID" value={data.philhealth_id} />
                                    <ReadOnlyDisplay label="Age" value={data.age ? `${data.age} Years Old` : ''} />
                                    <ReadOnlyDisplay label="Patient Sex" value={data.sex} />
                                </div>
                            )}

                            {/* PART II */}
                            {currentStep === 2 && (
                                <div className="space-y-8">
                                    <ReadOnlyDisplay label="Diagnosis" value={data.diagnosis} isTextArea={true} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <ReadOnlyDisplay label="ICD-10 Code" value={data.icd10_code} />
                                        <ReadOnlyDisplay label="Admission Date" value={data.admission_date} />
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

                                        {data.certifiedEnough ? (
                                            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-6">
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
                                        ) : data.consumedPrior ? (
                                            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-8">
                                                <div className="text-amber-800 font-bold text-xs uppercase tracking-wider">
                                                    ✓ The benefit of the member/patient was completely consumed prior to co-pay OR the benefit of the member/patient is not completely consumed BUT with
                                                    purchases/expenses for drugs/medicines, supplies, diagnostics and others.
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
                                        ) : (
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