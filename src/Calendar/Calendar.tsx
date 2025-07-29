import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, 
    // useQueryClient
} from '@tanstack/react-query';
// import type { UseMutationResult } from '@tanstack/react-query';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import type { View, SlotInfo, 
    // Event as RBCEvent 
} from 'react-big-calendar';
import moment from 'moment';

// Event Modals
import EditEventModal from './CalendarComponents/CalendarModals/EditEventModal.jsx';
import NewEventModal from './CalendarComponents/CalendarModals/NewEventModal.jsx';
import ViewEventModal from './CalendarComponents/CalendarModals/ViewEventModal.jsx';

import "../styles/Calendar.css";

import Swal from 'sweetalert2';
import axiosInstance from '../services/httpService.tsx';
import type { ToolbarProps } from 'react-big-calendar';

const localizer = momentLocalizer(moment);

const getBGColor = (reason: string) => {
    switch (reason) {
        case 'Hearing': return '#3498db';
        case 'Mention': return '#9b59b6';
        case 'Judgment': return '#2ecc71';
        case 'Bring Up': return '#f1c40f';
        case 'Other': return '#1abc9c';
        default: return '#6c757d';
    }
};

const CaseReasonDot = ({ reason }: { reason: string }) => {
    const bgColor = getBGColor(reason);
    return <div className="w-2.5 h-2.5 rounded-full inline-block mr-2 flex-shrink-0" style={{ backgroundColor: bgColor }} title={reason}></div>;
};

interface EventType {
    id?: string;
    case_reason?: string;
    start_date?: string;
    end_date?: string;
    caseNumber?: string;
    matter_title?: string;
    location?: string;
    court?: string;
    all_day?: boolean;
    description?: string;
    client_name?: string;
    priority?: string;
    client_email?: string;
    attendees?: string[];
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    extendedProps: {
        description?: string;
        client_name?: string;
        matter_title?: string;
        priority?: string;
        case_reason?: string;
        client_email?: string;
        caseNumber?: string;
        caseReason?: string;
        location?: string;
        court?: string;
        attendees?: string[];
    };
    case_reason?: string;
    caseNumber?: string;
    location?: string;
    court?: string;
}

const EventItem = ({ event }: { event: EventType }) => {
    function formatSidebarEventTime(startDate?: string, 
        // endDate?: string
    ) {
        if (!startDate) return '';
        const start = moment(startDate);
        const dateString = start.format('ddd, MMM D');
        const timeString = start.format('hh:mm A');
        return `${dateString}, ${timeString}`;
    }

    return (
        <div className="mb-2 shadow-sm calendar-event-item rounded-lg overflow-hidden">
            <div className="p-2">
                <div className="flex items-center mb-1">
                    <CaseReasonDot reason={event.case_reason || ''} />
                    <span className="font-bold text-sm text-gray-500">{formatSidebarEventTime(event.start_date, 
                        // event.end_date
                        )}</span>
                </div>
                <h6 className="mb-1 font-semibold text-base calendar-event-item-title">{event.caseNumber || 'N/A'} | {event.case_reason}</h6>
                <p className="mb-1 text-sm text-gray-700 calendar-event-item-matter">{event.matter_title}</p>
            </div>
            {(event.location || event.court) && (
                <div className="p-1 px-2 bg-gray-100 text-gray-600 text-sm calendar-event-item-footer border-t border-gray-200">
                    {event.location}{event.court && event.location ? `, ${event.court}` : event.court || ''}
                </div>
            )}
        </div>
    );
};

const Calendar = () => {
    // const queryClient = useQueryClient();

    const [date, setDate] = useState<Date>(new Date());
    const [view, setView] = useState<View>('month');
    
    const [showModal, setShowModal] = useState<boolean>(false);
    const [selectedInfo, setSelectedInfo] = useState<SlotInfo | null>(null);
    
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [editEventInfo, setEditEventInfo] = useState<any>(null);

    const [showViewModal, setShowViewModal] = useState<boolean>(false);
    const [viewEventInfo, setViewEventInfo] = useState<any>(null);
    
    const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Server event type
    interface ServerEventType extends EventType {
        id: string;
        matter_title?: string;
        start_date: string;
        end_date: string;
        all_day?: boolean;
        description?: string;
        client_name?: string;
        priority?: string;
        case_reason?: string;
        client_email?: string;
        caseNumber?: string;
        location?: string;
        court?: string;
        attendees?: string[];
    }

    const { data: eventsFromServer = [], refetch } = useQuery<ServerEventType[], Error>({
        queryKey: ['calendarEvents'],
        queryFn: async () => {
            const response = await axiosInstance.get('/pms/calendar-events/');
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.data;
        },
        // REMOVE onSuccess!
    });

    // Add this effect:
    useEffect(() => {
        if (eventsFromServer.length > 0) {
            formatAndSetEventsForCalendar(eventsFromServer);
        }
    }, [eventsFromServer]);

    const [events, setEvents] = useState<CalendarEvent[]>([]);

    const formatAndSetEventsForCalendar = (serverEvents: ServerEventType[]) => {
        const formattedEvents: CalendarEvent[] = serverEvents.map((event) => ({
            id: event.id,
            title: event.matter_title || 'Untitled Event',
            start: new Date(event.start_date), 
            end: new Date(event.end_date),     
            allDay: event.all_day || false,
            extendedProps: {
                description: event.description,
                client_name: event.client_name,
                matter_title: event.matter_title,
                priority: event.priority,
                case_reason: event.case_reason,
                client_email: event.client_email,
                caseNumber: event.caseNumber,
                caseReason: event.case_reason,
                location: event.location,
                court: event.court,
                attendees: event.attendees,
            },
            case_reason: event.case_reason, 
            caseNumber: event.caseNumber,
            location: event.location,
            court: event.court,
        }));
        setEvents(formattedEvents);
    };

    const addEventMutation = useMutation<any, Error, any>({
        mutationFn: async (newEventData: any) => {
            const response = await axiosInstance.post('/pms/calendar-events/', newEventData);
            if (response.status !== 201) {
                throw new Error('Failed to add event');
            }
            return response.data;
        },
        onSuccess: () => {
            refetch();
            hideModals();
        }
    });

    const updateEventMutation = useMutation<any, Error, any>({
        mutationFn: async (updatedEventData: any) => {
            const response = await axiosInstance.put(`/pms/calendar-events/${updatedEventData.id}`, updatedEventData);
            if (response.status !== 200) {
                throw new Error('Failed to update event');
            }
            return response.data;
        },
        onSuccess: () => {
            refetch();
            hideModals();
        }
    });

    const deleteEventMutation = useMutation<void, Error, string>({
        mutationFn: async (eventId: string) => {
            const response = await axiosInstance.delete(`/pms/calendar-events/${eventId}`);
            if (response.status !== 204) {
                throw new Error('Failed to delete event');
            }
        },
        onSuccess: () => {
            refetch();
            hideModals();
            Swal.fire('Deleted!', 'The event has been deleted.', 'success');
        },
        onError: () => {
            Swal.fire('Error!', 'Could not delete the event.', 'error');
        }
    });

    const handleSelectSlot = (slotInfo: SlotInfo) => {
        setSelectedInfo(slotInfo);
        setShowModal(true);
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        const clickInfo = {
            event: {
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                allDay: event.allDay,
                extendedProps: event.extendedProps,
            }
        };
        setEditEventInfo(clickInfo); 
        setViewEventInfo(clickInfo);
        setShowViewModal(true);
    };

    const handleNavigate = useCallback((newDate: Date) => setDate(newDate), [setDate]);
    const handleViewChange = useCallback((newView: View) => setView(newView), [setView]);

    const hideModals = () => {
        setShowModal(false);
        setShowEditModal(false);
        setShowViewModal(false);
    };

    const handleEventAddSuccess = (newEventData: any) => {
        addEventMutation.mutate(newEventData);
    };

    const handleEventUpdateSuccess = (updatedEventData: any) => {
        updateEventMutation.mutate(updatedEventData);
    };

    const deleteEventFromCalendar = (eventInfo: any) => {
        const eventId = eventInfo.event.id; 
        const eventTitle = eventInfo.event.title;

        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete the event: "${eventTitle}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel'
        }).then((result: any) => {
            if (result.isConfirmed) {
                deleteEventMutation.mutate(eventId);
            }
        });
    };
    
    const Event = ({ event }: { event: CalendarEvent }) => {
        return (
            <div className="p-1">
                {event.caseNumber && <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded mr-1">{event.caseNumber}</span>}
                <div className="flex items-center">
                    {event.case_reason && <CaseReasonDot reason={event.case_reason} />}
                    <strong className="ml-1 flex-grow text-sm text-white">{event.case_reason}</strong>
                </div>
                <div className="text-sm text-white">{event.title}</div>
            </div>
        );
    };

    const filteredEventsFromServer = (eventsFromServer as ServerEventType[]).filter((event: ServerEventType) => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
            (event.matter_title && event.matter_title.toLowerCase().includes(searchTermLower)) ||
            (event.caseNumber && event.caseNumber.toLowerCase().includes(searchTermLower)) ||
            (event.case_reason && event.case_reason.toLowerCase().includes(searchTermLower)) ||
            (event.location && event.location.toLowerCase().includes(searchTermLower)) ||
            (event.court && event.court.toLowerCase().includes(searchTermLower))
        );
    });

    const CustomToolbar = (props: ToolbarProps<CalendarEvent, object>) => {
        const { label, onNavigate, onView, view } = props;
        return (
            <div className="rbc-toolbar flex-wrap mt-7">
                <span className="rbc-btn-group">
                    {!sidebarVisible && (
                        <button
                            type="button"
                            onClick={() => setSidebarVisible(true)} 
                            className="calendar-sidebar-toggle-show p-1 shadow-sm hover:text-gray-700 hidden lg:inline-block rounded-md hover:bg-gray-200"
                            title="Show sidebar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[20.5px] h-[20.5px]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3H7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    )}
                    <button type="button" onClick={() => onNavigate('PREV')}>Back</button>
                    <button type="button" onClick={() => onNavigate('TODAY')}>Today</button>
                    <button type="button" onClick={() => onNavigate('NEXT')}>Next</button>
                </span>
                <span className="rbc-toolbar-label">{label}</span>
                <span className="rbc-btn-group">
                    <button type="button" className={view === 'month' ? 'rbc-active' : ''} onClick={() => onView('month')}>Month</button>
                    <button type="button" className={view === 'week' ? 'rbc-active' : ''} onClick={() => onView('week')}>Week</button>
                    <button type="button" className={view === 'day' ? 'rbc-active' : ''} onClick={() => onView('day')}>Day</button>
                    <button type="button" className={view === 'agenda' ? 'rbc-active' : ''} onClick={() => onView('agenda')}>Agenda</button>
                </span>
            </div>
        );
    };

    const components = useMemo(() => ({
        event: Event,
        toolbar: CustomToolbar,
    }), []);

    return (
        <div className="shadow-sm calendar-page-wrapper rounded-lg overflow-hidden">
            <div className="p-0 md:p-3">
                <div className="flex flex-col lg:flex-row min-h-[85vh]">
                    {sidebarVisible && (
                        <div className="calendar-sidebar hidden lg:flex flex-col p-2 border-r border-gray-200">
                            <div className="h-full shadow-none rounded-lg overflow-hidden">
                                <div className="bg-gray-100 p-2 flex justify-between items-center border-b border-gray-200">
                                    <h5 className="mb-0 text-base font-semibold">Events</h5>
                                    <button type="button" onClick={() => setSidebarVisible(false)} title="Hide sidebar" className="lg:inline-block p-1 rounded-md hover:bg-gray-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[20.5px] h-[20.5px]">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-2 flex flex-col calendar-sidebar-body">
                                    <div className="mb-3 flex">
                                        <input
                                            type="search"
                                            placeholder="Search events..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            aria-label="Search events"
                                            className="flex-grow rounded-l-md border border-gray-300 p-2 focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                        />
                                        <button type="button" className="bg-gray-200 text-gray-700 px-3 py-2 rounded-r-md hover:bg-gray-300 border border-gray-300 border-l-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="flex-grow calendar-sidebar-event-list overflow-y-auto">
                                        {filteredEventsFromServer.length > 0 ? (
                                            filteredEventsFromServer.map((event: ServerEventType) => (
                                                <EventItem key={event.id} event={event} />
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-center mt-3">No events found.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                        <div className="flex-grow calendar-fullcalendar-wrapper relative">
                            <BigCalendar
                                localizer={localizer}
                                events={events}
                                selectable={true}
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent}
                                view={view}
                                date={date}
                                onNavigate={handleNavigate}
                                onView={(view) => handleViewChange(view)}
                                views={['month', 'week', 'day', 'agenda']}
                                components={{
                                    ...components,
                                    toolbar: CustomToolbar,
                                }}
                                className="rbc-calendar-height"
                            />
                        </div>
                </div>

                {showModal && selectedInfo && (
                    <NewEventModal
                        selectedInfo={selectedInfo}
                        show={showModal}
                        onHide={hideModals}
                        onEventAddSuccess={handleEventAddSuccess}
                    />
                )}
                {showEditModal && editEventInfo && (
                    <EditEventModal
                        eventInfo={editEventInfo}
                        show={showEditModal}
                        onHide={hideModals}
                        onDeleteEvent={deleteEventFromCalendar}
                        onEventUpdateSuccess={handleEventUpdateSuccess}
                    />
                )}
                {showViewModal && viewEventInfo && (
                    <ViewEventModal 
                        showModal={showViewModal}
                        setEditEventInfo={setEditEventInfo}
                        setShowEditModal={setShowEditModal}
                        setShowViewModal={setShowViewModal}
                        setViewEventInfo={setViewEventInfo}
                        handleDeleteEvent={deleteEventFromCalendar}
                        onHide={hideModals}
                        eventInfo={viewEventInfo}
                    />
                )}
            </div>
        </div>
    );
}

export default Calendar;
