import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    User,
    Stethoscope,
    ClipboardList,
    CheckSquare,
    ArrowLeft,
    Save,
    ArrowRight
} from 'lucide-react';

const STEPS = [
    { id: 1, title: 'Health Care Institution (HCI) Information', icon: <Stethoscope size={20} /> },
    { id: 2, title: 'Patient Confinement Information', icon: <User size={20} /> },
    { id: 3, title: 'Certification of Consumption of Benefits and Consent to Access Patient Record/s', icon: <ClipboardList size={20} /> },
    { id: 4, title: 'Certification of Consumption of Health Care Institution', icon: <CheckSquare size={20} /> },
];

export default function SubmissionForm({ onSubmit, onCancel }) {
    const [currentStep, setCurrentStep] = React.useState(1);

    const [formData, setFormData] = React.useState({
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
        certified: false,
    });

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const val =
            type === 'checkbox' ? e.target.checked : value;

        setFormData((prev) => ({
            ...prev,
            [name]: val,
        }));
    };

    const nextStep = () =>
        setCurrentStep((prev) => Math.min(prev + 1, 4));

    const prevStep = () =>
        setCurrentStep((prev) => Math.max(prev - 1, 1));

    const isStepValid = () => {
        if (currentStep === 1)
            return formData.patient_name && formData.philhealth_id;

        if (currentStep === 2)
            return formData.diagnosis && formData.icd10_code;

        return true;
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
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

                            <p className="opacity-70 text-xs mt-2 uppercase font-bold tracking-widest">
                                Revised September 2018
                            </p>

                            <p className="opacity-70 text-xs mt-1 tracking-widest">
                                This form together with other supporting documents should be filed within sixty (60) calendar days from date of discharge.
                            </p>
                        </div>

                        <div className="flex -space-x-2">
                            {STEPS.map((s) => (
                                <div
                                    key={s.id}
                                    className={`w-10 h-10 rounded-full border-4 border-philhealth-green flex items-center justify-center text-xs font-bold ${
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
                            className="space-y-8"
                        >
                            {/* ---------------- PART I HERE ---------------- */}
                            {currentStep === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormInput
                                        label="Full Name of Patient"
                                        name="patient_name"
                                        value={formData.patient_name}
                                        onChange={handleChange}
                                        placeholder="Last Name, First Name, M.I."
                                    />

                                    <FormInput
                                        label="PhilHealth ID"
                                        name="philhealth_id"
                                        value={formData.philhealth_id}
                                        onChange={handleChange}
                                        placeholder="00-000000000-0"
                                    />

                                    <FormInput
                                        label="Age"
                                        name="age"
                                        type="number"
                                        value={formData.age}
                                        onChange={handleChange}
                                        placeholder="Years"
                                    />

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                            Patient Sex
                                        </label>

                                        <select
                                            name="sex"
                                            value={formData.sex}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
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

                            {/* ---------------- PART III HERE ---------------- */}
                            {currentStep === 3 && (
                                <div className="space-y-8">
                                    <FormInput
                                        label="Procedure"
                                        name="procedure"
                                        value={formData.procedure}
                                        onChange={handleChange}
                                    />

                                    <FormInput
                                        label="Medications"
                                        name="medications"
                                        type="textarea"
                                        value={formData.medications}
                                        onChange={handleChange}
                                    />

                                    <FormInput
                                        label="Duration (days)"
                                        name="duration"
                                        type="number"
                                        value={formData.duration}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}

                            {/* ---------------- PART IV HERE ---------------- */}
                            {currentStep === 4 && (
                                <div className="space-y-8">
                                    <FormInput
                                        label="Accreditation Number"
                                        name="accreditation_number"
                                        value={formData.accreditation_number}
                                        onChange={handleChange}
                                    />

                                    <FormInput
                                        label="Remarks"
                                        name="remarks"
                                        type="textarea"
                                        value={formData.remarks}
                                        onChange={handleChange}
                                    />

                                    {/* Styled Certification Block */}
                                    <div className="p-8 bg-[#f0f4f0] border-2 border-philhealth-green/10 rounded-2xl border-dashed">
                                        <label className="flex items-start gap-5 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    name="certified"
                                                    checked={formData.certified}
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
                            onClick={() => formData.certified && onSubmit(formData)}
                            disabled={!formData.certified}
                            className={`px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] flex items-center gap-3 transition-all shadow-xl ${
                                formData.certified
                                    ? 'bg-philhealth-yellow text-philhealth-green hover:shadow-philhealth-yellow/20 active:scale-95'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50'
                            }`}
                            id="submit-form-btn"
                        >
                            Finalize Submission
                            <Save size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={nextStep}
                            disabled={!isStepValid()}
                            className={`px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] flex items-center gap-3 transition-all shadow-xl ${
                                isStepValid()
                                    ? 'bg-philhealth-green text-white hover:bg-philhealth-green-dark hover:shadow-philhealth-green/30'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50'
                            }`}
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

function FormInput({
                       label,
                       name,
                       type = 'text',
                       value,
                       onChange,
                       placeholder,
                   }) {
    const base = 'w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold';

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400">
                {label}
            </label>

            {type === 'textarea' ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={base}
                />
            ) : (
                <input
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={base}
                />
            )}
        </div>
    );
}