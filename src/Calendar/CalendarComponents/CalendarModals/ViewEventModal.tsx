import { useState, useEffect } from 'react';
// Removed react-bootstrap imports
// import { Modal, Button, Row, Col, Badge, Container, Card } from 'react-bootstrap';
import { Calendar, MapPin, Briefcase, FileText, User, Mail, Flag, Building, AlignLeft, Send } from 'lucide-react';
import { formatDate, getPriorityColor } from '../../../utils/utilityFunctions';


interface ViewEventModalProps {
  eventInfo: {
    event: {
      id: string;
      title: string;
      start?: Date;
      end?: Date;
      allDay?: boolean;
      extendedProps: {
        matter_title?: string;
        caseNumber?: string;
        client_name?: string;
        client_email?: string;
        case_reason?: string;
        priority?: string;
        location?: string;
        court?: string;
        description?: string;
        attendees?: string[];
      };
      startStr?: string;
      endStr?: string;
    };
  } | null;
  showModal: boolean;
  onHide: () => void;
  setEditEventInfo: (info: any) => void;
  setShowEditModal: (show: boolean) => void;
  setShowViewModal: (show: boolean) => void;
  setViewEventInfo: (info: any) => void;
  handleDeleteEvent: (info: any) => void;
}

export default function CalendarViewEventModal(props: ViewEventModalProps) {
  const {
    eventInfo,
    showModal,
    onHide,
    setEditEventInfo,
    setShowEditModal,
    setShowViewModal,
    setViewEventInfo,
    handleDeleteEvent
  } = props;
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (showReminder) {
      const timer = setTimeout(() => {
        setShowReminder(false);
      }, 3000);
      // This cleanup function clears the timer if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [showReminder]);

  if (!eventInfo || !eventInfo.event) {
    return null; // Or some loading/error state
  }
  const { event } = eventInfo; // FullCalendar EventApi object

  const handleEditEventClick = () => {
    // Send click info to event modal
    setEditEventInfo(eventInfo);
    setShowViewModal(false);
    setShowEditModal(true);
    setViewEventInfo(true);
  };

  const handleDelete = () =>{
    handleDeleteEvent(eventInfo)
  }

  const eventData = {
    id: event.id,
    matter_title: event.extendedProps.matter_title,
    title: event.title,
    caseNumber: event.extendedProps.caseNumber,
    client_name: event.extendedProps.client_name,
    client_email: event.extendedProps.client_email,
    case_reason: event.extendedProps.case_reason,
    priority: event.extendedProps.priority,
    location: event.extendedProps.location,
    court: event.extendedProps.court,
    description: event.extendedProps.description,
    start_date: event.startStr,
    end_date: event.endStr,
    startStr: event.startStr,
    endStr: event.endStr,
    allDay: event.allDay,
    backgroundColor: null,
    attendees: event.extendedProps.attendees,
  };

   const handleSendReminder = () => {
    setShowReminder(true);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${showModal ? 'block' : 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-auto my-8 overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-blue-600 text-white">
          <h5 className="text-xl font-bold">{eventData.title}</h5>
          <button type="button" onClick={onHide} className="text-white hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-0">
          <div className="bg-gray-100 p-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Calendar size={20} className="text-blue-600 mr-2" />
                <span className="font-bold text-gray-700">
                  {formatDate(eventData.start_date || '')} -{" "}
                  {formatDate(eventData.end_date || '')}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(eventData.priority || '')}`}>
                {eventData.priority} Priority
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="h-full shadow-sm rounded-lg overflow-hidden">
                  <div className="bg-white p-3 border-b border-gray-200">
                    <h5 className="mb-0 text-blue-600 font-semibold">Case Details</h5>
                  </div>
                  <div className="p-4">
                    <div className="mb-3 flex items-start">
                      <Briefcase size={18} className="text-gray-500 mr-2 mt-1" />
                      <div>
                        <div className="text-gray-500 text-sm">
                          Matter Title
                        </div>
                        <div className="font-semibold">
                          {eventData.matter_title}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 flex items-start">
                      <FileText size={18} className="text-gray-500 mr-2 mt-1" />
                      <div>
                        <div className="text-gray-500 text-sm">
                          Case Number
                        </div>
                        <div className="font-semibold">
                          {eventData.caseNumber}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 flex items-start">
                      <Flag size={18} className="text-gray-500 mr-2 mt-1" />
                      <div>
                        <div className="text-gray-500 text-sm">
                          Case Reason
                        </div>
                        <div className="font-semibold">
                          {eventData.case_reason}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Building size={18} className="text-gray-500 mr-2 mt-1" />
                      <div>
                        <div className="text-gray-500 text-sm">Court</div>
                        <div className="font-semibold">{eventData.court}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="h-full shadow-sm rounded-lg overflow-hidden">
                  <div className="bg-white p-3 border-b border-gray-200">
                    <h5 className="mb-0 text-blue-600 font-semibold">Client Information</h5>
                  </div>
                  <div className="p-4">
                    <div className="mb-3 flex items-start">
                      <User size={18} className="text-gray-500 mr-2 mt-1" />
                      <div>
                        <div className="text-gray-500 text-sm">
                          Client Name
                        </div>
                        <div className="font-semibold">
                          {eventData.client_name}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 flex items-start">
                      <Mail size={18} className="text-gray-500 mr-2 mt-1" />
                      <div>
                        <div className="text-gray-500 text-sm">Email</div>
                        <div className="font-semibold">
                          {eventData.client_email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin size={18} className="text-gray-500 mr-2 mt-1" />
                      <div>
                        <div className="text-gray-500 text-sm">Location</div>
                        <div className="font-semibold">{eventData.location}</div>
                      </div>
                    </div>
                    <hr className="my-4 border-gray-200"></hr>
                    {showReminder && (
                      <div className="bg-yellow-100 text-yellow-800 p-2 rounded-md mb-2">
                        Reminder sent to {eventData.client_email}!
                      </div>
                    )}
                    <button
                      type="button"
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 w-full flex items-center justify-center"
                      onClick={handleSendReminder}
                      disabled={showReminder}
                    >
                      <Send size={16} className="mr-1" />
                      Send Reminder
                    </button>
                  </div>
                </div>
              </div>

              {eventData.description && (
                <div className="md:col-span-2">
                  <div className="shadow-sm rounded-lg overflow-hidden">
                    <div className="bg-white p-3 border-b border-gray-200">
                      <h5 className="mb-0 text-blue-600 font-semibold">Description</h5>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start">
                        <AlignLeft size={18} className="text-gray-500 mr-2 mt-1" />
                        <div className="font-normal">{eventData.description}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between p-4 border-t border-gray-200">
          <button type="button" className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600" onClick={handleDelete}>
            Delete
          </button>
          <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700" onClick={handleEditEventClick}>
            Edit Event
          </button>
        </div>
      </div>
    </div>
  );
}