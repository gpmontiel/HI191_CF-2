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

    const [patientQuery, setPatientQuery] = React.useState('');
    const [patientResults, setPatientResults] = React.useState([]);
    const [patientSearching, setPatientSearching] = React.useState(false);
    const [patientSelected, setPatientSelected] = React.useState(false);

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
        // Part I - HCI
        hci_id: '',
        pan_number: '',
        // may hci_name na sa part IV
        hci_address_street: '',
        hci_address_city: '',
        hci_address_province: '',

        // Part II - Patient Confinement - Section A
        confinement_id: '',
        patient_last_name: '',
        patient_first_name: '',
        patient_middle_name: '',
        patient_name_extension: '',
        is_referred: null,
        name_referral: '',
        building_street_referral: '',
        city_referral: '',
        province_referral: '',
        zip_referral: '',
        date_time_admitted: '',
        date_time_discharged: '',
        disposition: '',
        accomodation_type: '',
        admission_diagnosis: '',    // free text
        date_time_expiration: '',
        transferred_hci_name: '',
        transferred_street: '',
        transferred_city: '',
        transferred_province: '',
        transferred_zip: '',
        reason_referral: '',

        // Discharge Diagnosis rows (from discharge_diagnosis table, linked by confinement_id)
        discharge_diagnoses: [],
        
        // array of objects from DB
        special_considerations: {
            hemodialysis: { checked: false, dates: '' },
            blood_transfusion: { checked: false, dates: '' },
            peritoneal_dialysis: { checked: false, dates: '' },
            brachytherapy: { checked: false, dates: '' },
            radiotherapy_linac: { checked: false, dates: '' },
            chemotherapy: { checked: false, dates: '' },
            radiotherapy_cobalt: { checked: false, dates: '' },
            simple_debridement: { checked: false, dates: '' }
        },

        // Add these inside your initial useState block under special_considerations:
        packages: {
            // b. Z-Benefit
            z_benefit_code: '',

            // c. MCP Package (Pre-natal check-ups)
            mcp_dates: ['', '', '', ''], // Array for the 4 dates

            // d. TB DOTS Package
            tb_dots_intensive: false,
            tb_dots_maintenance: false,

            animal_bite: {
                day_0_arv: '',
                day_3_arv: '',
                day_7_arv: '',
                rig: '',
                others: ''
            }

        },

        philhealth_benefits: {
            first_case_rate: '',
            second_case_rate: ''
        },

        professionals: [],

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
            hci_address_province: selected.hci_address_province,
        }));
    };

    // Part II - fetching from database happens here
    const handlePatientSearch = async (query) => {
        setPatientQuery(query);
        setPatientSelected(false);

        if (query.length < 2) {
            setPatientResults([]);
            return;
        }

        setPatientSearching(true);
        const { data, error } = await supabase
            .from('confinement_info')
            .select('*')
            .ilike('last_name', `${query}%`)   // starts-with search, case-insensitive
            .order('last_name', { ascending: true })
            .limit(10);

        if (error) {
            setToast({ message: 'Could not search patients.', type: 'error' });
        } else {
            setPatientResults(data || []);
        }
        setPatientSearching(false);
    };

    const handlePatientSelect = async (record) => {
        setPatientQuery(`${record.last_name}, ${record.first_name} ${record.middle_name || ''}`.trim());
        setPatientResults([]);
        setPatientSelected(true);

        // 1. Fetch discharge diagnoses
        const { data: diagData, error: diagError } = await supabase
            .from('discharge_diagnosis')
            .select('*')
            .eq('confinement_id', record.confinement_id);

        // 2. Fetch the intermediary special_consideration row
        const { data: considerationRow, error: considerationError } = await supabase
            .from('special_consideration')
            .select('*')
            .eq('confinement_id', record.confinement_id)
            .maybeSingle();

        const { data: philhealthData, error: phError } = await supabase
            .from('philhealth_benefits')
            .select('*')
            .eq('confinement_id', record.confinement_id)
            .maybeSingle();

        const { data: profData, error: profError } = await supabase
            .from('accreditation')
            .select('*')
            .eq('confinement_id', record.confinement_id);

        let repData = [];
        let biteData = [];
        let mcpData = [];
        let newbornRows = [];
        let repError = null;

        // 3. Fetch from all child sub-tables via consideration_id
        if (considerationRow?.consideration_id) {
            // Fetch Repetitive Procedures
            const { data: rData, error: rErr } = await supabase
                .from('repetitive_procedure')
                .select('*')
                .eq('consideration_id', considerationRow.consideration_id);
            repData = rData || [];
            repError = rErr;

            // Fetch Animal Bite Package rows
            const { data: bData } = await supabase
                .from('animal_bite_package') 
                .select('*')
                .eq('consideration_id', considerationRow.consideration_id);
            biteData = bData || [];

            // Fetch MCP Package rows
            const { data: mData } = await supabase
                .from('mcp_package') 
                .select('*')
                .eq('consideration_id', considerationRow.consideration_id);
            mcpData = mData || [];

            // NEW: Fetch Newborn Package row
            const { data: nData } = await supabase
                .from('newborn_package') 
                .select('*')
                .eq('consideration_id', considerationRow.consideration_id);
            mcpData = mData || [];
            newbornRows = nData || []; // Change this to plural
        }

        // Helper date formatter (converts YYYY-MM-DD to MM-DD-YYYY)
        const formatDbDate = (dbDate) => {
            if (!dbDate) return '';
            const [year, month, day] = dbDate.split('-');
            return `${month}-${day}-${year}`;
        };

        // Parser for Repetitive Procedures (Part a)
        const getProcedureData = (procedureName) => {
            if (repError || repData.length === 0) return { checked: false, dates: '' };
            const matches = repData.filter(row => row.procedure?.toLowerCase().trim() === procedureName.toLowerCase().trim());
            if (matches.length === 0) return { checked: false, dates: '' };
            return {
                checked: true,
                dates: matches.map(row => formatDbDate(row.session_date)).filter(Boolean).join(', ')
            };
        };

        // Parser for Animal Bite Vaccines (Part e)
        const getVaccineDate = (vaccineType) => {
            const match = biteData.find(row => row.vaccine_type?.toLowerCase().trim() === vaccineType.toLowerCase().trim());
            return match ? formatDbDate(match.date) : '';
        };

        const getAnimalBiteOthers = () => {
            const match = biteData.find(row => row.vaccine_type?.toLowerCase().trim() === 'others');
            if (!match) return '';
            return match.others_desc ? `${match.others_desc} (${formatDbDate(match.date)})` : formatDbDate(match.date);
        };

        // Parser for MCP Pre-natal checkup array mapping (Part c)
        const getMcpDatesArray = () => {
            const datesArray = ['', '', '', ''];
            mcpData.forEach(row => {
                const checkupNum = parseInt(row.checkup_no, 10);
                if (checkupNum >= 1 && checkupNum <= 4) {
                    datesArray[checkupNum - 1] = formatDbDate(row.checkup_date);
                }
            });
            return datesArray;
        };

        setFormData(prev => ({
            ...prev,
            confinement_id:           record.confinement_id,
            patient_last_name:        record.last_name || '',
            patient_first_name:       record.first_name || '',
            patient_middle_name:      record.middle_name || '',
            patient_name_extension:   record.name_extension || '',
            is_referred:              record.is_referred,
            name_referral:            record.name_referral || '',
            building_street_referral: record.building_street_re || '', 
            city_referral:            record.city_referral || '',
            province_referral:        record.province_referral || '',
            zip_referral:             record.zip_referral || '',
            date_time_admitted:       record.date_time_admitted || '', 
            date_time_discharged:     record.date_time_discharged || '', 
            disposition:              record.disposition || '',
            accomodation_type:        record.accomodation_type || '', 
            discharge_diagnoses:      diagError ? [] : (diagData || []),
            date_time_expiration:     record.date_time_expiration  || '',
            transferred_hci_name:     record.transferred_hci_name  || '',
            transferred_street:       record.transferred_street    || '',
            transferred_city:         record.transferred_city      || '',
            transferred_province:     record.transferred_province  || '',
            transferred_zip:          record.transferred_zip       || '',
            reason_referral:          record.reason_referral       || '',

            // Part a
            special_considerations: {
                hemodialysis:        getProcedureData('Hemodialysis'),
                blood_transfusion:   getProcedureData('Blood Transfusion'),
                peritoneal_dialysis: getProcedureData('Peritoneal Dialysis'),
                brachytherapy:       getProcedureData('Brachytherapy'),
                radiotherapy_linac:  getProcedureData('Radiotherapy (LINAC)'),
                chemotherapy:        getProcedureData('Chemotherapy'),
                radiotherapy_cobalt: getProcedureData('Radiotherapy (COBALT)'),
                simple_debridement:  getProcedureData('Simple Debridement')
            },

            // Parts b to g
            packages: {
                z_benefit_code: considerationRow?.zbenefit_code || '',
                mcp_dates: getMcpDatesArray(),
                tb_dots_intensive: considerationRow?.tbdots_package?.toLowerCase() === 'intensive phase',
                tb_dots_maintenance: considerationRow?.tbdots_package?.toLowerCase() === 'maintenance phase',
                animal_bite: {
                    day_0_arv: getVaccineDate('Day 0 ARV'),
                    day_3_arv: getVaccineDate('Day 3 ARV'),
                    day_7_arv: getVaccineDate('Day 7 ARV'),
                    rig:       getVaccineDate('RIG'),
                    others:    getAnimalBiteOthers()
                },

                // NEW: Newborn Care Package Mapping
                newborn: {
                    is_essential:         newbornRows.some(row => row.is_essential === true || row.is_essential === 'TRUE'),
                    is_hearing_screening: newbornRows.some(row => row.is_hearing_screening === true || row.is_hearing_screening === 'TRUE'),
                    is_screening:         newbornRows.some(row => row.is_screening === true || row.is_screening === 'TRUE'),
                    is_immediate_drying:  newbornRows.some(row => row.is_immediate_drying === true || row.is_immediate_drying === 'TRUE'),
                    is_early_skin:         newbornRows.some(row => row.is_early_skin === true || row.is_early_skin === 'TRUE'),
                    is_cord_clamping:      newbornRows.some(row => row.is_cord_clamping === true || row.is_cord_clamping === 'TRUE'),
                    is_eye_prophylaxis:    newbornRows.some(row => row.is_eye_prophylaxis === true || row.is_eye_prophylaxis === 'TRUE'),
                    is_weighing:          newbornRows.some(row => row.is_weighing === true || row.is_weighing === 'TRUE'),
                    is_vitamink:          newbornRows.some(row => row.is_vitamink === true || row.is_vitamink === 'TRUE'),
                    is_bcg:               newbornRows.some(row => row.is_bcg === true || row.is_bcg === 'TRUE'),
                    is_nonseparation:     newbornRows.some(row => row.is_nonseparation === true || row.is_nonseparation === 'TRUE'),
                    is_hepaB:             newbornRows.some(row => row.is_hepaB === true || row.is_hepaB === 'TRUE')
                },

                // NEW: Outpatient HIV/AIDS Treatment Mapping
                hiv_lab_number: considerationRow?.hiv_lab_number || '',
            },

            philhealth_benefits: {
                first_case_rate: philhealthData?.first_case_rate || '',
                second_case_rate: philhealthData?.second_case_rate || ''
            },

            professionals: profData || []
        }));
    };

    const addProfessionalRow = () => {
        const today = new Date().toISOString().split('T')[0];
        setFormData(prev => ({
            ...prev,
            professionals: [
                ...prev.professionals, 
                { accreditation_number: '', name: '', date: today, is_copay: false, copay_amount: '' }
            ]
        }));
    };
    
    const handleProfessionalChange = (index, field, value) => {
        setFormData(prev => {
            const updatedProfessionals = [...prev.professionals];
            updatedProfessionals[index] = { 
                ...updatedProfessionals[index], 
                [field]: value 
            };
            return { ...prev, professionals: updatedProfessionals };
        });
    };

    const removeProfessionalRow = (index) => {
        setFormData(prev => ({
            ...prev,
            professionals: prev.professionals.filter((_, i) => i !== index)
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
        if (currentStep === 2) {
            if (!formData.confinement_id) return false;
            // Every discharge diagnosis row must have all fields filled
            const allRowsComplete = formData.discharge_diagnoses.every(d =>
                d.diagnosis?.trim() &&
                d.icd_code?.trim() &&
                d.related_procedure?.trim() &&
                d.rvs_code?.trim() &&
                d.procedure_date?.trim() &&
                d.laterality?.trim()
            );
            return allRowsComplete;
        }
        if (currentStep === 4) return formData.finalCertification && formData.hci_name;
        return true;
    };

    const formatDate = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString('en-PH', {
            hour: 'numeric', minute: '2-digit', hour12: true
        });
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
                                <div className="space-y-10">

                                    {/* 1. PATIENT NAME SEARCH */}
                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                            1. Name of Patient
                                        </label>
                                        <input
                                            type="text"
                                            value={patientQuery}
                                            onChange={(e) => handlePatientSearch(e.target.value)}
                                            placeholder="Type last name to search..."
                                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-philhealth-green/20 outline-none transition-all"
                                        />

                                        {/* Search results dropdown */}
                                        {patientResults.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden mt-1"
                                            >
                                                {patientSearching && (
                                                    <div className="px-5 py-3 text-xs text-slate-400 italic">Searching...</div>
                                                )}
                                                {patientResults.map((p) => (
                                                    <button
                                                        key={p.confinement_id}
                                                        type="button"
                                                        onClick={() => handlePatientSelect(p)}
                                                        className="w-full text-left px-5 py-3 text-xs font-bold hover:bg-emerald-50 hover:text-philhealth-green transition-colors border-b border-slate-100 last:border-0"
                                                    >
                                                        {p.last_name}, {p.first_name} {p.middle_name || ''} {p.name_extension || ''}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Auto-filled patient info — shown after selection */}
                                    {patientSelected && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-8"
                                        >
                                            {/* Name row */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                                <FormInput label="Last Name"       name="patient_last_name"      value={formData.patient_last_name}      onChange={() => {}} disabled />
                                                <FormInput label="First Name"      name="patient_first_name"     value={formData.patient_first_name}     onChange={() => {}} disabled />
                                                <FormInput label="Name Extension"  name="patient_name_extension" value={formData.patient_name_extension} onChange={() => {}} disabled />
                                                <FormInput label="Middle Name"     name="patient_middle_name"    value={formData.patient_middle_name}    onChange={() => {}} disabled />
                                            </div>

                                            {/* 2. Was patient referred? */}
                                            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                                    2. Was patient referred by another Health Care Institution (HCI)?
                                                </p>
                                                <div className="flex gap-6">
                                                    <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase border ${formData.is_referred === false ? 'bg-philhealth-green text-white border-philhealth-green' : 'bg-white text-slate-400 border-slate-200'}`}>No</span>
                                                    <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase border ${formData.is_referred === true  ? 'bg-philhealth-green text-white border-philhealth-green' : 'bg-white text-slate-400 border-slate-200'}`}>Yes</span>
                                                </div>
                                                {formData.is_referred && (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                                                        <FormInput label="Name of Referring HCI"    name="name_referral"           value={formData.name_referral}           onChange={() => {}} disabled />
                                                        <FormInput label="Building / Street"         name="building_street_referral" value={formData.building_street_referral} onChange={() => {}} disabled />
                                                        <FormInput label="City / Municipality"       name="city_referral"           value={formData.city_referral}           onChange={() => {}} disabled />
                                                        <FormInput label="Province"                  name="province_referral"       value={formData.province_referral}       onChange={() => {}} disabled />
                                                        <FormInput label="Zip Code"                  name="zip_referral"            value={formData.zip_referral}            onChange={() => {}} disabled />
                                                    </div>
                                                )}
                                            </div>

                                            {/* 3. Confinement Period */}
                                            <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">3. Confinement Period</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <FormInput label="Date Admitted"     name="date_admitted"  value={formatDate(formData.date_time_admitted)}   onChange={() => {}} disabled />
                                                    <FormInput label="Time Admitted"     name="time_admitted"  value={formatTime(formData.date_time_admitted)}   onChange={() => {}} disabled />
                                                    <FormInput label="Date Discharged"   name="date_discharged" value={formatDate(formData.date_time_discharged)} onChange={() => {}} disabled />
                                                    <FormInput label="Time Discharged"   name="time_discharged" value={formatTime(formData.date_time_discharged)} onChange={() => {}} disabled />
                                                </div>
                                            </div>

                                            {/* 4. Patient Disposition */}
                                            <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">4. Patient Disposition</p>
                                                <div className="flex flex-wrap gap-3">
                                                    {['Improved','Recovered','Home/Discharged Against Medical Advise','Absconded','Expired','Transferred/Referred'].map(opt => (
                                                        <span key={opt} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border ${formData.disposition === opt ? 'bg-philhealth-green text-white border-philhealth-green' : 'bg-white text-slate-300 border-slate-200'}`}>
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Expired — show date and time of expiration */}
                                                {formData.disposition === 'Expired' && (
                                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 mt-2">
                                                        <FormInput
                                                            label="Date of Expiration"
                                                            value={formData.date_time_expiration
                                                                ? new Date(formData.date_time_expiration).toLocaleDateString('en-PH', { month:'2-digit', day:'2-digit', year:'2-digit' })
                                                                : ''}
                                                            onChange={() => {}}
                                                            disabled
                                                        />
                                                        <FormInput
                                                            label="Time of Expiration"
                                                            value={formData.date_time_expiration
                                                                ? new Date(formData.date_time_expiration).toLocaleTimeString('en-PH', { hour:'numeric', minute:'2-digit', hour12: true })
                                                                : ''}
                                                            onChange={() => {}}
                                                            disabled
                                                        />
                                                    </div>
                                                )}

                                                {/* Transferred/Referred — show destination HCI details */}
                                                {formData.disposition === 'Transferred/Referred' && (
                                                    <div className="space-y-4 pt-3 border-t border-slate-200 mt-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Transferred / Referred To:</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            <FormInput label="HCI Name"          value={formData.transferred_hci_name}   onChange={() => {}} disabled />
                                                            <FormInput label="Building / Street" value={formData.transferred_street}     onChange={() => {}} disabled />
                                                            <FormInput label="City / Municipality" value={formData.transferred_city}     onChange={() => {}} disabled />
                                                            <FormInput label="Province"          value={formData.transferred_province}   onChange={() => {}} disabled />
                                                            <FormInput label="Zip Code"          value={formData.transferred_zip}        onChange={() => {}} disabled />
                                                        </div>
                                                        <FormInput label="Reason for Referral / Transfer" value={formData.reason_referral} onChange={() => {}} disabled />
                                                    </div>
                                                )}
                                            </div>

                                            {/* 5. Type of Accommodation */}
                                            <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">5. Type of Accommodation</p>
                                                <div className="flex gap-4">
                                                    {['Private','Non-Private (Charity/Service)'].map(opt => (
                                                        <span key={opt} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border ${formData.accomodation_type === opt ? 'bg-philhealth-green text-white border-philhealth-green' : 'bg-white text-slate-300 border-slate-200'}`}>
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 6. Admission Diagnosis — free text, doctor fills this */}
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">6. Admission Diagnosis/es <span className="text-red-500">*</span></p>
                                                <textarea
                                                    name="admission_diagnosis"
                                                    value={formData.admission_diagnosis || ''}
                                                    onChange={handleChange}
                                                    placeholder="Enter admission diagnosis..."
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-philhealth-green/20 outline-none transition-all min-h-[80px]"
                                                />
                                            </div>

                                            {/* 7. Discharge Diagnosis/es */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                                        7. Discharge Diagnosis/es <span className="text-red-500">*</span>
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                discharge_diagnoses: [
                                                                    ...prev.discharge_diagnoses,
                                                                    { diagnosis_id: Date.now(), diagnosis: '', icd_code: '', related_procedure: '', rvs_code: '', procedure_date: '', laterality: '' }
                                                                ]
                                                            }))
                                                        }
                                                        className="text-[10px] px-3 py-1.5 bg-philhealth-green text-white rounded-md font-bold uppercase transition hover:opacity-90"
                                                    >
                                                        + Add Row
                                                    </button>
                                                </div>

                                                {formData.discharge_diagnoses.length === 0 ? (
                                                    <p className="text-xs text-slate-400 italic px-1">
                                                        No discharge diagnoses yet. Click "+ Add Row" to add one.
                                                    </p>
                                                ) : (
                                                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                                                        <table className="w-full text-[10px]">
                                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                            <tr>
                                                                {['Diagnosis', 'ICD-10 Code', 'Related Procedure', 'RVS Code', 'Date of Procedure', 'Laterality', ''].map(h => (
                                                                    <th key={h} className="px-3 py-3 text-left font-black text-slate-400 uppercase tracking-wider">{h}</th>
                                                                ))}
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {formData.discharge_diagnoses.map((d, i) => (
                                                                <tr key={d.diagnosis_id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                                    {['diagnosis', 'icd_code', 'related_procedure', 'rvs_code', 'procedure_date', 'laterality'].map((field) => (
                                                                        <td key={field} className="px-2 py-2">
                                                                            <input
                                                                                type={field === 'procedure_date' ? 'date' : 'text'}
                                                                                value={d[field] || ''}
                                                                                onChange={(e) => {
                                                                                    const updated = [...formData.discharge_diagnoses];
                                                                                    updated[i] = { ...updated[i], [field]: e.target.value };
                                                                                    setFormData(prev => ({ ...prev, discharge_diagnoses: updated }));
                                                                                }}
                                                                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-philhealth-green/30 outline-none transition-all min-w-[80px]"
                                                                            />
                                                                        </td>
                                                                    ))}
                                                                    <td className="px-2 py-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setFormData(prev => ({
                                                                                    ...prev,
                                                                                    discharge_diagnoses: prev.discharge_diagnoses.filter((_, idx) => idx !== i)
                                                                                }))
                                                                            }
                                                                            className="text-red-400 hover:text-red-600 text-[9px] font-black uppercase"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                                {/* Incomplete row warning */}
                                                {formData.discharge_diagnoses.length > 0 &&
                                                    formData.discharge_diagnoses.some(d =>
                                                        !d.diagnosis?.trim() || !d.icd_code?.trim() || !d.related_procedure?.trim() ||
                                                        !d.rvs_code?.trim() || !d.procedure_date?.trim() || !d.laterality?.trim()
                                                    ) && (
                                                        <p className="text-[10px] text-red-500 font-bold flex items-center gap-1.5 px-1 pt-1">
                                                            ⚠ All fields in each diagnosis row must be filled before continuing.
                                                        </p>
                                                    )}
                                            </div>

                                            {/* --- NEW ADDITION: 8. Special Considerations --- */}
                                            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">8. Special Considerations</p>
                                                    <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">
                                                        a. For the following repetitive procedures, check box that applies and enumerate the procedure/sessions dates [mm-dd-yyyy]. For chemotherapy, see guidelines.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
                                                    {[
                                                        { id: 'hemodialysis', label: 'Hemodialysis' },
                                                        { id: 'blood_transfusion', label: 'Blood Transfusion' },
                                                        { id: 'peritoneal_dialysis', label: 'Peritoneal Dialysis' },
                                                        { id: 'brachytherapy', label: 'Brachytherapy' },
                                                        { id: 'radiotherapy_linac', label: 'Radiotherapy (LINAC)' },
                                                        { id: 'chemotherapy', label: 'Chemotherapy' },
                                                        { id: 'radiotherapy_cobalt', label: 'Radiotherapy (COBALT)' },
                                                        { id: 'simple_debridement', label: 'Simple Debridement' }
                                                    ].map((proc) => {
                                                        const isChecked = !!formData.special_considerations?.[proc.id]?.checked;
                                                        const datesValue = formData.special_considerations?.[proc.id]?.dates || '';

                                                        return (
                                                            <div key={proc.id} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200/60 shadow-sm transition-all">
                                                                <div className="flex items-center h-10">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={proc.id}
                                                                        checked={isChecked}
                                                                        disabled
                                                                        className="w-4 h-4 rounded text-philhealth-green border-slate-300 focus:ring-philhealth-green/20 accent-emerald-600 disabled:opacity-80"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 space-y-1.5">
                                                                    <label htmlFor={proc.id} className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                                                                        {proc.label}
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={datesValue}
                                                                        placeholder="—"
                                                                        disabled
                                                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 tracking-wide outline-none disabled:bg-slate-50/50 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {/* b. Z-Benefit Package */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                                                    <div className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                                                        b. For Z-Benefit Package
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <FormInput 
                                                            label="Z-Benefit Package Code" 
                                                            value={formData.packages?.z_benefit_code} 
                                                            disabled 
                                                        />
                                                    </div>
                                                </div>

                                                {/* c. MCP Package */}
                                                <div className="space-y-2 p-4 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                                                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                                                        c. For MCP Package <span className="text-[10px] text-slate-400 font-medium normal-case italic">(enumerate four dates [mm-dd-year] of pre-natal check-ups)</span>
                                                    </p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {[1, 2, 3, 4].map((num, idx) => (
                                                            <FormInput 
                                                                key={num}
                                                                label={`Check-up ${num}`} 
                                                                value={formData.packages?.mcp_dates?.[idx] || ''} 
                                                                disabled 
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* d. TB DOTS Package */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                                                    <div className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                                                        d. For TB DOTS Package
                                                    </div>
                                                    <div className="flex gap-6 md:col-span-2">
                                                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-not-allowed">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={!!formData.packages?.tb_dots_intensive} 
                                                                disabled 
                                                                className="w-4 h-4 rounded text-philhealth-green border-slate-300 accent-emerald-600" 
                                                            />
                                                            Intensive Phase
                                                        </label>
                                                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-not-allowed">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={!!formData.packages?.tb_dots_maintenance} 
                                                                disabled 
                                                                className="w-4 h-4 rounded text-philhealth-green border-slate-300 accent-emerald-600" 
                                                            />
                                                            Maintenance Phase
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* e. Animal Bite Package */}
                                                <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                                                            e. For Animal Bite Package <span className="text-[10px] text-slate-400 font-medium normal-case italic">(vaccine session dates)</span>
                                                        </p>
                                                        <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wide">
                                                            ARV / RIG
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                        <FormInput label="Day 0 ARV" value={formData.packages?.animal_bite?.day_0_arv} disabled />
                                                        <FormInput label="Day 3 ARV" value={formData.packages?.animal_bite?.day_3_arv} disabled />
                                                        <FormInput label="Day 7 ARV" value={formData.packages?.animal_bite?.day_7_arv} disabled />
                                                        <FormInput label="RIG"       value={formData.packages?.animal_bite?.rig}       disabled />
                                                        <FormInput label="Others (Specify)" value={formData.packages?.animal_bite?.others} disabled />
                                                    </div>
                                                </div>

                                                {/* f. Newborn Care Package */}
                                                <div className="space-y-4 p-4 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                                                    <div className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                                                        f. For Newborn Care Package
                                                    </div>
                                                    
                                                    {/* Main Parent Row Options */}
                                                    <div className="flex flex-wrap gap-6 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-not-allowed">
                                                            <input type="checkbox" checked={!!formData.packages?.newborn?.is_essential} disabled className="w-4 h-4 rounded text-philhealth-green border-slate-300 accent-emerald-600" />
                                                            Essential Newborn Care
                                                        </label>
                                                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-not-allowed">
                                                            <input type="checkbox" checked={!!formData.packages?.newborn?.is_hearing_screening} disabled className="w-4 h-4 rounded text-philhealth-green border-slate-300 accent-emerald-600" />
                                                            Newborn Hearing Screening Test
                                                        </label>
                                                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-not-allowed">
                                                            <input type="checkbox" checked={!!formData.packages?.newborn?.is_screening} disabled className="w-4 h-4 rounded text-philhealth-green border-slate-300 accent-emerald-600" />
                                                            Newborn Screening Test
                                                        </label>
                                                    </div>

                                                    {/* Sub-section: For Essential Newborn Care */}
                                                    <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-white space-y-3">
                                                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                                            For Essential Newborn Care <span className="text-[9px] text-slate-400 font-medium normal-case italic">(applicable components)</span>
                                                        </p>
                                                        
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pl-1">
                                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-not-allowed">
                                                                <input type="checkbox" checked={!!formData.packages?.newborn?.is_immediate_drying} disabled className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600" />
                                                                Immediate drying of newborn
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-not-allowed">
                                                                <input type="checkbox" checked={!!formData.packages?.newborn?.is_early_skin} disabled className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600" />
                                                                Early skin-to-skin contact
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-not-allowed">
                                                                <input type="checkbox" checked={!!formData.packages?.newborn?.is_cord_clamping} disabled className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600" />
                                                                Timely cord clamping
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-not-allowed">
                                                                <input type="checkbox" checked={!!formData.packages?.newborn?.is_eye_prophylaxis} disabled className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600" />
                                                                Eye Prophylaxis
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-not-allowed">
                                                                <input type="checkbox" checked={!!formData.packages?.newborn?.is_weighing} disabled className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600" />
                                                                Weighing of the newborn
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-not-allowed">
                                                                <input type="checkbox" checked={!!formData.packages?.newborn?.is_vitamink} disabled className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600" />
                                                                Vitamin K administration
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-not-allowed">
                                                                <input type="checkbox" checked={!!formData.packages?.newborn?.is_bcg} disabled className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600" />
                                                                BCG vaccination
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-not-allowed">
                                                                <input type="checkbox" checked={!!formData.packages?.newborn?.is_nonseparation} disabled className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600" />
                                                                Non-separation / Breastfeeding
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-not-allowed">
                                                                <input type="checkbox" checked={!!formData.packages?.newborn?.is_hepaB} disabled className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600" />
                                                                Hepatitis B vaccination
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* g. Outpatient HIV/AIDS Treatment Package */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                                                    <div className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                                                        g. For Outpatient HIV/AIDS Treatment Package
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <FormInput 
                                                            label="Laboratory Number" 
                                                            value={formData.packages?.hiv_lab_number} 
                                                            disabled 
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* --- 9. PhilHealth Benefits Section --- */}
                                            <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">9. PhilHealth Benefits</p>

                                                <div className="p-6 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <FormInput 
                                                        label="First Case Rate" 
                                                        value={formData.philhealth_benefits?.first_case_rate || ''} 
                                                        disabled 
                                                    />
                                                    <FormInput 
                                                        label="Second Case Rate" 
                                                        value={formData.philhealth_benefits?.second_case_rate || ''} 
                                                        disabled 
                                                    />
                                                </div>
                                            </div>

                                            {/* --- 10. Accreditation Number/Professional Fees Section --- */}
                                            <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                                            10. Accreditation <span className="text-red-500">*</span>
                                                        </p>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={addProfessionalRow}
                                                        className="text-[10px] px-3 py-1.5 bg-philhealth-green text-white rounded-md hover:shadow-philhealth-green/30 font-bold uppercase transition"
                                                    >
                                                        + Add Professional
                                                    </button>
                                                </div>

                                                {formData.professionals.map((prof, index) => (
                                                    <div key={index} className="relative grid grid-cols-12 gap-4 p-4 bg-slate-50 rounded-xl items-start border border-slate-100 hover:border-slate-200 transition">
                                                        
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeProfessionalRow(index)}
                                                            className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-[9px] font-bold uppercase"
                                                        >
                                                            Remove
                                                        </button>

                                                        <div className="col-span-12 md:col-span-7 grid grid-cols-3 gap-3">
                                                            <div className="col-span-1">
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Date Signed</label>
                                                                <input type="date" className="w-full border-b bg-transparent py-1" value={prof.date} onChange={(e) => handleProfessionalChange(index, 'date', e.target.value)} />
                                                                
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Accreditation No.</label>
                                                                <input className="w-full border-b bg-transparent py-1" value={prof.accreditation_number} onChange={(e) => handleProfessionalChange(index, 'accreditation_number', e.target.value)} />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Signature Over Printed Name</label>
                                                                <input className="w-full border-b bg-transparent py-1" value={prof.name} onChange={(e) => handleProfessionalChange(index, 'name', e.target.value)} />
                                                                
                                                            </div>
                                                        </div>

                                                        <div className="col-span-12 md:col-span-5 flex flex-col pt-1 gap-2 border-l border-slate-200 pl-4">
                                                            <label className="flex items-center text-[11px] cursor-pointer text-slate-700">
                                                                <input type="radio" name={`copay-${index}`} checked={!prof.is_copay} onChange={() => handleProfessionalChange(index, 'is_copay', false)} className="mr-2" />
                                                                No co-pay on top of PhilHealth Benefit
                                                            </label>
                                                            <label className="flex items-center text-[11px] text-slate-700">
                                                                <input type="radio" name={`copay-${index}`} checked={!!prof.is_copay} onChange={() => handleProfessionalChange(index, 'is_copay', true)} className="mr-2" />
                                                                <span>With co-pay P</span>
                                                                <input className="ml-2 w-24 border-b bg-transparent outline-none" value={prof.copay_amount} onChange={(e) => handleProfessionalChange(index, 'copay_amount', e.target.value)} />
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
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
                                                label="Date"
                                                name="representativeDateSigned"
                                                type="date"
                                                value={formData.representativeDateSigned}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4 p-6 bg-slate-50 rounded-xl">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-black uppercase text-slate-900 tracking-widest">
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
                                                    <label className="text-[10px] font-black uppercase text-slate-900 tracking-widest">
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
                                                    <p className="text-[11px] text-slate-800 font-medium leading-relaxed">
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
                                                    <p className="text-[11px] text-slate-800 font-medium leading-relaxed">
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
                                    {/* Row 1: Name of Authorized Representative */}
                                    <div className="grid grid-cols-1">
                                        <FormInput
                                            label="Name of Authorized HCI Representative"
                                            name="hci_name"
                                            value={formData.hci_name}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/* Row 2: Designation and Date side-by-side */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormInput
                                            label="Official Capacity/Designation"
                                            name="designation"
                                            value={formData.designation}
                                            onChange={handleChange}
                                        />

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-900 tracking-widest">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                name="date_signed"
                                                value={formData.date_signed}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-philhealth-green/20 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Certification Checkbox */}
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
                                                <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
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
