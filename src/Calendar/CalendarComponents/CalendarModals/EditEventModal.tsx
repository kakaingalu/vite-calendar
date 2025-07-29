import 
// React, 
{ useState, useEffect } from 'react';
import { Formik, 
    // Form
     Field } from 'formik';
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

interface EditEventModalProps {
    eventInfo: any;
    show: boolean;
    onHide: () => void;
    onDeleteEvent: (info: any) => void;
    onEventUpdateSuccess: (event: any) => void;
}

const EditEventModal = ({ eventInfo, show, onHide, onDeleteEvent, onEventUpdateSuccess }: EditEventModalProps) => {
    const { data: employees = [], isLoading: employeesLoading } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const res = await axiosInstance.get('/pms/employees/');
            return res.data;
        }
    });

    if (!eventInfo || !eventInfo.event) {
        return null;
    }
    if (employeesLoading) {
        return <div className="p-8">Loading employees...</div>;
    }
    const { event } = eventInfo;
    const extendedProps = event.extendedProps || {};

    // Define validation schema
    const validationSchema = Yup.object().shape({
        title: Yup.string().required('Title is required'),
        description: Yup.string(),
        // clientID: Yup.string().required('Client is required'), // Assuming these are displayed, not selected
        // case: Yup.string().required('Case is required'),      // Same as above
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
        ...extendedProps,
        title: event.title,
        start_date: formatDateForInput(event.startStr),
        end_date: formatDateForInput(event.endStr),
        // title: event.title || '',
        // description: extendedProps.description || '',
        // // For display, these come from extendedProps directly if they are just text
        // caseNumber: extendedProps.caseNumber || 'N/A', // Assuming caseNumber is in extendedProps
        // client_name: extendedProps.client_name || 'N/A', // Assuming client_name is in extendedProps
        // // If clientID and case (ID) are part of the form for submission, they'd be:
        // // clientID: extendedProps.clientID || '',
        // // case_id: extendedProps.case_id || '', 
        // case_reason: extendedProps.case_reason || '',
        // location: extendedProps.location || '',
        // court: extendedProps.court || '',
        // priority: extendedProps.priority || 'Medium',
        // start_date: formatDateForInput(event.startStr),
        // end_date: formatDateForInput(event.endStr),
        // attendees: extendedProps.attendees || [], // Expecting an array of attendee IDs
        // sendReminders: extendedProps.sendReminders !== undefined ? extendedProps.sendReminders : true,
    };

    const handleSubmit = async (values: any, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
        const calendarApi = eventInfo.view.calendar;

        const payload = {
            id: event.id, // Event ID for backend
            ...values, // Form values
            // Ensure dates are in the format your backend expects if different from YYYY-MM-DD
            // start_date: values.start_date, 
            // end_date: values.end_date,
        };

        try {
            // --- TODO: Implement Backend API call here ---
            // const response = await axiosInstance.get(`/api/events/${event.id}`, {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload),
            // });
            // if (!response.ok) throw new Error('Failed to update event');
            // const updatedEventData = await response.data;
            // --- End of Backend API call ---

            const response = await axiosInstance.put(`pms/calendar-events/${event.id}/`, payload)
            if (response.status !== 200) {
                throw new Error(`Failed to update client. Status: ${response.status}`);
            }
            Swal.fire("Success!", "Client has been updated successfully.", "success");

            // Optimistic UI Update (FullCalendar)
            const fcEvent = calendarApi.getEventById(event.id);
            if (fcEvent) {
                fcEvent.setProp('title', values.title);
                fcEvent.setDates(values.start_date, values.end_date, { allDay: eventInfo.event.allDay }); // Assuming allDay doesn't change or is handled
                fcEvent.setExtendedProp('description', values.description);
                fcEvent.setExtendedProp('case_reason', values.case_reason);
                fcEvent.setExtendedProp('location', values.location);
                fcEvent.setExtendedProp('court', values.court);
                fcEvent.setExtendedProp('priority', values.priority);
                fcEvent.setExtendedProp('attendees', values.attendees);
                fcEvent.setExtendedProp('sendReminders', values.sendReminders);
                // Update other extendedProps as needed
            }
            
            Swal.fire('Updated!', 'Event has been updated.', 'success');
            if (onEventUpdateSuccess) {
                // Pass the locally updated event structure or refetch indicator
                onEventUpdateSuccess({ ...payload, ...extendedProps }); // Send merged data
            }
        } catch (error) {
            console.error('Error updating event:', error);
            Swal.fire('Error!', `Could not update event: ${(error as any).message}`, 'error');
        } finally {
            setSubmitting(false);
            // onHide(); // Consider if onHide should be in success callback or here
        }
    };

    const handleDelete = () => {
        if (onDeleteEvent) {
            onDeleteEvent(eventInfo); // onDeleteEvent in Calendar.jsx will show Swal confirm
        }
        // onHide(); // Deletion is handled by parent, which might close modal
    };


    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${show ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-auto my-8 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h5 className="text-xl font-semibold">Edit Event: {initialValues.title}</h5>
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
                    enableReinitialize // Important if eventInfo can change while modal is open (though unlikely for edit)
                >
                    {({ values, errors, touched, isSubmitting, setFieldValue }) => (
                        <form>
                            <div className="p-4 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"> {/* g-2 for gap */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="editEventTitle" className="block text-sm font-medium text-gray-700">Event Title</label>
                                        <Field name="title" type="text" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.title && touched.title ? 'border-red-500' : ''}`} />
                                        {errors.title && touched.title && <div className="text-red-500 text-xs mt-1">{String(errors.title)}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="editEventStartDate" className="block text-sm font-medium text-gray-700">Starts</label>
                                        <Field name="start_date" type="date" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.start_date && touched.start_date ? 'border-red-500' : ''}`} />
                                        {errors.start_date && touched.start_date && <div className="text-red-500 text-xs mt-1">{String(errors.start_date)}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="editEventEndDate" className="block text-sm font-medium text-gray-700">Ends</label>
                                        <Field name="end_date" type="date" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.end_date && touched.end_date ? 'border-red-500' : ''}`} />
                                        {errors.end_date && touched.end_date && <div className="text-red-500 text-xs mt-1">{String(errors.end_date)}</div>}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="editEventDescription" className="block text-sm font-medium text-gray-700">Brief Description</label>
                                        <Field name="description" as="textarea" rows={3} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.description && touched.description ? 'border-red-500' : ''}`} />
                                        {errors.description && touched.description && <div className="text-red-500 text-xs mt-1">{String(errors.description)}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="editEventCaseNumber" className="block text-sm font-medium text-gray-700">Case</label>
                                        <Field name="caseNumber" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed" disabled />
                                    </div>
                                    <div>
                                        <label htmlFor="editEventClientName" className="block text-sm font-medium text-gray-700">Client</label>
                                        <Field name="client_name" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed" disabled />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="editEventCaseReason" className="block text-sm font-medium text-gray-700">Case Reason</label>
                                        <Field name="case_reason" as="select" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.case_reason && touched.case_reason ? 'border-red-500' : ''}`}>
                                            <option value="">Select Reason</option>
                                            <option value="Hearing">Hearing</option>
                                            <option value="Mention">Mention</option>
                                            <option value="Judgment">Judgment</option>
                                            <option value="Bring Up">Bring Up</option>
                                            <option value="Other">Other</option>
                                        </Field>
                                        {errors.case_reason && touched.case_reason && <div className="text-red-500 text-xs mt-1">{String(errors.case_reason)}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="editEventPriority" className="block text-sm font-medium text-gray-700">Priority</label>
                                        <Field name="priority" as="select" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.priority && touched.priority ? 'border-red-500' : ''}`}>
                                            <option value="">Select Priority</option>
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </Field>
                                        {errors.priority && touched.priority && <div className="text-red-500 text-xs mt-1">{String(errors.priority)}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="editEventLocation" className="block text-sm font-medium text-gray-700">Location</label>
                                        <Field name="location" type="text" placeholder="e.g., Courtroom 5, City Hall" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.location && touched.location ? 'border-red-500' : ''}`} />
                                        {errors.location && touched.location && <div className="text-red-500 text-xs mt-1">{String(errors.location)}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="editEventCourt" className="block text-sm font-medium text-gray-700">Court</label>
                                        <Field name="court" type="text" placeholder="e.g., High Court of City" className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.court && touched.court ? 'border-red-500' : ''}`} />
                                        {errors.court && touched.court && <div className="text-red-500 text-xs mt-1">{String(errors.court)}</div>}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="md:col-span-2">
                                       <label htmlFor="attendees" className="block text-sm font-medium text-gray-700">Attendees</label>
                                       <MultipleChipSelect 
                                            setFieldValue={setFieldValue} 
                                            initialAttendees={values.attendees} // Pass current attendee IDs
                                            employees={employees} // Pass employees data
                                        />
                                        {errors.attendees && touched.attendees && <div className="text-red-500 text-xs mt-1">{String(errors.attendees)}</div>}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="editEventSendReminders" className="inline-flex items-center">
                                        <Field name="sendReminders" type="checkbox" checked={values.sendReminders} className={`rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${errors.sendReminders && touched.sendReminders ? 'border-red-500' : ''}`} />
                                        <span className="ml-2 text-sm text-gray-700">Send Reminders to Attendees</span>
                                    </label>
                                    {errors.sendReminders && touched.sendReminders && <div className="text-red-500 text-xs mt-1">{String(errors.sendReminders)}</div>}
                                </div>

                            </div>
                            <div className="flex justify-end p-4 border-t border-gray-200">
                                <button type="button" onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 mr-auto flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m-1.022.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165" />
                                    </svg>
                                    Delete Event
                                </button>
                                <button type="button" onClick={onHide} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 mr-2">
                                    Close
                                </button>
                                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

export default EditEventModal;