import api from './api';

export interface ContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface Contact extends ContactData {
  _id: string;
  status: 'new' | 'read' | 'responded';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactResponse {
  success: boolean;
  data: Contact;
}

class ContactService {
  async create(data: ContactData): Promise<ContactResponse> {
    const response = await api.post<ContactResponse>('/contacts', data);
    return response.data;
  }
}

export default new ContactService();
