import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Download, Phone, Mail, Building, MapPin, Calendar, ArrowLeft, Home, Edit, Trash2, Plus } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/navigation/bottom-nav";

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  source?: string;
  createdAt: string;
}

export function ContactsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/contacts", user?.id],
    enabled: !!user?.id,
    queryFn: () => api.getContacts(user!.id),
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: (contact: Contact) => api.updateContact(contact.id, contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", user?.id] });
      setEditingContact(null);
      toast({
        title: "Contact Updated",
        description: "Contact has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update contact.",
        variant: "destructive",
      });
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => api.deleteContact(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", user?.id] });
      setDeletingContact(null);
      toast({
        title: "Contact Deleted",
        description: "Contact has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete contact.",
        variant: "destructive",
      });
    },
  });

  const downloadVCard = async (contactId: string, contactName: string) => {
    try {
      api.downloadVCard(contactId);
      toast({
        title: "VCard Downloaded",
        description: `Contact card for ${contactName} has been downloaded.`,
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <div className="w-20"></div> {/* Spacer for balance */}
        </div>
        
        <div className="text-center py-8">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p>Loading your contacts...</p>
        </div>
        
        {/* Bottom Navigation */}
        <div className="h-20" />
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <div className="w-20"></div> {/* Spacer for balance */}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Contacts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Start by uploading business cards or images with contact information in the OCR section.
              </p>
              <Badge variant="secondary">Business cards will automatically create contacts</Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Bottom Navigation */}
        <div className="h-20" />
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b pb-4 px-4 pt-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Badge variant="outline">{contacts.length}</Badge>
      </div>
      
      {/* Scrollable Contacts List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 mobile-page mobile-content">
        <div className="space-y-4">
          {contacts.map((contact: Contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header with Name and Actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">
                        {contact.firstName || contact.lastName 
                          ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                          : 'Contact'
                        }
                      </h3>
                      {contact.jobTitle && contact.company && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {contact.jobTitle} at {contact.company}
                        </p>
                      )}
                      {contact.jobTitle && !contact.company && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {contact.jobTitle}
                        </p>
                      )}
                      {!contact.jobTitle && contact.company && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {contact.company}
                        </p>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingContact(contact)}
                        className="smart-list-button"
                        title="Edit contact"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadVCard(
                          contact.id,
                          `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Contact'
                        )}
                        className="smart-list-button"
                        title="Download vCard"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingContact(contact)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 smart-list-button"
                        title="Delete contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2">
                    {contact.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${contact.email}`} className="hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    
                    {contact.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${contact.phone}`} className="hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    
                    {contact.address && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{contact.address}</span>
                      </div>
                    )}

                    {contact.notes && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2">
                        {contact.notes}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(contact.createdAt).toLocaleDateString()}</span>
                    </div>
                    {contact.source === 'business_card' && (
                      <Badge variant="secondary" className="text-xs">
                        Business Card
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Contact Dialog */}
      {editingContact && (
        <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
            </DialogHeader>
            <ContactForm 
              contact={editingContact}
              onSave={(updatedContact) => updateContactMutation.mutate(updatedContact)}
              onCancel={() => setEditingContact(null)}
              isLoading={updateContactMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingContact && (
        <Dialog open={!!deletingContact} onOpenChange={() => setDeletingContact(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete{' '}
                <span className="font-medium">
                  {deletingContact.firstName || deletingContact.lastName 
                    ? `${deletingContact.firstName || ''} ${deletingContact.lastName || ''}`.trim()
                    : 'this contact'
                  }
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeletingContact(null)}
                  disabled={deleteContactMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteContactMutation.mutate(deletingContact.id)}
                  disabled={deleteContactMutation.isPending}
                  className="smart-list-button"
                >
                  {deleteContactMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}

// Contact Form Component
interface ContactFormProps {
  contact: Contact;
  onSave: (contact: Contact) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ContactForm({ contact, onSave, onCancel, isLoading }: ContactFormProps) {
  const [formData, setFormData] = useState({
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    company: contact.company || '',
    jobTitle: contact.jobTitle || '',
    email: contact.email || '',
    phone: contact.phone || '',
    website: contact.website || '',
    address: contact.address || '',
    notes: contact.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...contact,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="smart-list-button"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="smart-list-button"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="company" className="text-sm font-medium">Company</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          className="smart-list-button"
        />
      </div>

      <div>
        <Label htmlFor="jobTitle" className="text-sm font-medium">Job Title</Label>
        <Input
          id="jobTitle"
          value={formData.jobTitle}
          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
          className="smart-list-button"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="smart-list-button"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="smart-list-button"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="website" className="text-sm font-medium">Website</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className="smart-list-button"
        />
      </div>

      <div>
        <Label htmlFor="address" className="text-sm font-medium">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="smart-list-button"
        />
      </div>

      <div>
        <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="smart-list-button"
        />
      </div>

      <div className="flex space-x-3 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="smart-list-button"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}