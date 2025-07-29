import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const mockEvents = [
    {
        id: 1,
        title: 'Meeting with Client',
        start_date: '2025-07-28T10:00:00',
        end_date: '2025-07-28T11:00:00',
        all_day: false,
        description: 'Discuss project requirements',
        client_name: 'John Doe',
        matter_title: 'Project Alpha',
        priority: 'High',
        case_reason: 'Hearing',
        client_email: 'john.doe@example.com',
        caseNumber: 'CASE-123',
        location: 'Virtual',
        court: 'N/A',
        attendees: ['1', '2']
    },
    {
        id: 2,
        title: 'Team Standup',
        start_date: '2025-07-29T09:00:00',
        end_date: '2025-07-29T09:30:00',
        all_day: false,
        description: 'Daily team sync',
        client_name: 'N/A',
        matter_title: 'Internal',
        priority: 'Medium',
        case_reason: 'Other',
        client_email: 'N/A',
        caseNumber: 'N/A',
        location: 'Office',
        court: 'N/A',
        attendees: ['1']
    }
];

const mockCases = [
    { id: 1, caseNumber: 'CASE-001', matter_title: 'The People vs. John Doe', clientID: 'C-1', client_name: 'John Doe' },
    { id: 2, caseNumber: 'CASE-002', matter_title: 'Smith vs. Smith', clientID: 'C-2', client_name: 'Jane Smith' },
];

const mockEmployees = [
    { id: '1', full_name: 'Alice Johnson' },
    { id: '2', full_name: 'Bob Williams' },
    { id: '3', full_name: 'Charlie Brown' },
];

app.get('/pms/calendar-events/', (req, res) => {
    res.json(mockEvents);
});

app.get('/pms/cases/', (req, res) => {
    res.json(mockCases);
});

app.get('/pms/employees/', (req, res) => {
    res.json(mockEmployees);
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
