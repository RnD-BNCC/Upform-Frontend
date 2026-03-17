import type { FormEvent } from '@/types/form'
import { generateOrientationResponses, generateFeedbackResponses } from './response-generator'

const orientationResponses = generateOrientationResponses(28)
const feedbackResponses = generateFeedbackResponses(25)

export const mockEvents: FormEvent[] = [
  {
    id: '1',
    name: 'BNCC Orientation 2025',
    responses: orientationResponses,
    description: 'Registration form for new BNCC members joining this semester.',
    status: 'active',
    updatedAt: new Date('2025-03-10').toISOString(),
    responseCount: 142,
    color: '#0054a5',
    sections: [
      {
        id: 's1',
        title: '',
        fields: [
          {
            id: 'f1',
            type: 'short_text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full name',
          },
          {
            id: 'f2',
            type: 'short_text',
            label: 'Student ID',
            required: true,
            placeholder: '2501XXXXXX',
          },
          {
            id: 'f3',
            type: 'multiple_choice',
            label: 'Major',
            required: true,
            options: ['Computer Science', 'Information Systems', 'Accounting', 'Management'],
            branches: { 'Computer Science': 'sB', 'Accounting': 'sC' },
          },
          {
            id: 'f4',
            type: 'dropdown',
            label: 'Batch Year',
            required: true,
            options: ['2022', '2023', '2024', '2025'],
          },
        ],
      },
      {
        id: 'sB',
        title: 'Computer Science Track',
        fields: [
          {
            id: 'fB1',
            type: 'paragraph',
            label: 'Tell us about your programming background',
            required: false,
            placeholder: 'Languages, projects, or experiences you have...',
          },
          {
            id: 'fB3',
            type: 'rating',
            label: 'How excited are you to join BNCC?',
            required: false,
            scaleMin: 1,
            scaleMax: 5,
            minLabel: 'Not at all',
            maxLabel: 'Very excited',
          },
          {
            id: 'fB4',
            type: 'linear_scale',
            label: 'Rate your programming experience',
            required: false,
            scaleMin: 1,
            scaleMax: 10,
            minLabel: 'Beginner',
            maxLabel: 'Expert',
          },
          {
            id: 'fB2',
            type: 'multiple_choice',
            label: 'Which CS concentration interests you the most?',
            required: true,
            options: ['Software Development', 'Data Science & AI', 'UI/UX Design', 'Cybersecurity'],
            branches: {
              'Software Development': 'end',
              'Data Science & AI': 'end',
              'UI/UX Design': 'end',
              'Cybersecurity': 'end',
            },
          },
        ],
      },
      {
        id: 'sC',
        title: 'Accounting Track',
        fields: [
          {
            id: 'fC1',
            type: 'paragraph',
            label: 'Do you have any accounting or finance background?',
            required: false,
            placeholder: 'Courses, internships, or relevant experience...',
          },
          {
            id: 'fC2',
            type: 'multiple_choice',
            label: 'Which accounting focus interests you the most?',
            required: true,
            options: ['Financial Accounting', 'Audit', 'Tax', 'Management Accounting'],
            branches: {
              'Financial Accounting': 'end',
              'Audit': 'end',
              'Tax': 'end',
              'Management Accounting': 'end',
            },
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Tech Talk Feedback',
    responses: feedbackResponses,
    description: 'Post-event feedback for our monthly Tech Talk series.',
    status: 'closed',
    updatedAt: new Date('2025-03-05').toISOString(),
    responseCount: 87,
    color: '#003b76',
    sections: [
      {
        id: 's1',
        title: '',
        fields: [
          {
            id: 'f1',
            type: 'multiple_choice',
            label: 'How would you rate this event?',
            required: true,
            options: ['Excellent', 'Good', 'Average', 'Poor'],
          },
          {
            id: 'f2',
            type: 'paragraph',
            label: 'What did you enjoy the most?',
            required: false,
            placeholder: 'Share your thoughts...',
          },
          {
            id: 'f3',
            type: 'paragraph',
            label: 'Any suggestions for improvement?',
            required: false,
            placeholder: 'We value your feedback...',
          },
        ],
      },
    ],
  },
  {
    id: '3',
    name: 'Annual Member Survey 2025',
    description: 'Help us improve by sharing your experience as a BNCC member.',
    status: 'draft',
    updatedAt: new Date('2025-03-12').toISOString(),
    responseCount: 0,
    color: '#3383df',
    sections: [
      {
        id: 's1',
        title: '',
        fields: [],
      },
    ],
  },
]
