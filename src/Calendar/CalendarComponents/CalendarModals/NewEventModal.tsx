import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import Swal from 'sweetalert2';
import axiosInstance from '../../../services/httpService';
import { useQuery } from '@tanstack/react-query';

// Assuming formatDateForInput is in a utils file or defined above
// import { formatDateForInput } from './utils/dateUtils';
// Or define it here:
const formatDateForInput = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toISOString().split('T')[0];
    } catch (error) {
        if (typeof dateStr === 'string' && dateStr.length >= 10) return dateStr.substring(0, 10);
        return '';
    }
};

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

function getStyles(name: string, personName: string[], theme: any) {
    return {
        fontWeight:
            personName.indexOf(name) === -1
                ? theme.typography.fontWeightRegular
                : theme.typography.fontWeightMedium,
    };
}

interface MultipleChipSelectProps {
    setFieldValue: (field: string, value: any) => void;
    initialAttendees?: string[];
    employees: any[];
}

const MultipleChipSelect = ({ setFieldValue, initialAttendees = [], employees }: MultipleChipSelectProps) => {
    const theme = useTheme();
    const [personName, setPersonName] = useState<string[]>([]);

    useEffect(() => {
        if (initialAttendees && Array.isArray(initialAttendees)) {
            setPersonName(initialAttendees);
        }
    }, [initialAttendees]);

    const handleChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value as string[];
        setFieldValue("attendees", value);
        setPersonName(value);
    };
    
    const employeeOptions = Array.isArray(employees) ? employees : [];

    return (
        <div>
            <FormControl sx={{ m: 1, width: '100%' }}>
                <InputLabel id="attendees-label">Attendees</InputLabel>
                <Select
                    labelId="attendees-label"
                    id="attendees"
                    multiple
                    value={personName}
                    onChange={handleChange}
                    input={<OutlinedInput id="select-multiple-chip" label="Attendees" />}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((id) => {
                                const attendee = employeeOptions.find((emp) => emp.id === id);
                                return <Chip key={id} label={attendee ? attendee.full_name : `ID: ${id}`} />;
                            })}
                        </Box>
                    )}
                    MenuProps={MenuProps}
                >
                    {employeeOptions.map((employee) => (
                        <MenuItem
                            key={employee.id}
                            value={employee.id}
                            style={getStyles(employee.full_name, personName.map(id => {
                                const emp = employeeOptions.find(e => e.id === id);
                                return emp ? emp.full_name : '';
                            }), theme)}
                        >
                            {employee.full_name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
};


function getBGColor(reason: string) {
    switch (reason) {
        case 'Hearing': return '#3498db';
        case 'Mention': return '#9b59b6';
        case 'Judgment': return '#2ecc71';
        case 'Bring Up': return '#f1c40f';
        case 'Other': return '#1abc9c';
        default: return '#3498db';
    }
}

// This function should ideally be passed via props or be part of a service
const createNewCalendarEventAPI = async (eventDetails: any, selectedInfo: any) => {
    const eventsUrl = "pms/calendar-events/";
    const calendarEventDetails = {
        ...eventDetails, // includes title, description, case, clientID etc from form
        start_date: selectedInfo.startStr, // Or eventDetails.start_date if you want to use the formatted one
        end_date: selectedInfo.endStr,     // Or eventDetails.end_date
        all_day: selectedInfo.allDay,
        // Backend should ideally set its own background color based on reason or other logic
        // background_color: getBGColor(eventDetails.case_reason), 
    };

    try {
        const response = await axiosInstance.post(eventsUrl, calendarEventDetails);
        if (response.status === 201 && response.data) {
            // Add client-side determined color if backend doesn't provide it
            // This is for immediate display in FullCalendar if backend response doesn't include it.
            return { ...response.data, backgroundColor: getBGColor(response.data.case_reason || eventDetails.case_reason) };
        }
        throw new Error(`Server responded with status: ${response.status}`);
    } catch (error) {
        console.error("Error Submitting event: ", (error as any).response?.data || (error as any).message);
        throw (error as any).response?.data || error; // Throw more specific error
    }
};


interface NewEventModalProps {
    selectedInfo: any;
    show: boolean;
    onHide: () => void;
    onEventAddSuccess: (event: any) => void;
}

const NewEventModal = ({ selectedInfo, show, onHide, onEventAddSuccess }: NewEventModalProps) => {
    const [selectedClientName, setSelectedClientName] = useState('');
    const { data: employees = [], isLoading: employeesLoading } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const res = await axiosInstance.get('/pms/employees/');
            return res.data;
        }
    });
    const { data: cases = [], isLoading: casesLoading } = useQuery({
        queryKey: ['cases'],
        queryFn: async () => {
            const res = await axiosInstance.get('pms/cases/');
            return res.data;
        }
    });

    if (employeesLoading || casesLoading) {
        return <div className="p-8">Loading...</div>;
    }

    const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>, setFieldValue: (field: string, value: any) => void) => {
        const caseId = e.target.value;
        setFieldValue("case", caseId); // Store case

        const selectedCase = cases.find((c: any) => c.id.toString() === caseId.toString());
        if (selectedCase) {
            setFieldValue("clientID", selectedCase.clientID); // Store clientID
            // Fetch client details if only clientID is stored in case, or use name from case object
            // This part depends on your data structure for clients.
            // For now, assuming selectedCase has client_name or similar.
            setSelectedClientName(selectedCase.client_name || 'Client name not found'); // Display client_name
        } else {
            setFieldValue("clientID", "");
            setSelectedClientName('');
        }
    };

    const validationSchema = Yup.object().shape({
        title: Yup.string().required('Title is required'),
        description: Yup.string(),
        clientID: Yup.string().required('Client is required (auto-set from case)'),
        case: Yup.string().required('Case is required'),
        case_reason: Yup.string().required('Case Reason is required'),
        location: Yup.string(),
        court: Yup.string(),
        priority: Yup.string().required('Priority is required'),
        start_date: Yup.date().required("Start Date is required"),
        end_date: Yup.date().required("End Date is required").min(
            Yup.ref('start_date'),
            "End date can't be before start date"
        ),
        attendees: Yup.array().min(1, 'At least one attendee is required').required('Attendees are required'),
        sendReminders: Yup.boolean(),
    });

    const initialValues = {
        title: '',
        description: '',
        clientID: '', // Will be set by case selection
        case: '',   // User selects this
        case_reason: 'Hearing',
        court: '',
        priority: 'Medium',
        location: '',
        start_date: formatDateForInput(selectedInfo?.startStr),
        end_date: formatDateForInput(selectedInfo?.endStr),
        attendees: [],
        sendReminders: true,
    };

    const handleSubmit = async (values: any, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
        try {
            const createdEventData = await createNewCalendarEventAPI(values, selectedInfo);
            Swal.fire('Success!', 'Event Created Successfully', 'success');
            if (onEventAddSuccess) {
                onEventAddSuccess(createdEventData); // Pass new event to parent
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            Swal.fire('Error!', `Fill All Fields Correctly. Error: ${(error as any).message || 'Unknown error'}`, 'error');
        } finally {
            setSubmitting(false);
            // onHide(); // Parent should handle hiding on success
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${show ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-auto my-8 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h5 className="text-xl font-semibold">Create New Event</h5>
                    <button type="button" onClick={onHide} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ values, errors, touched, isSubmitting, setFieldValue }) => (
                        <Form>
                            <div className="p-4 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="newEventTitle" className="block text-sm font-medium text-gray-700">Event Title</label>
                                        <Field name="title" type="text" placeholder="e.g., Hearing for Case X" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.title && touched.title ? 'border-red-500' : ''}`} />
                                        {errors.title && touched.title && <div className="text-red-500 text-xs mt-1">{errors.title}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="newEventStartDate" className="block text-sm font-medium text-gray-700">Starts</label>
                                        <Field name="start_date" type="date" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.start_date && touched.start_date ? 'border-red-500' : ''}`} />
                                        {errors.start_date && touched.start_date && <div className="text-red-500 text-xs mt-1">{errors.start_date}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="newEventEndDate" className="block text-sm font-medium text-gray-700">Ends</label>
                                        <Field name="end_date" type="date" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.end_date && touched.end_date ? 'border-red-500' : ''}`} />
                                        {errors.end_date && touched.end_date && <div className="text-red-500 text-xs mt-1">{errors.end_date}</div>}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="newEventDescription" className="block text-sm font-medium text-gray-700">Brief Description</label>
                                        <Field name="description" as="textarea" rows={3} placeholder="Details about the event..." className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.description && touched.description ? 'border-red-500' : ''}`} />
                                        {errors.description && touched.description && <div className="text-red-500 text-xs mt-1">{errors.description}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="newEventCase" className="block text-sm font-medium text-gray-700">Case</label>
                                        <Field
                                            as="select"
                                            name="case"
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleCaseChange(e, setFieldValue)}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.case && touched.case ? 'border-red-500' : ''}`}
                                        >
                                            <option value="">Select Case</option>
                                            {Array.isArray(cases) && cases.map((single_case) => (
                                                <option key={single_case.id} value={single_case.id}>{single_case.caseNumber} - {single_case.matter_title}</option>
                                            ))}
                                        </Field>
                                        {errors.case && touched.case && <div className="text-red-500 text-xs mt-1">{errors.case}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="newEventClient" className="block text-sm font-medium text-gray-700">Client (auto-filled from Case)</label>
                                        <input type="text" value={selectedClientName} disabled readOnly className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed" />
                                        <Field name="clientID" type="hidden" /> 
                                        {errors.clientID && touched.clientID && <div className="text-red-500 text-xs mt-1">{errors.clientID}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="newEventCaseReason" className="block text-sm font-medium text-gray-700">Case Reason</label>
                                        <Field name="case_reason" as="select" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.case_reason && touched.case_reason ? 'border-red-500' : ''}`}>
                                            <option value="">Select Reason</option>
                                            <option value="Hearing">Hearing</option>
                                            <option value="Mention">Mention</option>
                                            <option value="Judgment">Judgment</option>
                                            <option value="Bring Up">Bring Up</option>
                                            <option value="Other">Other</option>
                                        </Field>
                                        {errors.case_reason && touched.case_reason && <div className="text-red-500 text-xs mt-1">{errors.case_reason}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="newEventPriority" className="block text-sm font-medium text-gray-700">Priority</label>
                                        <Field name="priority" as="select" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.priority && touched.priority ? 'border-red-500' : ''}`}>
                                            <option value="">Select Priority</option>
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </Field>
                                        {errors.priority && touched.priority && <div className="text-red-500 text-xs mt-1">{errors.priority}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="newEventLocation" className="block text-sm font-medium text-gray-700">Location</label>
                                        <Field name="location" type="text" placeholder="e.g., Courtroom 5, City Hall" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.location && touched.location ? 'border-red-500' : ''}`} />
                                        {errors.location && touched.location && <div className="text-red-500 text-xs mt-1">{errors.location}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="newEventCourt" className="block text-sm font-medium text-gray-700">Court</label>
                                        <Field name="court" type="text" placeholder="e.g., High Court of City" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.court && touched.court ? 'border-red-500' : ''}`} />
                                        {errors.court && touched.court && <div className="text-red-500 text-xs mt-1">{errors.court}</div>}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="md:col-span-2">
                                       <label htmlFor="attendees" className="block text-sm font-medium text-gray-700">Attendees</label>
                                       <MultipleChipSelect 
                                            setFieldValue={setFieldValue} 
                                            initialAttendees={values.attendees} 
                                            employees={employees} 
                                        />
                                        {errors.attendees && touched.attendees && <div className="text-red-500 text-xs mt-1">{errors.attendees}</div>}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="sendReminders" className="inline-flex items-center">
                                        <Field name="sendReminders" type="checkbox" checked={values.sendReminders} className={`rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.sendReminders && touched.sendReminders ? 'border-red-500' : ''}`} />
                                        <span className="ml-2 text-sm text-gray-700">Send Reminders to Attendees</span>
                                    </label>
                                    {errors.sendReminders && touched.sendReminders && <div className="text-red-500 text-xs mt-1">{errors.sendReminders}</div>}
                                </div>

                            </div>
                            <div className="flex justify-end p-4 border-t border-gray-200">
                                <button type="button" onClick={onHide} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 mr-2">
                                    Close
                                </button>
                                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                                    {isSubmitting ? 'Creating...' : 'Create Event'}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

export default NewEventModal;