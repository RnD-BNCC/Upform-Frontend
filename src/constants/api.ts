export const Api = {
  events: '/events',
  eventDetail: (id: string) => `/events/${id}`,
  sections: (eventId: string) => `/events/${eventId}/sections`,
  sectionDetail: (eventId: string, sectionId: string) =>
    `/events/${eventId}/sections/${sectionId}`,
  sectionsReorder: (eventId: string) =>
    `/events/${eventId}/sections/reorder`,
  responses: (eventId: string) => `/events/${eventId}/responses`,
  responseDetail: (eventId: string, responseId: string) =>
    `/events/${eventId}/responses/${responseId}`,
} as const
