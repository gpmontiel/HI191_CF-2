import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Stethoscope, ClipboardList, CheckSquare, ArrowLeft, Save, ArrowRight } from 'lucide-react';
import { supabase } from "../lib/supabase.js";
import Toast from '../pages/Toast.jsx';

const STEPS = [
    { id: 1, title: 'Health Care Institution (HCI) Information', icon: <Stethoscope size={20} /> },
    { id: 2, title: 'Patient Confinement Information', icon: <User size={20} /> },
    { id: 3, title: 'Certification of Consumption of Benefits and Consent to Access Patient Record/s', icon: <ClipboardList size={20} /> },
    { id: 4, title: 'Certification of Consumption of Health Care Institution', icon: <CheckSquare size={20} /> },
];

export default function SubmissionForm({ onSubmit, onCancel }) {
    const [currentStep, setCurrentStep] = React.useState(1);
    const [hciList, setHciList] = React.useState([]);
    const [hciLoading, setHciLoading] = React.useState(true);
    const [toast, setToast] = React.useState(null);

    // Fetching for Part I
    React.useEffect(() => {
        const fetchHCI = async () => {
            const { data, error } = await supabase
                .from('hci_info')
                .select('*') // SELECT ALL na lang muna
                .order('hci_name', { ascending: true });

            console.log('HCI columns:', data?.[0]); // this shows exact column names

            if (error) {
                setToast({ message: 'Could not load HCI list from database.', type: 'error' });
            } else {
                setHciList(data || []);
            }
            setHciLoading(false);
        };
        fetchHCI();
    }, []);


    const [formData, setFormData] = React.useState({
        // REAL Part I - HCI
        hci_id: '',
        pan_number: '',
        // may hci_name na sa part IV
        hci_address_street: '',
        hci_address_city: '',
        hci_address_province: '',

        // Unofficial Part I & II
        patient_name: '',
        philhealth_id: '',
        age: '',
        sex: '',
        diagnosis: '',
        icd10_code: '',
        admission_date: '',
        procedure: '',
        medications: '',
        duration: '',
        accreditation_number: '',
        remarks: '',

        // ---------------- !!!!! DON'T CHANGE THE PART BELOW !!!!! ---------------- //
        // Part III - Section A
        certifiedEnough: false,
        hciFeesEnough: '',
        pfFeesEnough: '',
        consumedPrior: false,

        // Co-pay HCI
        hciActualCharges: '',
        hciDiscount: '',
        hciPhilhealthBenefit: '',
        hciAfterDeductionAmount: '',
        hciDeductionPayers: { member: false, hmo: false, others: false },

        // Co-pay PF
        pfActualCharges: '',
        pfDiscount: '',
        pfPhilhealthBenefit: '',
        pfAfterDeductionAmount: '',
        pfDeductionPayers: { member: false, hmo: false, others: false },

        // Purchases
        drugsCostType: 'none',
        drugsAmount: '',
        diagnosticCostType: 'none',
        diagnosticAmount: '',

        // Part III - Section B
        representativeName: '',
        representativeDateSigned: '',
        representativeRelationship: '',
        representativeRelationshipSpecify: '',
        behalfReason: '',
        behalfReasonSpecify: '',
        consentMedicalRecords: false,
        consentLiabilityFree: false,

        // Part IV
        hci_name: '',
        designation: '',
        date_signed: '',
        finalCertification: false,
        // ---------------- !!!!! DON'T CHANGE THE PART ABOVE !!!!! ---------------- //
    });

    const grandTotalEnough = formData.certifiedEnough
        ? ((parseFloat(formData.hciFeesEnough) || 0) + (parseFloat(formData.pfFeesEnough) || 0)).toString()
        : '';

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            if (name === 'certifiedEnough' && !checked) {
                setFormData(prev => ({ ...prev, certifiedEnough: false, hciFeesEnough: '', pfFeesEnough: '' }));
            }
            else if (name === 'consumedPrior' && !checked) {
                setFormData(prev => ({
                    ...prev,
                    consumedPrior: false,
                    hciActualCharges: '', hciDiscount: '', hciPhilhealthBenefit: '', hciAfterDeductionAmount: '',
                    hciDeductionPayers: { member: false, hmo: false, others: false },
                    pfActualCharges: '', pfDiscount: '', pfPhilhealthBenefit: '', pfAfterDeductionAmount: '',
                    pfDeductionPayers: { member: false, hmo: false, others: false },
                    drugsCostType: 'none', drugsAmount: '', diagnosticCostType: 'none', diagnosticAmount: ''
                }));
            }
            else if (name.includes('.')) {
                const [parent, child] = name.split('.');
                setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: checked } }));
            } else {
                setFormData(prev => ({ ...prev, [name]: checked }));
            }
        } else {
            setFormData(prev => {
                const newData = { ...prev, [name]: value };
                if (name === 'representativeRelationship' && value !== 'Others') newData.representativeRelationshipSpecify = '';
                if (name === 'behalfReason' && value !== 'Others') newData.behalfReasonSpecify = '';
                if (name === 'drugsCostType' && value === 'none') newData.drugsAmount = '';
                if (name === 'diagnosticCostType' && value === 'none') newData.diagnosticAmount = '';
                return newData;
            });
        }
    };

    // part I
    const handleHCISelect = (hci_id) => {
        const selected = hciList.find(h => String(h.hci_id) === String(hci_id));
        if (!selected) {
            setFormData(prev => ({
                ...prev,
                hci_id: '',
                pan_number: '',
                hci_name: '',
                hci_address_street: '',
                hci_address_city: '',
                hci_address_province: '',
            }));
            return;
        }
        setFormData(prev => ({
            ...prev,
            hci_id:              selected.hci_id,
            pan_number:          selected.pan_number,
            hci_name:            selected.hci_name,
            hci_address_street:  selected.hci_address_street,
            hci_address_city:    selected.hci_address_city,
            hci_address_province: selected.hci_address_provi,
        }));
    };

    // STEPPER AREA
    const nextStep = () => {
        if (!isStepValid()) {
            setToast({
                message: 'Some fields in this section are incomplete. You can continue, but remember to fill them before submitting.',
                type: 'warning',
            });
        }
        setCurrentStep((prev) => Math.min(prev + 1, 4));
    };
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    const isStepValid = () => {
        if (currentStep === 1) return !!formData.hci_id;
        if (currentStep === 2) return formData.diagnosis && formData.icd10_code;
        if (currentStep === 4) return formData.finalCertification && formData.hci_name;
        return true;
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Toast banner */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-philhealth-green text-white p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <ClipboardList size={220} />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-philhealth-yellow animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-philhealth-yellow">
                                  Official Claim Document
                                </span>
                            </div>

                            <h2 className="text-3xl font-black tracking-tight">
                                CF-2 (Claim Form 2)
                            </h2>

                            <p className="opacity-70 text-xs mt-2 uppercase font-bold tracking-widest text-emerald-100">
                                Revised September 2018
                            </p>

                            <p className="opacity-70 text-[10px] mt-1 tracking-wider max-w-xl leading-relaxed italic">
                                This form together with other supporting documents should be filed within sixty (60) calendar days from date of discharge.
                            </p>
                        </div>

                        <div className="flex -space-x-2">
                            {STEPS.map((s) => (
                                <div
                                    key={s.id}
                                    className={`w-10 h-10 rounded-full border-4 border-philhealth-green flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                        currentStep === s.id
                                            ? 'bg-philhealth-yellow text-philhealth-green scale-110 z-10'
                                            : currentStep > s.id
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-emerald-900/50 text-white/50'
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
                        <span className="text-philhealth-green">
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

                {/* Content */}
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
                            {/* ---------------- PART I HERE ---------------- */}
                            {currentStep === 1 && (
                                <div className="space-y-8">
                                    {/* HCI Name Dropdown */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                            Name of Health Care Institution
                                        </label>
                                        {hciLoading ? (
                                            <div className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 italic">
                                                Loading institutions...
                                            </div>
                                        ) : (
                                            <select
                                                value={formData.hci_id}
                                                onChange={(e) => handleHCISelect(e.target.value)}
                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-philhealth-green/20 outline-none transition-all"
                                            >
                                                <option value="">— Select a Health Care Institution —</option>
                                                {hciList.map((hci) => (
                                                    <option key={hci.hci_id} value={hci.hci_id}>
                                                        {hci.hci_name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* Auto-filled fields — shown only after selection */}
                                    {formData.hci_id && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100"
                                        >
                                            <FormInput
                                                label="PhilHealth Accreditation Number (PAN)"
                                                name="pan_number"
                                                value={formData.pan_number}
                                                onChange={() => {}}
                                                disabled={true}
                                            />
                                            <FormInput
                                                label="Street Address"
                                                name="hci_address_street"
                                                value={formData.hci_address_street}
                                                onChange={() => {}}
                                                disabled={true}
                                            />
                                            <FormInput
                                                label="City / Municipality"
                                                name="hci_address_city"
                                                value={formData.hci_address_city}
                                                onChange={() => {}}
                                                disabled={true}
                                            />
                                            <FormInput
                                                label="Province / Region"
                                                name="hci_address_province"
                                                value={formData.hci_address_province}
                                                onChange={() => {}}
                                                disabled={true}
                                            />
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* ---------------- PART II HERE ---------------- */}
                            {currentStep === 2 && (
                                <div className="space-y-8">
                                    <FormInput
                                        label="Diagnosis"
                                        name="diagnosis"
                                        value={formData.diagnosis}
                                        onChange={handleChange}
                                        type="textarea"
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormInput
                                            label="ICD-10 Code"
                                            name="icd10_code"
                                            value={formData.icd10_code}
                                            onChange={handleChange}
                                        />

                                        <FormInput
                                            label="Admission Date"
                                            name="admission_date"
                                            type="date"
                                            value={formData.admission_date}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ---------------- !!!!! DON'T CHANGE THE PART BELOW !!!!! ---------------- */}
                            {/* ---------------- PART III HERE ---------------- */}
                            {currentStep === 3 && (
                                <div className="space-y-12">
                                    {/* SECTION A */}
                                    <section className="space-y-8">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-philhealth-green pl-4">
                                            A. CERTIFICATION OF CONSUMPTION OF BENEFITS:
                                        </h3>

                                        {/* Option 1: Enough Coverage */}
                                        <div className="space-y-6 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                            <label className="flex items-start gap-5 cursor-pointer group">
                                                <div className="relative flex items-center justify-center mt-1">
                                                    <input
                                                        type="checkbox"
                                                        name="certifiedEnough"
                                                        checked={formData.certifiedEnough}
                                                        onChange={handleChange}
                                                        disabled={formData.consumedPrior}
                                                        className="w-6 h-6 rounded border-slate-300 text-philhealth-green focus:ring-philhealth-green cursor-pointer transition-all disabled:opacity-30"
                                                    />
                                                </div>

                                                <div className="flex-1">
                                                    <p className="font-black text-philhealth-green text-xs uppercase tracking-widest mb-1">
                                                        PhilHealth benefit is enough to cover HCI and PF Charges.
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                                        No purchase of drugs/medicines, supplies, diagnostics, and co-pay for professional fees by the member/patient.
                                                    </p>
                                                </div>
                                            </label>

                                            {/* Sub-fields for Enough Coverage */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-emerald-100/50">
                                                <FormInput
                                                    label="Total Health Care Institution Fees"
                                                    name="hciFeesEnough"
                                                    type="number"
                                                    value={formData.hciFeesEnough}
                                                    onChange={handleChange}
                                                    disabled={!formData.certifiedEnough}
                                                />
                                                <FormInput
                                                    label="Total Professional Fees"
                                                    name="pfFeesEnough"
                                                    type="number"
                                                    value={formData.pfFeesEnough}
                                                    onChange={handleChange}
                                                    disabled={!formData.certifiedEnough}
                                                />
                                                <FormInput
                                                    label="Grand Total"
                                                    name="grandTotalEnough"
                                                    type="number"
                                                    value={grandTotalEnough}
                                                    onChange={() => {}}
                                                    disabled={true}
                                                    placeholder="Auto-computed"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 py-2">
                                            <div className="flex-1 h-px bg-slate-200"></div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">OR</span>
                                            <div className="flex-1 h-px bg-slate-200"></div>
                                        </div>

                                        {/* Option 2: Completely Consumed or with Purchases */}
                                        <div className="space-y-8">
                                            <label className="flex items-start gap-5 cursor-pointer group p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                                <div className="relative flex items-center justify-center mt-1">
                                                    <input
                                                        type="checkbox"
                                                        name="consumedPrior"
                                                        checked={formData.consumedPrior}
                                                        onChange={handleChange}
                                                        disabled={formData.certifiedEnough}
                                                        className="w-6 h-6 rounded border-slate-300 text-philhealth-green focus:ring-philhealth-green cursor-pointer transition-all disabled:opacity-30"
                                                    />
                                                </div>

                                                <div className="flex-1">
                                                    <p className="font-black text-slate-700 text-xs uppercase tracking-[0.05em] leading-relaxed">
                                                        The benefit of the member/patient was completely consumed prior to co-pay OR the benefit of the member/patient is not completely consumed BUT with purchases/expenses for drugs/medicines, supplies, diagnostics and others
                                                    </p>
                                                </div>
                                            </label>

                                            {formData.consumedPrior && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-10 pl-11 border-l-2 border-slate-100"
                                                >
                                                    {/* Co-pay Subsection */}
                                                    <div className="space-y-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-philhealth-yellow"></div>
                                                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                                                                1. The total co-pay for the following are:
                                                            </h4>
                                                        </div>

                                                        {/* HCI Fees Sub-subsection */}
                                                        <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-100 space-y-6">
                                                            <h5 className="text-[10px] font-bold text-philhealth-green uppercase tracking-widest flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-philhealth-green text-white flex items-center justify-center text-[8px]">A</span>
                                                                Total Health Care Institution Fees
                                                            </h5>

                                                            {/* Top Row: Main Charges */}
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                <FormInput
                                                                    label="Total Actual Charges"
                                                                    subtitle="Based on Statement of Account (SOA)"
                                                                    name="hciActualCharges"
                                                                    type="number"
                                                                    value={formData.hciActualCharges}
                                                                    onChange={handleChange}
                                                                />
                                                                <FormInput
                                                                    label="Amount after Discount"
                                                                    subtitle="i.e., Senior Citizen/PWD"
                                                                    name="hciDiscount"
                                                                    type="number"
                                                                    value={formData.hciDiscount}
                                                                    onChange={handleChange}
                                                                />
                                                                <FormInput
                                                                    label="PhilHealth Benefit"
                                                                    name="hciPhilhealthBenefit"
                                                                    type="number"
                                                                    value={formData.hciPhilhealthBenefit}
                                                                    onChange={handleChange}
                                                                />
                                                            </div>

                                                            {/* Bottom Row: Deduction Subsection */}
                                                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                                                <h6 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                                                    After PhilHealth Deduction
                                                                </h6>

                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                                                    {/* Left: Amount Input Field */}
                                                                    <div className="md:col-span-1">
                                                                        <FormInput
                                                                            label="Amount"
                                                                            name="hciAfterDeductionAmount"
                                                                            type="number"
                                                                            value={formData.hciAfterDeductionAmount}
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Right: Payer Checkboxes */}
                                                                    <div className="md:col-span-2 pb-2">
                                                                        <div className="flex flex-col gap-2">
                                                                            <div>
                                                                                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                                                                                    Paid By:
                                                                                </p>
                                                                                <p className="text-[9px] text-slate-500 italic -mt-0.5">
                                                                                    Check all that apply
                                                                                </p>
                                                                            </div>

                                                                            {/* Checkboxes */}
                                                                            <div className="flex flex-wrap items-center gap-6">
                                                                                <CheckboxPayer
                                                                                    name="hciDeductionPayers.member"
                                                                                    checked={formData.hciDeductionPayers.member}
                                                                                    onChange={handleChange}
                                                                                    label="Member/Patient"
                                                                                />
                                                                                <CheckboxPayer
                                                                                    name="hciDeductionPayers.hmo"
                                                                                    checked={formData.hciDeductionPayers.hmo}
                                                                                    onChange={handleChange}
                                                                                    label="HMO"
                                                                                />
                                                                                <CheckboxPayer
                                                                                    name="hciDeductionPayers.others"
                                                                                    checked={formData.hciDeductionPayers.others}
                                                                                    onChange={handleChange}
                                                                                    label="Others (i.e., PCSO, Promissory note, etc.)"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* PF Fees Sub-subsection */}
                                                        <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-100 space-y-6">
                                                            <h5 className="text-[10px] font-bold text-philhealth-green uppercase tracking-widest flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-philhealth-green text-white flex items-center justify-center text-[8px]">B</span>
                                                                Total Professional Fees
                                                            </h5>

                                                            {/* Top Row: Main Charges */}
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                <FormInput
                                                                    label="Total Actual Charges"
                                                                    subtitle="Based on Statement of Account (SOA)"
                                                                    name="pfActualCharges"
                                                                    type="number"
                                                                    value={formData.pfActualCharges}
                                                                    onChange={handleChange}
                                                                />
                                                                <FormInput
                                                                    label="Amount after Discount"
                                                                    subtitle="i.e., Senior Citizen/PWD"
                                                                    name="pfDiscount"
                                                                    type="number"
                                                                    value={formData.pfDiscount}
                                                                    onChange={handleChange}
                                                                />
                                                                <FormInput
                                                                    label="PhilHealth Benefit"
                                                                    name="pfPhilhealthBenefit"
                                                                    type="number"
                                                                    value={formData.pfPhilhealthBenefit}
                                                                    onChange={handleChange}
                                                                />
                                                            </div>

                                                            {/* Bottom Row: Deduction Subsection */}
                                                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                                                <h6 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                                                    After PhilHealth Deduction
                                                                </h6>

                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                                                    {/* Left: Amount Input Field */}
                                                                    <div className="md:col-span-1">
                                                                        <FormInput
                                                                            label="Amount"
                                                                            name="pfAfterDeductionAmount"
                                                                            type="number"
                                                                            value={formData.pfAfterDeductionAmount}
                                                                            onChange={handleChange}
                                                                        />
                                                                    </div>

                                                                    {/* Right: Payer Checkboxes */}
                                                                    <div className="md:col-span-2 pb-2">
                                                                        <div className="flex flex-col gap-2">
                                                                            <div>
                                                                                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                                                                                    Paid By:
                                                                                </p>
                                                                                <p className="text-[9px] text-slate-500 italic -mt-0.5">
                                                                                    Check all that apply
                                                                                </p>
                                                                            </div>

                                                                            {/* Checkboxes */}
                                                                            <div className="flex flex-wrap items-center gap-6">
                                                                                <CheckboxPayer
                                                                                    name="pfDeductionPayers.member"
                                                                                    checked={formData.pfDeductionPayers.member}
                                                                                    onChange={handleChange}
                                                                                    label="Member/Patient"
                                                                                />
                                                                                <CheckboxPayer
                                                                                    name="pfDeductionPayers.hmo"
                                                                                    checked={formData.pfDeductionPayers.hmo}
                                                                                    onChange={handleChange}
                                                                                    label="HMO"
                                                                                />
                                                                                <CheckboxPayer
                                                                                    name="pfDeductionPayers.others"
                                                                                    checked={formData.pfDeductionPayers.others}
                                                                                    onChange={handleChange}
                                                                                    label="Others (i.e., PCSO, Promissory note, etc.)"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Purchases Subsection */}
                                                    <div className="space-y-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-philhealth-yellow"></div>
                                                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                                                                2. Purchases/Expenses NOT included in the Health Care Institution Charges:
                                                            </h4>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                            {/* Drugs */}
                                                            <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                                                                        Total cost of purchase/s for drugs/medicines and/or medical supplies bought by the patient/member within/outside the HCI during confinement
                                                                    </h6>
                                                                    {formData.drugsCostType !== 'none' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleChange({ target: { name: 'drugsCostType', value: 'none', type: 'radio' } })}
                                                                            className="text-[9px] font-black text-philhealth-green hover:underline uppercase tracking-widest whitespace-nowrap ml-4"
                                                                        >
                                                                            Clear
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-6">
                                                                    <RadioButton label="None" name="drugsCostType" value="none" current={formData.drugsCostType} onChange={handleChange} />
                                                                    <RadioButton label="Total Amount" name="drugsCostType" value="amount" current={formData.drugsCostType} onChange={handleChange} />
                                                                </div>
                                                                {formData.drugsCostType === 'amount' && (
                                                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                                                        <FormInput label="Enter Amount" name="drugsAmount" type="number" value={formData.drugsAmount} onChange={handleChange} />
                                                                    </motion.div>
                                                                )}
                                                            </div>

                                                            {/* Diagnostic */}
                                                            <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                                                                        Total cost of diagnostic/laboratory examinations paid by the patient/member done within/outside the HCI during confinement
                                                                    </h6>
                                                                    {formData.diagnosticCostType !== 'none' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleChange({ target: { name: 'diagnosticCostType', value: 'none', type: 'radio' } })}
                                                                            className="text-[9px] font-black text-philhealth-green hover:underline uppercase tracking-widest whitespace-nowrap ml-4"
                                                                        >
                                                                            Clear
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-6">
                                                                    <RadioButton label="None" name="diagnosticCostType" value="none" current={formData.diagnosticCostType} onChange={handleChange} />
                                                                    <RadioButton label="Total Amount" name="diagnosticCostType" value="amount" current={formData.diagnosticCostType} onChange={handleChange} />
                                                                </div>
                                                                {formData.diagnosticCostType === 'amount' && (
                                                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                                                        <FormInput label="Enter Amount" name="diagnosticAmount" type="number" value={formData.diagnosticAmount} onChange={handleChange} />
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </section>

                                    {/* SECTION B */}
                                    <section className="space-y-8 pt-8 border-t-2 border-slate-100">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-philhealth-green pl-4">
                                            B. CONSENT TO ACCESS PATIENT RECORD/S
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <FormInput
                                                label="Name of Member/Patient/Authorized Representative"
                                                name="representativeName"
                                                value={formData.representativeName}
                                                onChange={handleChange}
                                            />
                                            <FormInput
                                                label="Date Signed"
                                                name="representativeDateSigned"
                                                type="date"
                                                value={formData.representativeDateSigned}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4 p-6 bg-slate-50 rounded-xl">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                        Relationship of the representative
                                                    </label>
                                                    {formData.representativeRelationship && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChange({ target: { name: 'representativeRelationship', value: '', type: 'radio' } })}
                                                            className="text-[9px] font-black text-philhealth-green hover:underline uppercase tracking-widest"
                                                        >
                                                            Clear
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <RadioButton label="Spouse" name="representativeRelationship" value="Spouse" current={formData.representativeRelationship} onChange={handleChange} />
                                                    <RadioButton label="Sibling" name="representativeRelationship" value="Sibling" current={formData.representativeRelationship} onChange={handleChange} />
                                                    <RadioButton label="Child" name="representativeRelationship" value="Child" current={formData.representativeRelationship} onChange={handleChange} />
                                                    <RadioButton label="Parent" name="representativeRelationship" value="Parent" current={formData.representativeRelationship} onChange={handleChange} />
                                                    <RadioButton label="Others" name="representativeRelationship" value="Others" current={formData.representativeRelationship} onChange={handleChange} />
                                                </div>
                                                {formData.representativeRelationship === 'Others' && (
                                                    <FormInput label="Specify Relationship" name="representativeRelationshipSpecify" value={formData.representativeRelationshipSpecify} onChange={handleChange} />
                                                )}
                                            </div>

                                            <div className="space-y-4 p-6 bg-slate-50 rounded-xl">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                        Reason for signing on behalf
                                                    </label>
                                                    {formData.behalfReason && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChange({ target: { name: 'behalfReason', value: '', type: 'radio' } })}
                                                            className="text-[9px] font-black text-philhealth-green hover:underline uppercase tracking-widest"
                                                        >
                                                            Clear
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    <RadioButton label="Patient is Incapacitated" name="behalfReason" value="Incapacitated" current={formData.behalfReason} onChange={handleChange} />
                                                    <RadioButton label="Other Reasons" name="behalfReason" value="Others" current={formData.behalfReason} onChange={handleChange} />
                                                </div>
                                                {formData.behalfReason === 'Others' && (
                                                    <FormInput label="Specify Reason" name="behalfReasonSpecify" value={formData.behalfReasonSpecify} onChange={handleChange} />
                                                )}
                                            </div>
                                        </div>

                                        {/* CONSENT CHECKBOXES */}
                                        <div className="space-y-4 p-8 bg-[#f0f4f0] border-2 border-philhealth-green/10 rounded-2xl border-dashed">
                                            <label className="flex items-start gap-5 cursor-pointer group">
                                                <div className="relative flex items-center justify-center mt-1">
                                                    <input
                                                        type="checkbox"
                                                        name="consentMedicalRecords"
                                                        checked={formData.consentMedicalRecords}
                                                        onChange={handleChange}
                                                        className="w-6 h-6 rounded border-slate-300 text-philhealth-green focus:ring-philhealth-green cursor-pointer transition-all"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                                        I hereby consent to the submission and examination of the patient’s pertinent medical records for the purpose of verifying the veracity of this claim to effect efficient processing of benefit payment.
                                                    </p>
                                                </div>
                                            </label>

                                            <div className="h-px bg-philhealth-green/10 mx-2"></div>

                                            <label className="flex items-start gap-5 cursor-pointer group">
                                                <div className="relative flex items-center justify-center mt-1">
                                                    <input
                                                        type="checkbox"
                                                        name="consentLiabilityFree"
                                                        checked={formData.consentLiabilityFree}
                                                        onChange={handleChange}
                                                        className="w-6 h-6 rounded border-slate-300 text-philhealth-green focus:ring-philhealth-green cursor-pointer transition-all"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                                        I hereby hold PhilHealth or any of its officers, employees and/or representatives free from any and all legal liabilities relative to the herein-mentioned consent which I have voluntarily and willingly given in connection with this claim for reimbursement before PhilHealth.
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </section>
                                </div>
                            )}
                            {/* ---------------- !!!!! DON'T CHANGE THE PART ABOVE !!!!! ---------------- */}

                            {/* ---------------- !!!!! DON'T CHANGE THE PART BELOW !!!!! ---------------- */}
                            {/* ---------------- PART IV HERE ---------------- */}
                            {currentStep === 4 && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormInput
                                            label="Name of Authorized HCI Representative"
                                            name="hci_name"
                                            value={formData.hci_name}
                                            onChange={handleChange}
                                        />

                                        <FormInput
                                            label="Official Capacity/Designation"
                                            name="designation"
                                            value={formData.designation}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            Date Signed
                                        </label>

                                        <input
                                            type="date"
                                            name="date_signed"
                                            value={formData.date_signed}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-philhealth-green/20 outline-none"
                                        />
                                    </div>

                                    <div className="p-8 bg-[#f0f4f0] border-2 border-philhealth-green/10 rounded-2xl border-dashed">
                                        <label className="flex items-start gap-5 cursor-pointer group">
                                            <div className="relative flex items-center justify-center mt-1">
                                                <input
                                                    type="checkbox"
                                                    name="finalCertification"
                                                    checked={formData.finalCertification}
                                                    onChange={handleChange}
                                                    className="w-6 h-6 rounded border-slate-300 text-philhealth-green focus:ring-philhealth-green cursor-pointer transition-all"
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                                    I certify that services rendered were recorded in the patient’s chart and health care institution records and that the herein information given are true and correct.
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                            {/* ---------------- !!!!! DON'T CHANGE THE PART ABOVE !!!!! ---------------- */}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={currentStep === 1 ? onCancel : prevStep}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all flex items-center gap-2 group"
                        id="prev-btn"
                    >
                        {currentStep === 1 ? 'Cancel Form' : <><ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Previous Section</>}
                    </button>

                    {currentStep === 4 ? (
                        <button
                            onClick={() => {
                                if (formData.finalCertification) {
                                    onSubmit({ ...formData, grandTotalEnough });
                                }
                            }}
                            disabled={!formData.finalCertification || !isStepValid()}
                            className={`px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] flex items-center gap-3 transition-all shadow-xl ${
                                formData.finalCertification && isStepValid()
                                    ? 'bg-philhealth-yellow text-philhealth-green hover:shadow-philhealth-yellow/20 active:scale-95'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50 shadow-none'
                            }`}
                            id="submit-form-btn"
                        >
                            Finalize Submission
                            <Save size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={nextStep}
                            className="px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] flex items-center gap-3 transition-all shadow-xl bg-philhealth-green text-white hover:bg-philhealth-green-dark hover:shadow-philhealth-green/30 active:scale-95"
                            id="next-btn"
                        >
                            Continue
                            <ArrowRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function FormInput({label, name, type = 'text', value, onChange, placeholder = '', disabled = false, subtitle = ''}) {
    const base = 'w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-philhealth-green/20 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed';

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-900 tracking-tight">
                {label}
            </label>
            {subtitle && (
                <p className="text-[9px] text-slate-900 italic -mt-1">{subtitle}</p>
            )}

            {type === 'textarea' ? (
                <textarea
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`${base} min-h-25`}
                />
            ) : (
                <input
                    name={name}
                    type={type}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={base}
                />
            )}
        </div>
    );
}

function CheckboxPayer({ label, name, checked, onChange }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer group">
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                className="w-4 h-4 rounded border-slate-300 text-philhealth-green focus:ring-philhealth-green cursor-pointer"
            />
            <span className="text-[10px] font-bold text-slate-600 group-hover:text-philhealth-green transition-colors">{label}</span>
        </label>
    );
}

function RadioButton({ label, name, value, current, onChange }) {
    const isSelected = current === value;
    return (
        <label className={`flex items-center gap-2 cursor-pointer group px-4 py-2 rounded-lg border transition-all ${
            isSelected ? 'bg-philhealth-green border-philhealth-green text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-philhealth-green/30'
        }`}>
            <input
                type="radio"
                name={name}
                value={value}
                checked={isSelected}
                onChange={onChange}
                className="hidden"
            />
            <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
        </label>
    );
}
